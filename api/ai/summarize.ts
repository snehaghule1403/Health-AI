import { route, authUser, rateLimit, callClaude, parseJson, str, HttpError, SAFETY_RULES, DISCLAIMER, AI_MODEL } from '../_lib.js';

const SYSTEM = `You summarise the text of a medical report for the patient in plain language.
${SAFETY_RULES}
Only list values that appear verbatim in the report text, with their original units and reference ranges.
Set a value's status to "high" or "low" ONLY if the report itself gives a reference range or flag showing that; otherwise use "info".
Reply with ONLY a JSON object of this shape:
{"summary": string, "keyFindings": string[], "importantValues": [{"name": string, "value": string, "referenceRange": string|null, "status": "normal"|"low"|"high"|"info"}], "simpleExplanation": string, "questionsForDoctor": string[], "missingOrUncertain": string[]}`;

export default route('POST', async (req) => {
  const { db, userId } = await authUser(req);
  const recordId = str(req.body?.recordId, 'recordId', 64);
  // RLS ensures the caller is the owner or a doctor with current consent.
  const { data: record, error } = await db.from('medical_records')
    .select('id, patient_id, name, type, record_date, extracted_text').eq('id', recordId).maybeSingle();
  if (error || !record) throw new HttpError(404, 'Record not found or access denied.');
  if (!record.extracted_text?.trim()) throw new HttpError(400, 'This record has no extracted text. Run OCR first.');
  await rateLimit(db, userId, 'summarize');

  const prompt = `Report: ${record.name} (${record.type}, dated ${record.record_date})\n\n<report_text>\n${record.extracted_text.slice(0, 30000)}\n</report_text>`;
  const raw = await callClaude(SYSTEM, [{ role: 'user', content: prompt }], 2000);
  const parsed = parseJson<Record<string, unknown>>(raw);
  const list = (v: unknown) => (Array.isArray(v) ? v.map(String) : []);
  const analysis = {
    summary: String(parsed.summary ?? ''),
    keyFindings: list(parsed.keyFindings),
    importantValues: Array.isArray(parsed.importantValues) ? parsed.importantValues : [],
    simpleExplanation: String(parsed.simpleExplanation ?? ''),
    questionsForDoctor: list(parsed.questionsForDoctor),
    missingOrUncertain: list(parsed.missingOrUncertain),
    disclaimer: DISCLAIMER,
    generatedAt: new Date().toISOString(),
    model: AI_MODEL,
  };
  // Only the owner can write; a doctor's analysis is returned but not saved.
  if (record.patient_id === userId) {
    await db.from('medical_records').update({ ai_analysis: analysis, updated_at: new Date().toISOString() }).eq('id', record.id);
  }
  return { analysis };
});
