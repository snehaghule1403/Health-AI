// Static safety checks that run without any external services: `npm test`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const walk = (dir) => readdirSync(dir).flatMap((f) => {
  const p = join(dir, f);
  return statSync(p).isDirectory() ? walk(p) : [p];
});
const src = walk('src').filter((f) => /\.(ts|tsx)$/.test(f)).map((f) => [f, readFileSync(f, 'utf8')]);

test('frontend never references server-only secrets', () => {
  for (const [f, s] of src) {
    // Flags reading server env vars or embedding key material — not UI text naming a variable.
    assert.ok(!/SERVICE_ROLE|sk-ant-|process\.env|import\.meta\.env\.(?!VITE_|DEV\b|PROD\b|MODE\b)/.test(s), `${f} references a server secret`);
  }
});

test('frontend does not use localStorage as a data store', () => {
  for (const [f, s] of src) assert.ok(!/localStorage\.setItem\(['"]healthai_state/.test(s), `${f} stores app data in localStorage`);
});

test('no hardcoded demo data or canned AI modules remain', () => {
  for (const [f, s] of src) {
    assert.ok(!/demoData|aiUtils|DEMO_TRENDS|DEMO_USERS/.test(s), `${f} imports demo data`);
  }
});

test('no fixed 10-row limits in data loading', () => {
  const ctx = readFileSync('src/context/AppContext.tsx', 'utf8');
  assert.ok(!/\.limit\(10\)/.test(ctx), 'AppContext limits rows to 10');
  assert.match(ctx, /fetchAll/, 'AppContext should page through all rows');
});

test('migration enables RLS on every table it creates', () => {
  const sql = readFileSync('supabase/migrations/0001_init.sql', 'utf8');
  const tables = [...sql.matchAll(/create table public\.(\w+)/g)].map((m) => m[1]);
  assert.ok(tables.length >= 10);
  for (const t of tables) assert.match(sql, new RegExp(`alter table public\\.${t} enable row level security`), `RLS missing on ${t}`);
});

test('storage bucket is private', () => {
  const sql = readFileSync('supabase/migrations/0001_init.sql', 'utf8');
  assert.match(sql, /'medical-files', 'medical-files', false/);
});

test('.env files are git-ignored', () => {
  const gi = readFileSync('.gitignore', 'utf8');
  assert.match(gi, /^\.env$/m);
  assert.match(gi, /^\.env\.local$/m);
});

test('emergency QR links use the public site URL, not the current origin', () => {
  const page = readFileSync('src/pages/patient/EmergencyProfile.tsx', 'utf8');
  assert.match(page, /\$\{PUBLIC_SITE_URL\}\/emergency\//);
  assert.ok(!/window\.location\.origin\}\/emergency/.test(page), 'QR must not use window.location.origin');
  const site = readFileSync('src/lib/siteUrl.ts', 'utf8');
  const def = site.match(/DEFAULT_PUBLIC_SITE_URL = '([^']+)'/)?.[1];
  assert.equal(def, 'https://health-ai-omega-three.vercel.app', 'default must be the public production domain');
});

test('auth email links never use the current origin on deployed builds', () => {
  const ctx = readFileSync('src/context/AppContext.tsx', 'utf8');
  assert.ok(!/window\.location\.origin\}\/(login|reset-password)/.test(ctx), 'auth redirects must use authRedirectOrigin()');
  assert.match(ctx, /emailRedirectTo: `\$\{authRedirectOrigin\(\)\}/);
  assert.match(ctx, /redirectTo: `\$\{authRedirectOrigin\(\)\}\/reset-password`/);
});

test('voice assistant can use the microphone and stores no audio', () => {
  const vercel = JSON.parse(readFileSync('vercel.json', 'utf8'));
  const policy = vercel.headers.flatMap((h) => h.headers).find((h) => h.key === 'Permissions-Policy')?.value ?? '';
  assert.match(policy, /microphone=\(self\)/);
  const speech = readFileSync('src/lib/speech.ts', 'utf8');
  assert.ok(!/MediaRecorder|getUserMedia|supabase/.test(speech), 'speech module must not record or upload audio');
});

test('login page always offers the form and a way to switch accounts', () => {
  const page = readFileSync('src/pages/LoginPage.tsx', 'utf8');
  // Auto-continue is allowed only for an email-verification callback.
  assert.match(page, /fromEmailLink && ready && currentUser/);
  assert.match(page, /Log out & switch account/);
  assert.ok(!/useState\('[^']+@[^']+'\)/.test(page), 'no hardcoded email defaults');
  const ctx = readFileSync('src/context/AppContext.tsx', 'utf8');
  assert.match(ctx, /signOut\(\{ scope: 'local' \}\)/, 'logout must always clear the local session');
  assert.match(ctx, /loadSeq/, 'stale loads from a previous account must be discarded');
});
