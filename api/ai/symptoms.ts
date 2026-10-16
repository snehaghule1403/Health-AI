import { route, authUser, rateLimit, callClaude, str, HttpError, SAFETY_RULES, DISCLAIMER } from '../_lib.js';

const SYSTEM = `You provide general educational information about symptoms a patient reports.
${SAFETY_RULES}
Structure your answer with these headings: "Urgency", "Possible general causes (not a diagnosis)", "Self-care that is generally safe", "When to see a doctor".
Start "Urgency" with exactly one of: EMERGENCY, SEE A DOCTOR SOON, or ROUTINE. Under 300 words.`;

const SEVERITIES = ['Mild', 'Moderate', 'Severe'];

export default route('POST', async (req) => {
  const { db, userId, role } = await authUser(req);
  if (role !== 'patient') throw new HttpError(403, 'Only patients can use the symptom checker.');
  const symptom = str(req.body?.symptom, 'symptom', 500);
  const duration = str(req.body?.duration, 'duration', 100, false);
  const frequency = str(req.body?.frequency, 'frequency', 100, false);
  const notes = str(req.body?.notes, 'notes', 1000, false);
  const severity = str(req.body?.severity, 'severity', 20);
  if (!SEVERITIES.includes(severity)) throw new HttpError(400, 'Invalid severity.');
  await rateLimit(db, userId, 'symptoms');

  const prompt = `Symptom(s): ${symptom}\nDuration: ${duration || 'not given'}\nSeverity: ${severity}\nFrequency: ${frequency || 'not given'}\nOther context: ${notes || 'none'}`;
  const reply = await callClaude(SYSTEM, [{ role: 'user', content: prompt }], 900);
  const { data, error } = await db.from('symptoms').insert({
    patient_id: userId, symptom, duration, severity, frequency, notes, ai_response: reply,
  }).select().single();
  if (error) throw new HttpError(500, 'Could not save the symptom entry.');
  return { reply, symptom: data, disclaimer: DISCLAIMER };
});
