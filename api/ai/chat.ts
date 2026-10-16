import { route, authUser, rateLimit, callClaude, str, HttpError, SAFETY_RULES, DISCLAIMER } from '../_lib.js';

const SYSTEM = `You answer general health and wellness questions for a patient using the HealthAI app.
${SAFETY_RULES}
Keep answers under 250 words. End with one or two short follow-up questions the user might ask, on a line starting "Follow-up:".`;

export default route('POST', async (req) => {
  const { db, userId, role } = await authUser(req);
  if (role !== 'patient') throw new HttpError(403, 'Only patients can use the assistant.');
  const message = str(req.body?.message, 'message', 2000);
  await rateLimit(db, userId, 'chat');

  // Last 10 turns of saved history give the model context (stored privately per patient).
  const { data: history } = await db.from('chat_messages').select('role, content')
    .eq('patient_id', userId).order('created_at', { ascending: false }).limit(10);
  const messages: { role: 'user' | 'assistant'; content: string }[] =
    [...(history ?? []).reverse(), { role: 'user', content: message }];
  // The API requires the first message to be from the user.
  while (messages.length && messages[0].role !== 'user') messages.shift();

  const reply = await callClaude(SYSTEM, messages, 800);
  await db.from('chat_messages').insert([
    { patient_id: userId, role: 'user', content: message },
    { patient_id: userId, role: 'assistant', content: reply },
  ]);
  return { reply, disclaimer: DISCLAIMER };
});
