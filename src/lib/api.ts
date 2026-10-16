import { supabase } from './supabase';

/** Calls one of our /api routes with the current user's access token. */
export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error('Not signed in.');
  let res: Response;
  try {
    res = await fetch(path, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error('Network error. Check your connection and try again.');
  }
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error ?? `Request failed (${res.status}).`);
  return json as T;
}

export type AIStatus = { supabase: boolean; ai: boolean; model: string };

export async function getAIStatus(): Promise<AIStatus | null> {
  try {
    const res = await fetch('/api/ai/status');
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
