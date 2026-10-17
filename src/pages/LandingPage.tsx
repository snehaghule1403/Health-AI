import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield, Brain, TrendingUp, Share2, Heart, Lock,
  FileText, Activity, Bell, ChevronRight, Star,
  Smartphone, CheckCircle, Stethoscope, XCircle, QrCode, Sparkles, Pill
} from 'lucide-react';

const ROTATING = ['understood.', 'organized.', 'in your hands.', 'one tap away.'];

/** Typewriter that cycles through ROTATING. */
function useTypewriter(words: string[]) {
  const [text, setText] = useState('');
  useEffect(() => {
    let w = 0, i = 0, deleting = false, t: number;
    const tick = () => {
      const word = words[w];
      i += deleting ? -1 : 1;
      setText(word.slice(0, i));
      let delay = deleting ? 40 : 85;
      if (!deleting && i === word.length) { deleting = true; delay = 1600; }
      else if (deleting && i === 0) { deleting = false; w = (w + 1) % words.length; delay = 300; }
      t = window.setTimeout(tick, delay);
    };
    t = window.setTimeout(tick, 900);
    return () => clearTimeout(t);
  }, [words]);
  return text;
}

/** Counts up to `to` once the element scrolls into view. */
function CountUp({ to, suffix = '' }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [n, setN] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const start = performance.now();
      const step = (now: number) => {
        const p = Math.min(1, (now - start) / 1400);
        setN(Math.round(to * (1 - Math.pow(1 - p, 3))));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
    io.observe(el);
    return () => io.disconnect();
  }, [to]);
  return <span ref={ref}>{n}{suffix}</span>;
}

const tint = (c: string, bg: string) => ({ '--tint': bg.replace('.14', '.28'), '--tint-bg': bg, '--tint-c': c } as CSSProperties);

