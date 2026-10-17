import { route, authUser, rateLimit, callClaude, str, HttpError, SAFETY_RULES, DISCLAIMER } from '../_lib.js';

const SYSTEM = `You answer general health and wellness questions for a patient using the HealthAI app.
${SAFETY_RULES}
Keep answers under 250 words. End with one or two short follow-up questions the user might ask, on a line starting "Follow-up:".`;

// Reply language chosen in the app (voice or text). Medical terms may stay in English in brackets.
const LANGUAGES: Record<string, string> = { en: 'English', hi: 'Hindi (Devanagari script)', mr: 'Marathi (Devanagari script)' };

export default route('POST', async (req) => {
  const { db, userId, role } = await authUser(req);
  if (role !== 'patient') throw new HttpError(403, 'Only patients can use the assistant.');
  const message = str(req.body?.message, 'message', 2000);
  const lang = req.body?.language;
  const language = typeof lang === 'string' && Object.hasOwn(LANGUAGES, lang) ? LANGUAGES[lang] : LANGUAGES.en;
  await rateLimit(db, userId, 'chat');

  // Last 10 turns of saved history give the model context (stored privately per patient).
  const { data: history } = await db.from('chat_messages').select('role, content')
    .eq('patient_id', userId).order('created_at', { ascending: false }).limit(10);
  const messages: { role: 'user' | 'assistant'; content: string }[] =
    [...(history ?? []).reverse(), { role: 'user', content: message }];
  // The API requires the first message to be from the user.
  while (messages.length && messages[0].role !== 'user') messages.shift();

  const system = `${SYSTEM}
Write your whole reply in ${language}, in short, clear sentences that also read well aloud. You may add the English medical term in brackets. The "Follow-up:" label stays in English.`;
  const reply = await callClaude(system, messages, 1000);
  await db.from('chat_messages').insert([
    { patient_id: userId, role: 'user', content: message },
    { patient_id: userId, role: 'assistant', content: reply },
  ]);
  return { reply, disclaimer: DISCLAIMER };
});
