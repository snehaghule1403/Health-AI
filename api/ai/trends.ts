import { route, authUser, rateLimit, callAI, str, HttpError, SAFETY_RULES, DISCLAIMER } from '../_lib.js';

const SYSTEM = `You describe patterns in a patient's recorded health measurements.
${SAFETY_RULES}
Describe only what the data shows (direction, range, consistency). Never claim causes. If there are fewer than 3 points for a measure, say there is not enough data. Do not compare values with different units. Under 200 words.`;

export default route('POST', async (req) => {
  const { db, userId } = await authUser(req);
  const patientId = str(req.body?.patientId, 'patientId', 64, false) || userId;
  // RLS limits rows to the owner or a consented doctor.
  const [{ data: m }, { data: w }] = await Promise.all([
    db.from('health_measurements').select('measured_on, kind, value, unit').eq('patient_id', patientId).order('measured_on').limit(500),
    db.from('wellness_entries').select('entry_date, weight_kg, sleep_hours, exercise_minutes, water_glasses').eq('patient_id', patientId).order('entry_date').limit(365),
  ]);
  if (!(m?.length || w?.length)) throw new HttpError(400, 'No recorded measurements to summarise yet.');
  await rateLimit(db, userId, 'trends');
  const measurements = (m ?? []).map(r => `${r.measured_on}, ${r.kind}, ${r.value}, ${r.unit}`).join('\n') || 'none';
  const wellness = (w ?? []).map(r => `${r.entry_date}, ${r.weight_kg ?? '-'}, ${r.sleep_hours}, ${r.exercise_minutes}, ${r.water_glasses}`).join('\n') || 'none';
  const prompt = `Measurements (date, kind, value, unit):\n${measurements}\n\nDaily wellness (date, weight kg, sleep h, exercise min, water glasses):\n${wellness}`;
  const summary = await callAI(SYSTEM, [{ role: 'user', content: prompt }], 700);
  return { summary, disclaimer: DISCLAIMER };
});
