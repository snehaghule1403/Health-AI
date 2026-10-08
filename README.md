# HealthAI — AI-Powered Personal Health Record Manager

> Academic prototype — College Project

A secure, AI-powered healthcare platform where patients can store medical records, use AI to understand reports, track wellness, and share records with doctors through patient-controlled consent.

---

## Live Demo

> Deploy to Vercel and get a URL like `https://health-ai-prototype.vercel.app`

**Demo Credentials:**
| Role | Email | Password |
|------|-------|----------|
| Patient | `patient@healthai.demo` | `patient123` |
| Doctor | `doctor@healthai.demo` | `doctor123` |

---

## Tech Stack

- **Frontend:** React 18 + TypeScript + Vite
- **Routing:** React Router v6
- **Charts:** Recharts
- **Icons:** Lucide React
- **Storage:** Browser localStorage (no backend required)
- **AI:** Demo response engine (no API key required)
- **Deployment:** Vercel (static SPA)

---

## Local Development

```bash
# Install dependencies
npm install

# Start dev server (http://localhost:5173)
npm run dev

# Type check
npm run type-check

# Production build
npm run build

# Preview production build locally
npm run preview
```

---

## Vercel Deployment

### Option A — Deploy via Vercel Dashboard (Recommended)

1. Push this project to a GitHub repository
2. Go to [vercel.com](https://vercel.com) and sign in
3. Click **"Add New Project"** → **"Import Git Repository"**
4. Select your repository
5. Vercel auto-detects **Vite** framework
6. Build settings (auto-detected, no changes needed):
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
7. Environment Variables: None required for the demo
8. Click **Deploy**

### Option B — Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy preview
vercel

# Deploy to production
vercel --prod
```

---

## Environment Variables

No environment variables are **required** for the academic demo. The app works fully with browser localStorage.

For production extensions, copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_APP_NAME` | No | Application display name |
| `VITE_OPENAI_API_KEY` | No | For real AI responses (not implemented in demo) |
| `VITE_SUPABASE_URL` | No | For persistent database (not used in demo) |
| `VITE_SUPABASE_ANON_KEY` | No | For Supabase auth (not used in demo) |

---

## Project Structure

```
health-ai/
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   └── Sidebar.tsx
│   ├── context/
│   │   └── AppContext.tsx        # Global state (localStorage)
│   ├── data/
│   │   └── demoData.ts           # Demo patients, records, etc.
│   ├── pages/
│   │   ├── LandingPage.tsx
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   ├── patient/
│   │   │   ├── PatientDashboard.tsx
│   │   │   ├── HealthRecords.tsx
│   │   │   ├── AIAssistant.tsx
│   │   │   ├── WellnessTracker.tsx
│   │   │   ├── HealthTrends.tsx
│   │   │   ├── EmergencyProfile.tsx
│   │   │   ├── DoctorSharing.tsx
│   │   │   └── Settings.tsx
│   │   └── doctor/
│   │       ├── DoctorDashboard.tsx
│   │       ├── DoctorPatients.tsx
│   │       ├── DoctorReports.tsx
│   │       ├── DoctorHistory.tsx
│   │       ├── DoctorTrends.tsx
│   │       └── DoctorConsent.tsx
│   ├── types/
│   │   └── index.ts
│   ├── utils/
│   │   └── aiUtils.ts            # Demo AI responses
│   ├── App.tsx                   # Router + protected routes
│   ├── main.tsx
│   └── index.css
├── .env.example
├── .gitignore
├── index.html
├── package.json
├── tsconfig.json
├── vercel.json                   # SPA routing + cache headers
└── vite.config.ts
```

---

## Features

### Patient Portal
- Dashboard with health overview cards
- Health Records (upload, view, OCR extract, AI analyze)
- AI Chat Assistant with demo health responses
- Symptom Checker
- Wellness Tracker (water, sleep, exercise, weight/BMI)
- Medicine Tracker with reminders
- Vaccination Records
- Health Trends with interactive charts
- Emergency Profile with QR code
- Doctor Sharing with consent management
- Settings

### Doctor Portal
- Dashboard with authorized patients
- Patient list with access control
- Medical records viewer
- Medical history timeline
- Health trends (hemoglobin, BP, glucose, BMI)
- Consent management with access logs

---

## Disclaimer

This is an academic prototype for educational purposes only. It does not constitute medical advice, diagnosis, or treatment. All data shown is demo data. Do not use this for real medical decisions.

---

## Author

Built as a college project — Academic Prototype
