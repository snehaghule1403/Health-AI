// Shared helpers for the serverless API. Files starting with "_" are not routes.
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
export const AI_MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5';

// Per-user limit on AI calls in a rolling hour.
const AI_CALLS_PER_HOUR = Number(process.env.AI_CALLS_PER_HOUR || 30);

export const DISCLAIMER =
  'This AI-generated information is for general education only. It is not a diagnosis and does not replace a qualified clinician. In an emergency, call your local emergency number.';

export class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export function aiConfigured() {
  return { supabase: Boolean(SUPABASE_URL && SUPABASE_ANON_KEY), ai: Boolean(ANTHROPIC_API_KEY), model: AI_MODEL };
}

/** Wraps a handler with method check, JSON errors and no-store caching. */
export function route(method: 'GET' | 'POST', fn: (req: VercelRequest, res: VercelResponse) => Promise<unknown>) {
  return async (req: VercelRequest, res: VercelResponse) => {
    res.setHeader('Cache-Control', 'no-store');
    if (req.method !== method) return res.status(405).json({ error: 'Method not allowed' });
    try {
      const body = await fn(req, res);
      if (!res.headersSent) res.status(200).json(body);
    } catch (e) {
      const status = e instanceof HttpError ? e.status : 500;
      const message = e instanceof HttpError ? e.message : 'Internal server error';
      // Never log request bodies: they may contain health information.
      if (status === 500) console.error('API error:', (e as Error)?.message);
      if (!res.headersSent) res.status(status).json({ error: message });
    }
  };
}

/** Returns a Supabase client acting as the caller, so RLS applies to every query. */
export async function authUser(req: VercelRequest): Promise<{ db: SupabaseClient; userId: string; role: string }> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) throw new HttpError(503, 'Supabase is not configured on the server.');
  const token = (req.headers.authorization ?? '').replace(/^Bearer\s+/i, '');
  if (!token) throw new HttpError(401, 'Not signed in.');
  const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await db.auth.getUser(token);
  if (error || !data.user) throw new HttpError(401, 'Session expired. Please sign in again.');
  const { data: profile } = await db.from('profiles').select('role').eq('id', data.user.id).single();
  if (!profile) throw new HttpError(403, 'Profile not found.');
  return { db, userId: data.user.id, role: profile.role };
}

export async function rateLimit(db: SupabaseClient, userId: string, endpoint: string) {
  const since = new Date(Date.now() - 3600_000).toISOString();
  const { count, error } = await db.from('ai_usage').select('id', { count: 'exact', head: true })
    .eq('user_id', userId).gte('created_at', since);
  if (error) throw new HttpError(500, 'Could not check usage.');
  if ((count ?? 0) >= AI_CALLS_PER_HOUR) throw new HttpError(429, 'AI usage limit reached. Please try again later.');
  await db.from('ai_usage').insert({ user_id: userId, endpoint });
}

export function str(v: unknown, name: string, max: number, required = true): string {
  if (v === undefined || v === null || v === '') {
    if (required) throw new HttpError(400, `${name} is required.`);
    return '';
  }
  if (typeof v !== 'string') throw new HttpError(400, `${name} must be text.`);
  const s = v.trim();
  if (s.length > max) throw new HttpError(400, `${name} is too long (max ${max} characters).`);
  return s;
}

type Msg = { role: 'user' | 'assistant'; content: string };

/** Calls the Anthropic Messages API. Throws a clear error if not configured. */
export async function callClaude(system: string, messages: Msg[], maxTokens = 1500): Promise<string> {
  if (!ANTHROPIC_API_KEY) throw new HttpError(503, 'AI provider is not configured (ANTHROPIC_API_KEY missing).');
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 45_000);
  let r: Response;
  try {
    r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      signal: ctrl.signal,
      headers: {
        'content-type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({ model: AI_MODEL, max_tokens: maxTokens, system, messages }),
    });
  } catch {
    throw new HttpError(504, 'The AI provider did not respond in time. Please try again.');
  } finally {
    clearTimeout(timer);
  }
  if (r.status === 429) throw new HttpError(429, 'The AI provider is rate-limiting requests. Please try again shortly.');
  if (r.status === 401 || r.status === 403) throw new HttpError(503, 'The AI provider rejected the API key.');
  if (!r.ok) throw new HttpError(502, `The AI provider returned an error (${r.status}).`);
  const data = await r.json() as { content?: { type: string; text?: string }[] };
  const text = (data.content ?? []).filter(b => b.type === 'text').map(b => b.text).join('').trim();
  if (!text) throw new HttpError(502, 'The AI provider returned an empty response.');
  return text;
}

/** Extracts the first JSON object from a model reply. */
export function parseJson<T>(text: string): T {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start < 0 || end < start) throw new HttpError(502, 'The AI response was not in the expected format.');
  try { return JSON.parse(text.slice(start, end + 1)) as T; }
  catch { throw new HttpError(502, 'The AI response was not in the expected format.'); }
}

export const SAFETY_RULES = `Safety rules you must always follow:
- You are a health-information assistant inside the HealthAI app, not a clinician. Never give a definitive diagnosis.
- Never invent measurements, report values, facts or citations. If information is missing or unclear, say so.
- Never tell the user to start, stop or change a medication or dose; refer them to their clinician.
- If anything suggests an emergency (e.g. chest pain, difficulty breathing, stroke signs, severe bleeding, suicidal thoughts, anaphylaxis, loss of consciousness), tell the user to contact emergency services immediately, before anything else.
- Use plain, calm language.`;
