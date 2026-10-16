# HealthAI — AI-Powered Personal Health Record Manager

> Your Health. One Secure Place.

A full-stack React + TypeScript app (Vite) for keeping personal health records. It uses Supabase for auth, the Postgres database and private file storage, and Vercel serverless functions for AI features (Anthropic Claude). OCR runs in the browser with Tesseract.js and pdf.js.

> **Educational project.** HealthAI is not a medical device. It has not been clinically validated or certified for regulatory compliance (HIPAA, DPDP, etc.), and AI output is never a diagnosis.

## Architecture

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, React Router, Recharts, lucide-react |
| Auth | Supabase Auth (email + password, password recovery) |
| Database | Supabase Postgres with Row Level Security on every table |
| Files | Private Supabase Storage bucket `medical-files`, 5-minute signed URLs |
| AI | `/api/ai/*` Vercel functions calling the Anthropic Messages API (key stays on the server) |
| OCR | Tesseract.js (images and scanned PDF pages) and pdf.js (text PDFs), both in the browser |
| QR | `qrcode` library; the QR holds only a link with a revocable 256-bit token |

### Security model
- **Roles** live in `profiles.role`, set by a database trigger at sign-up. A trigger stops users from changing their own `role` or `doctor_verified` value.
- **Doctors** can register, but they see no patient data until an administrator sets `doctor_verified = true`.
- **Consent** is enforced in the database. Every doctor-read policy calls `doctor_has_consent(patient_id)`, so revoking consent blocks the doctor's very next query. Consent changes are written to `consent_audit_logs` by a trigger.
- **Files** are stored under `<patient_id>/…`. Storage policies allow the owner, or a verified doctor with current consent, to read them.
- **AI routes** check the caller's Supabase JWT and query as that user, so RLS still applies. Each user gets 30 AI calls per hour by default. Request bodies are never logged.
- **Emergency page** (`/emergency/<token>`) uses the `get_emergency_profile` RPC. It returns only the emergency fields, and only for a valid token.

## Project layout
```
api/                 Vercel serverless functions (AI endpoints + shared helpers)
scripts/seed.mjs     Fictional demo data (12 doctors, 12 patients, records, wellness …)
src/context/         AppContext — loads and mutates data via Supabase
src/lib/             supabase client, API helper, OCR
src/components/      Sidebar, AIAnalysisView, TrendsPanel
src/pages/           Landing, auth, patient and doctor pages, public emergency page
supabase/migrations/ Schema, RLS policies, storage bucket and functions
tests/               Static safety checks (npm test)
```

## 1. Supabase setup
1. Create a project at https://supabase.com.
2. In **SQL Editor**, paste and run `supabase/migrations/0001_init.sql`. If you use the Supabase CLI, run `supabase link` and then `supabase db push` instead.
3. Go to **Authentication → URL Configuration**:
   - Site URL: `https://health-ai-omega-three.vercel.app`
   - Redirect URLs: `https://health-ai-omega-three.vercel.app/**` and `http://localhost:3000/**` (also `http://localhost:5173/**`)
4. Optional: under **Authentication → Providers → Email**, turn off "Confirm email" for quicker testing. Leave it on for production.
5. Copy the **Project URL** and **anon public key** from **Project Settings → API**.

### Verifying a doctor
Run this in the SQL editor:
```sql
update public.profiles set doctor_verified = true where email = 'doctor@example.com';
```

## 2. Environment variables
Copy `.env.example` to `.env.local`.

| Variable | Where | Secret? |
|---|---|---|
| `VITE_SUPABASE_URL` | `.env.local` and Vercel (all environments) | No |
| `VITE_SUPABASE_ANON_KEY` | `.env.local` and Vercel | No (RLS protects data) |
| `ANTHROPIC_API_KEY` | `.env.local` (for `vercel dev`) and Vercel only | **Yes** |
| `ANTHROPIC_MODEL` | optional; defaults to `claude-sonnet-5-5` | No |
| `AI_CALLS_PER_HOUR` | optional; defaults to 30 | No |
| `SUPABASE_SERVICE_ROLE_KEY` | your shell, only when running `npm run seed`. **Never in Vercel or the frontend** | **Yes** |
| `SEED_PASSWORD` | your shell, only for seeding | Yes |

## 3. Run locally
```bash
npm install
npm test            # static safety checks
npm run type-check
npx vercel dev      # runs the frontend and /api functions on http://localhost:3000
```
`npm run dev` (plain Vite) also works for the UI, but `/api` routes won't exist, so AI features show a clear "API not reachable" error.

### Demo data (fictional)
```bash
SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... SEED_PASSWORD=... npm run seed
```
This creates `doctor1..12@healthai.test` (verified) and `patient1..12@healthai.test`, each with records, wellness, measurements, medicines, vaccines and consents. Set `SEED_PATIENTS` or `SEED_DOCTORS` to create more.

## 4. Deploy to Vercel
1. Push this branch to GitHub and open a PR. The Vercel GitHub integration builds a **preview** deployment, and production stays untouched.
2. In Vercel → Project → Settings → Environment Variables, add `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` and `ANTHROPIC_API_KEY` for Production and Preview.
3. Test the preview URL, then merge to `main` to update production.
4. Add the preview domain pattern to the Supabase redirect URLs if you test password reset on previews.

`vercel.json` rewrites every non-`/api` path to `index.html`, so direct links and page refreshes work.

## Features
- **Patients:** dashboard computed from real data; records with upload, view, download, search, filter, sort, pagination and confirmed delete; OCR with review and correction; AI report summaries saved per record; AI assistant with private history; symptom checker with urgency triage; daily wellness log (water against a goal, sleep, exercise, weight, meals) with history; BMI; medicines (active and completed, mark taken, edit); vaccinations (completed, upcoming or overdue, edit); health measurements with date-range charts and an AI trend summary; emergency profile with QR (enable, regenerate, disable); doctor consent (grant or revoke, with audit history); settings (profile, password, AI status, privacy).
- **Doctors:** dashboard; searchable, paginated list of authorized patients; patient records with signed-URL file access and on-demand AI summaries; medicines and vaccines; trends; history timeline; consent list; settings.

## Known limitations
- **Reminders:** no background or push notifications. Upcoming doses appear only in the app. Real reminders would need a scheduler, such as Supabase cron plus an email or push provider.
- **OCR:** English only, processed in the browser, first 10 PDF pages only. Accuracy drops on handwriting, low-resolution or rotated scans, so always review the extracted text before saving it.
- **Lists:** loaded client-side through paged fetches with no row cap, which suits hundreds to low thousands of rows per user. Very large accounts would need server-side pagination.
- **Doctor verification:** manual, done in SQL.
- **Signed URLs:** valid for 5 minutes. A link issued before consent was revoked stays usable until it expires.
- **Compliance:** none claimed. A security review is needed before handling real patient data.