const FEATURES = [
  { icon: <FileText size={24} />, c: '#8fb0d6', bg: 'rgba(143,176,214,.14)', title: 'Health Records', desc: 'Upload and organize blood reports, MRIs, prescriptions, and more in one secure place.', cls: 'wide tall' },
  { icon: <Brain size={24} />, c: '#8fb0d6', bg: 'rgba(143,176,214,.14)', title: 'AI Report Analyzer', desc: 'Plain-language explanations of your reports with key findings and doctor questions.', cls: 'wide' },
  { icon: <Activity size={24} />, c: '#86b9a0', bg: 'rgba(52,227,154,.14)', title: 'Wellness Tracker', desc: 'Water, sleep, exercise, weight and BMI with daily goals.', cls: '' },
  { icon: <TrendingUp size={24} />, c: '#8fb0d6', bg: 'rgba(143,176,214,.14)', title: 'Health Trends', desc: 'Hemoglobin, blood pressure, glucose and BMI over time.', cls: '' },
  { icon: <Share2 size={24} />, c: '#c9a27a', bg: 'rgba(255,173,77,.14)', title: 'Doctor Sharing', desc: 'Patient-controlled consent. Grant or revoke in a tap.', cls: '' },
  { icon: <Pill size={24} />, c: '#c9b38a', bg: 'rgba(255,214,102,.14)', title: 'Medicine Tracker', desc: 'Medications, dosages, schedules and upcoming doses.', cls: '' },
  { icon: <QrCode size={24} />, c: '#d08a8a', bg: 'rgba(255,92,122,.14)', title: 'Emergency Profile', desc: 'Blood group, allergies and emergency contacts on a public QR page.', cls: 'wide' },
  { icon: <Heart size={24} />, c: '#8fb0d6', bg: 'rgba(143,176,214,.14)', title: 'Symptom Checker', desc: 'General health info plus questions to ask your doctor.', cls: '' },
  { icon: <Lock size={24} />, c: '#c8d0dc', bg: 'rgba(143,176,214,.12)', title: 'Consent-Based Access', desc: 'Full control over who sees your data, with an access history.', cls: '' },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const word = useTypewriter(ROTATING);

  const pills = ['OCR text extraction', 'AI summaries', 'Symptom checker', 'Vaccination log', 'BMI & meals', 'QR emergency card', 'Access history', 'Trend charts', 'Row-level security', 'Private file storage'];

  return (
    <div className="lp">
      {/* ─── NAVBAR ─────────────────────────────────────── */}
      <nav className="lp-nav">
        <div className="lp-logo">
          <span className="lp-logo-mark"><Heart size={19} color="#0b0d12" fill="#0b0d12" /></span>
          HealthAI
          <span className="demo-badge">BETA</span>
        </div>
        <div className="lp-nav-actions">
          <button className="btn btn-outline" onClick={() => navigate('/login/patient')}>Patient Login</button>
          <button className="btn btn-primary" onClick={() => navigate('/login/doctor')}>Doctor Login</button>
        </div>
      </nav>

      {/* ─── HERO ───────────────────────────────────────── */}
      <header className="lp-hero">
        <div className="lp-orbit" aria-hidden="true"><i /><i /><i /></div>
        <div className="demo-badge" style={{ animation: 'rise 1s var(--ease) both' }}>
          <Sparkles size={12} /> Educational project — not a medical device
        </div>
        <h1>
          <span className="line"><span>Your health,</span></span>
          <span className="line"><span className="grad-text lp-word" aria-live="polite">{word}</span></span>
        </h1>
        <p className="lp-sub">
          AI-powered personal health records, wellness tracking and intelligent health insights — designed for patients, accessible by doctors with your consent.
        </p>
        <div className="lp-cta">
          <button className="btn btn-primary btn-lg" onClick={() => navigate('/login/patient')}>
            <Heart size={18} /> I'm a Patient
          </button>
          <button className="btn btn-outline btn-lg" onClick={() => navigate('/login/doctor')}>
            <Stethoscope size={18} /> I'm a Doctor
          </button>
        </div>
        <p className="lp-fine">Create a free patient account to get started. Not a substitute for professional medical care.</p>

        <svg className="lp-ecg" viewBox="0 0 1100 90" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id="ecgGrad" x1="0" x2="1">
              <stop offset="0" stopColor="#8fb0d6" stopOpacity="0" />
              <stop offset=".3" stopColor="#8fb0d6" />
              <stop offset=".6" stopColor="#8fb0d6" />
              <stop offset=".85" stopColor="#8fb0d6" />
              <stop offset="1" stopColor="#8fb0d6" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d="M0 50 H260 l14 -10 l12 10 H330 l10 18 l16 -66 l18 84 l14 -36 H470 l14 -8 l12 8 H640 l10 18 l16 -66 l18 84 l14 -36 H780 l14 -8 l12 8 H1100" />
        </svg>

        {/* Floating product preview */}
        <div className="lp-preview" data-reveal>
          <span className="lp-chip-float c1"><span className="lp-dot" /> Dr. access granted</span>
          <span className="lp-chip-float c2"><Brain size={15} color="#8fb0d6" /> AI summary ready</span>
          <span className="lp-chip-float c3"><Shield size={15} color="#8fb0d6" /> Encrypted &amp; private</span>
          <div className="lp-window" data-tilt>
            <div className="lp-window-bar"><span /><span /><span /></div>
            <div className="lp-mini-grid">
              <div className="lp-mini">
                <h4>Weekly activity</h4>
                <div className="v">8,432 <span style={{ fontSize: '.9rem', color: 'var(--green)' }}>steps</span></div>
                <div className="lp-bars">
                  {[45, 70, 52, 88, 64, 96, 76].map((h, i) => (
                    <i key={i} style={{ height: `${h}%`, animationDelay: `${i * -0.35}s` }} />
                  ))}
                </div>
              </div>
              <div className="lp-mini" style={{ textAlign: 'center' }}>
                <h4>Sleep goal</h4>
                <div className="lp-ring"><span /></div>
                <div className="v" style={{ fontSize: '1.2rem', marginTop: '.4rem' }}>78%</div>
              </div>
              <div className="lp-mini">
                <h4>Hemoglobin</h4>
                <div className="v">13.8</div>
                <span className="badge badge-green" style={{ marginTop: '.5rem' }}>Normal</span>
                <h4 style={{ marginTop: '1rem' }}>Next dose</h4>
                <div style={{ color: 'white', fontWeight: 600, fontSize: '.9rem' }}>Vitamin D · 8:00 PM</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ─── MARQUEE ────────────────────────────────────── */}
      <div className="lp-marquee" aria-hidden="true">
        <div className="lp-marquee-track">
          {[...pills, ...pills].map((p, i) => (
            <span key={i} className="lp-pill"><Sparkles size={14} /> {p}</span>
          ))}
        </div>
      </div>

      {/* ─── PROBLEM / SOLUTION ─────────────────────────── */}
      <section className="lp-section">
        <div className="lp-wrap">
          <div className="lp-center" data-reveal>
            <div className="lp-kicker">Why HealthAI</div>
            <h2 className="lp-h2">From scattered paper<br />to <span className="grad-text">one living record.</span></h2>
          </div>
          <div className="lp-vs">
            <div className="lp-vs-card bad" data-reveal data-tilt>
              <span className="badge badge-red">The Problem</span>
              <h3>Health records are scattered and hard to understand</h3>
              <ul>
                {[
                  'Reports in multiple hospitals, hard to track',
                  'Medical jargon patients cannot understand',
                  'No easy way to share records with doctors',
                  'Missing wellness tracking and trends',
                  'Emergency medical info not readily accessible',
                ].map(item => <li key={item}><XCircle size={16} color="var(--red)" style={{ flexShrink: 0 }} />{item}</li>)}
              </ul>
            </div>
            <div className="lp-vs-card good" data-reveal data-tilt style={{ '--d': '.12s' } as CSSProperties}>
              <span className="badge badge-green">The Solution</span>
              <h3>One platform. AI-powered. Patient-controlled.</h3>
              <ul>
                {[
                  'Centralized health records — all in one place',
                  'AI explains reports in simple language',
                  'Consent-based sharing with doctors',
                  'Wellness, medicine and vaccine tracking',
                  'Emergency profile with instant QR access',
                ].map(item => <li key={item}><CheckCircle size={16} color="var(--green)" style={{ flexShrink: 0 }} />{item}</li>)}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FEATURES (bento) ───────────────────────────── */}
      <section className="lp-section">
        <div className="lp-wrap">
          <div className="lp-center" data-reveal>
            <div className="lp-kicker">Features</div>
            <h2 className="lp-h2">Everything you need.<br /><span className="grad-text">Nothing you don't.</span></h2>
            <p className="lp-lead">Powerful features designed for both patients and healthcare providers.</p>
          </div>
          <div className="lp-bento">
            {FEATURES.map((f, i) => (
              <div
                key={f.title}
                className={`lp-feat ${f.cls}`}
                data-reveal
                data-tilt
                style={{ ...tint(f.c, f.bg), '--d': `${(i % 4) * 0.07}s` } as CSSProperties}
              >
                <span className="big-num">{String(i + 1).padStart(2, '0')}</span>
                <div className="lp-feat-icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ───────────────────────────────── */}
      <section className="lp-section">
        <div className="lp-wrap">
          <div className="lp-center" data-reveal>
            <div className="lp-kicker">How it works</div>
            <h2 className="lp-h2">Four steps to <span className="grad-text">clarity.</span></h2>
          </div>
          <div className="lp-steps">
            {[
              { title: 'Create Account', desc: 'Register as a patient with your health details' },
              { title: 'Upload Reports', desc: 'Blood tests, scans, prescriptions — PDF, PNG or JPEG' },
              { title: 'AI Analysis', desc: 'Get instant plain-language explanations of your reports' },
              { title: 'Share & Track', desc: 'Share with doctors, track wellness, monitor trends' },
            ].map((s, i) => (
              <div key={s.title} className="lp-step" data-reveal style={{ '--d': `${i * 0.12}s` } as CSSProperties}>
                <div className="lp-step-n">{i + 1}</div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── AI CAPABILITIES ───────────────────────────── */}
      <section className="lp-section">
        <div className="lp-wrap">
          <div className="lp-ai" data-reveal>
            <div className="lp-brain"><Brain size={42} /></div>
            <div className="lp-kicker">Powered by Claude</div>
            <h2 className="lp-h2">AI that speaks <span className="grad-text">human.</span></h2>
            <p className="lp-lead">Our AI translates complex medical language into insights you can actually understand.</p>
            <div className="lp-ai-grid">
              {[
                { icon: <FileText size={22} />, title: 'Report Analysis', desc: 'Breaks down blood reports, MRI findings, and prescriptions into simple language' },
                { icon: <Brain size={22} />, title: 'Health Assistant', desc: 'Ask questions about your health, understand medical terms, get wellness guidance' },
                { icon: <TrendingUp size={22} />, title: 'Trend Insights', desc: 'Identifies patterns in your health data and highlights changes worth discussing' },
              ].map((item, i) => (
                <div key={item.title} className="lp-ai-item" data-reveal data-tilt style={{ '--d': `${i * 0.1}s` } as CSSProperties}>
                  {item.icon}
                  <h3>{item.title}</h3>
                  <p>{item.desc}</p>
                </div>
              ))}
            </div>
            <p style={{ marginTop: '2rem', fontSize: '.8rem', color: 'var(--gray-400)' }}>
              ⚠️ AI insights are for educational purposes only. They do not constitute medical advice, diagnosis, or treatment.
            </p>
          </div>

          <div className="lp-stats">
            {[
              { n: 30, s: '/hr', l: 'AI calls per user' },
              { n: 9, s: '+', l: 'Patient tools' },
              { n: 5, s: ' min', l: 'File link expiry' },
              { n: 100, s: '%', l: 'Patient-controlled access' },
            ].map((s, i) => (
              <div key={s.l} className="lp-stat" data-reveal style={{ '--d': `${i * 0.08}s` } as CSSProperties}>
                <div className="n grad-text"><CountUp to={s.n} suffix={s.s} /></div>
                <div className="l">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SECURITY ───────────────────────────────────── */}
      <section className="lp-section">
        <div className="lp-wrap">
          <div className="lp-center" data-reveal>
            <div className="lp-kicker">Privacy</div>
            <h2 className="lp-h2">Built with privacy <span className="grad-text">in mind.</span></h2>
            <p className="lp-lead">Your health data is protected at every step.</p>
          </div>
          <div className="lp-sec">
            {[
              { icon: <Lock size={22} />, color: 'var(--primary-ink)', bg: 'var(--primary-light)', title: 'Role-Based Access', desc: 'Patients and doctors see only what they are authorized to view' },
              { icon: <Shield size={22} />, color: 'var(--green)', bg: 'var(--green-light)', title: 'Consent Control', desc: 'You decide which doctors can access your records and when' },
              { icon: <Star size={22} />, color: 'var(--orange)', bg: 'var(--orange-light)', title: 'Access Logs', desc: 'Full audit trail of who viewed your records and when' },
              { icon: <Smartphone size={22} />, color: 'var(--violet)', bg: 'var(--violet-light)', title: 'Private by Design', desc: 'Row-level security and private file storage — only you and doctors you approve can see your data' },
            ].map((item, i) => (
              <div key={item.title} className="lp-sec-item" data-reveal data-tilt style={{ '--d': `${i * 0.08}s` } as CSSProperties}>
                <div className="ic" style={{ background: item.bg, color: item.color }}>{item.icon}</div>
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FUTURE SCOPE ───────────────────────────────── */}
      <section className="lp-section">
        <div className="lp-wrap" style={{ maxWidth: 940 }}>
          <div className="lp-center" data-reveal>
            <div className="lp-kicker">Roadmap</div>
            <h2 className="lp-h2">What's <span className="grad-text">next.</span></h2>
            <p className="lp-lead">Planned enhancements for future development phases.</p>
          </div>
          <div className="lp-future">
            {[
              'Integration with real LLM APIs (GPT/Gemini) for advanced report analysis',
              'ABDM (Ayushman Bharat Digital Mission) integration for India',
              'Wearable device integration (Fitbit, Apple Health, Google Fit)',
              'Telemedicine video consultation with doctors',
              'Automated medicine reminders via SMS/WhatsApp',
              'HIPAA/DPDP compliance for production deployment',
              'Multi-language support for regional Indian languages',
              'Hospital EMR system integration via FHIR standard',
            ].map((item, i) => (
              <div key={item} data-reveal style={{ '--d': `${(i % 2) * 0.08}s` } as CSSProperties}>
                <ChevronRight size={16} />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ────────────────────────────────────────── */}
      <section className="lp-final" data-reveal>
        <h2>Take your health<br /><span className="grad-text">back.</span></h2>
        <p className="lp-lead" style={{ margin: '0 auto 2.2rem' }}>
          Create an account to store records, track wellness and share securely with your doctor. Built as an educational project.
        </p>
        <div className="lp-cta" style={{ animation: 'none' }}>
          <button className="btn btn-primary btn-lg" onClick={() => navigate('/login/patient')}>
            <Heart size={18} /> Try as Patient
          </button>
          <button className="btn btn-outline btn-lg" onClick={() => navigate('/login/doctor')}>
            <Stethoscope size={18} /> Try as Doctor
          </button>
        </div>
        <div className="lp-warn">
          ⚠️ This application is an academic prototype. AI-generated information is for educational purposes only and does not replace professional medical advice.
        </div>
      </section>

      {/* ─── FOOTER ─────────────────────────────────────── */}
      <footer className="lp-footer">
        <p style={{ color: 'inherit' }}>
          <Bell size={12} style={{ verticalAlign: -1, marginRight: 6 }} />
          HealthAI Prototype — Academic College Project | Built with React + TypeScript + Vite
        </p>
        <p style={{ marginTop: '0.25rem', opacity: 0.7, color: 'inherit' }}>
          This is NOT a real medical application. For medical advice, consult a qualified healthcare provider.
        </p>
      </footer>
    </div>
  );
}
