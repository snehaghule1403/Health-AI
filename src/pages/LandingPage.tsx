import { useNavigate } from 'react-router-dom';
import {
  Shield, Brain, TrendingUp, Share2, Heart, Lock,
  FileText, Activity, Bell, ChevronRight, Star,
  Smartphone, CheckCircle, Stethoscope
} from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', background: 'white' }}>
      {/* ─── NAVBAR ─────────────────────────────────────── */}
      <nav style={{
        position: 'sticky', top: 0, background: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(10px)', borderBottom: '1px solid #e5e7eb',
        zIndex: 50, padding: '0 2rem'
      }}>
        <div style={{
          maxWidth: 1200, margin: '0 auto', height: 64,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              width: 36, height: 36, background: '#2563eb', borderRadius: 9,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Heart size={20} color="white" fill="white" />
            </div>
            <span style={{ fontWeight: 700, fontSize: '1.2rem', color: '#1e3a5f' }}>HealthAI</span>
            <span className="demo-badge">BETA</span>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn btn-outline" onClick={() => navigate('/login/patient')}>
              Patient Login
            </button>
            <button className="btn btn-primary" onClick={() => navigate('/login/doctor')}>
              Doctor Login
            </button>
          </div>
        </div>
      </nav>

      {/* ─── HERO ───────────────────────────────────────── */}
      <section style={{
        background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 50%, #e0f2fe 100%)',
        padding: '5rem 2rem 4rem'
      }}>
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
          <div className="demo-badge" style={{ marginBottom: '1.5rem' }}>
            🎓 Educational Project — Not a medical device
          </div>
          <h1 style={{
            fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 800,
            color: '#1e3a5f', lineHeight: 1.15, marginBottom: '1.25rem'
          }}>
            Your Health.<br />
            <span style={{ color: '#2563eb' }}>One Secure Place.</span>
          </h1>
          <p style={{
            fontSize: '1.2rem', color: '#4b5563', maxWidth: 600,
            margin: '0 auto 2.5rem', lineHeight: 1.7
          }}>
            AI-powered personal health records, wellness tracking and intelligent health insights — designed for patients, accessible by doctors with your consent.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              className="btn btn-primary btn-lg"
              onClick={() => navigate('/login/patient')}
              style={{ fontSize: '1rem', gap: '0.5rem' }}
            >
              <Heart size={18} /> Patient Login
            </button>
            <button
              className="btn btn-outline btn-lg"
              onClick={() => navigate('/login/doctor')}
              style={{ fontSize: '1rem', gap: '0.5rem', background: 'white' }}
            >
              <Stethoscope size={18} /> Doctor Login
            </button>
          </div>
          <p style={{ marginTop: '1.25rem', fontSize: '0.8rem', color: '#9ca3af' }}>
            Create a free patient account to get started. Not a substitute for professional medical care.
          </p>
        </div>
      </section>

      {/* ─── PROBLEM / SOLUTION ─────────────────────────── */}
      <section style={{ padding: '4rem 2rem', background: 'white' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div className="grid-2" style={{ gap: '3rem', alignItems: 'center' }}>
            <div>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                background: '#fee2e2', color: '#dc2626', padding: '0.3rem 0.85rem',
                borderRadius: 20, fontSize: '0.8rem', fontWeight: 600, marginBottom: '1rem'
              }}>
                The Problem
              </div>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1f2937', marginBottom: '1rem' }}>
                Health records are scattered and hard to understand
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {[
                  'Reports in multiple hospitals, hard to track',
                  'Medical jargon patients cannot understand',
                  'No easy way to share records with doctors',
                  'Missing wellness tracking and trends',
                  'Emergency medical info not readily accessible',
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#4b5563' }}>
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%', background: '#dc2626',
                      flexShrink: 0
                    }} />
                    {item}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                background: '#dcfce7', color: '#16a34a', padding: '0.3rem 0.85rem',
                borderRadius: 20, fontSize: '0.8rem', fontWeight: 600, marginBottom: '1rem'
              }}>
                The Solution
              </div>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1f2937', marginBottom: '1rem' }}>
                One platform. AI-powered. Patient-controlled.
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {[
                  'Centralized health records — all in one place',
                  'AI explains reports in simple language',
                  'Consent-based sharing with doctors',
                  'Wellness, medicine and vaccine tracking',
                  'Emergency profile with instant QR access',
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#4b5563' }}>
                    <CheckCircle size={16} color="#16a34a" style={{ flexShrink: 0 }} />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FEATURES ───────────────────────────────────── */}
      <section style={{ padding: '4rem 2rem', background: '#f9fafb' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 700, color: '#1f2937', marginBottom: '0.75rem' }}>
              Everything you need in one place
            </h2>
            <p style={{ color: '#6b7280', fontSize: '1.05rem' }}>
              Powerful features designed for both patients and healthcare providers
            </p>
          </div>
          <div className="grid-3" style={{ gap: '1.5rem' }}>
            {[
              { icon: <FileText size={22} color="#2563eb" />, bg: '#dbeafe', title: 'Health Records', desc: 'Upload and organize blood reports, MRIs, prescriptions, and more in one secure place.' },
              { icon: <Brain size={22} color="#7c3aed" />, bg: '#ede9fe', title: 'AI Report Analyzer', desc: 'Get plain-language explanations of your medical reports with key findings and doctor questions.' },
              { icon: <Activity size={22} color="#16a34a" />, bg: '#dcfce7', title: 'Wellness Tracker', desc: 'Track water intake, sleep, exercise, weight and BMI with daily goals and progress charts.' },
              { icon: <TrendingUp size={22} color="#0891b2" />, bg: '#cffafe', title: 'Health Trends', desc: 'Visualize your hemoglobin, blood pressure, glucose and BMI trends over time.' },
              { icon: <Share2 size={22} color="#ea580c" />, bg: '#ffedd5', title: 'Doctor Sharing', desc: 'Share records with doctors securely using patient-controlled consent management.' },
              { icon: <Bell size={22} color="#d97706" />, bg: '#fef3c7', title: 'Medicine Tracker', desc: 'Track your medications, dosages, schedules and get reminders for upcoming doses.' },
              { icon: <Shield size={22} color="#dc2626" />, bg: '#fee2e2', title: 'Emergency Profile', desc: 'Store blood group, allergies and emergency contacts accessible via QR code.' },
              { icon: <Heart size={22} color="#e11d48" />, bg: '#ffe4e6', title: 'Symptom Checker', desc: 'Log symptoms and get general health information plus questions to ask your doctor.' },
              { icon: <Lock size={22} color="#4b5563" />, bg: '#f3f4f6', title: 'Consent-Based Access', desc: 'Full control over who sees your data. Grant or revoke doctor access at any time.' },
            ].map((f, i) => (
              <div key={i} className="card" style={{ padding: '1.5rem' }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 12, background: f.bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: '1rem'
                }}>
                  {f.icon}
                </div>
                <h3 style={{ fontWeight: 600, color: '#1f2937', marginBottom: '0.4rem', fontSize: '1rem' }}>
                  {f.title}
                </h3>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ───────────────────────────────── */}
      <section style={{ padding: '4rem 2rem', background: 'white' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 700, color: '#1f2937', marginBottom: '0.5rem' }}>
              How It Works
            </h2>
            <p style={{ color: '#6b7280' }}>Simple four-step workflow for patients</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0', flexWrap: 'wrap' }}>
            {[
              { step: '1', title: 'Create Account', desc: 'Register as a patient with your health details' },
              { step: '2', title: 'Upload Reports', desc: 'Add medical reports — blood tests, scans, prescriptions' },
              { step: '3', title: 'AI Analysis', desc: 'Get instant plain-language explanations of your reports' },
              { step: '4', title: 'Share & Track', desc: 'Share with doctors, track wellness, monitor trends' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ textAlign: 'center', padding: '1rem', maxWidth: 180 }}>
                  <div style={{
                    width: 56, height: 56, borderRadius: '50%',
                    background: '#2563eb', color: 'white', fontSize: '1.3rem', fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 0.75rem'
                  }}>{item.step}</div>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.25rem', color: '#1f2937' }}>
                    {item.title}
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: '#6b7280', lineHeight: 1.5 }}>{item.desc}</p>
                </div>
                {i < 3 && (
                  <ChevronRight size={24} color="#d1d5db" style={{ margin: '0 0.25rem', flexShrink: 0 }} />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── AI CAPABILITIES ───────────────────────────── */}
      <section style={{ padding: '4rem 2rem', background: 'linear-gradient(135deg, #1e3a5f 0%, #1d4ed8 100%)' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', color: 'white', textAlign: 'center' }}>
          <Brain size={48} color="rgba(255,255,255,0.8)" style={{ marginBottom: '1rem' }} />
          <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.75rem' }}>
            AI-Powered Health Intelligence
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '1.05rem', marginBottom: '2.5rem', maxWidth: 600, margin: '0 auto 2.5rem' }}>
            Our AI translates complex medical language into insights you can actually understand
          </p>
          <div className="grid-3" style={{ gap: '1.5rem', textAlign: 'left' }}>
            {[
              { icon: <FileText size={20} />, title: 'Report Analysis', desc: 'Breaks down blood reports, MRI findings, and prescriptions into simple language' },
              { icon: <Brain size={20} />, title: 'Health Assistant', desc: 'Ask questions about your health, understand medical terms, get wellness guidance' },
              { icon: <TrendingUp size={20} />, title: 'Trend Insights', desc: 'Identifies patterns in your health data and highlights changes worth discussing' },
            ].map((item, i) => (
              <div key={i} style={{
                background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: 12, padding: '1.5rem'
              }}>
                <div style={{ opacity: 0.8, marginBottom: '0.75rem' }}>{item.icon}</div>
                <h3 style={{ fontWeight: 600, marginBottom: '0.4rem', color: 'white' }}>{item.title}</h3>
                <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.65)', lineHeight: 1.5 }}>{item.desc}</p>
              </div>
            ))}
          </div>
          <div style={{
            marginTop: '2rem', padding: '1rem', background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10, display: 'inline-block'
          }}>
            <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', margin: 0 }}>
              ⚠️ AI insights are for educational purposes only. They do not constitute medical advice, diagnosis, or treatment.
            </p>
          </div>
        </div>
      </section>

      {/* ─── SECURITY ───────────────────────────────────── */}
      <section style={{ padding: '4rem 2rem', background: '#f9fafb' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 700, color: '#1f2937', marginBottom: '0.5rem' }}>
              Built with Privacy in Mind
            </h2>
            <p style={{ color: '#6b7280' }}>Your health data is protected at every step</p>
          </div>
          <div className="grid-4" style={{ gap: '1.25rem' }}>
            {[
              { icon: <Lock size={22} />, color: '#2563eb', bg: '#dbeafe', title: 'Role-Based Access', desc: 'Patients and doctors see only what they are authorized to view' },
              { icon: <Shield size={22} />, color: '#16a34a', bg: '#dcfce7', title: 'Consent Control', desc: 'You decide which doctors can access your records and when' },
              { icon: <Star size={22} />, color: '#ea580c', bg: '#ffedd5', title: 'Access Logs', desc: 'Full audit trail of who viewed your records and when' },
              { icon: <Smartphone size={22} />, color: '#7c3aed', bg: '#ede9fe', title: 'Private by Design', desc: 'Row-level security and private file storage — only you and doctors you approve can see your data' },
            ].map((item, i) => (
              <div key={i} className="card" style={{ padding: '1.25rem', textAlign: 'center' }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 12, background: item.bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 0.75rem', color: item.color
                }}>{item.icon}</div>
                <h3 style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.4rem', color: '#1f2937' }}>
                  {item.title}
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#6b7280', lineHeight: 1.5 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FUTURE SCOPE ───────────────────────────────── */}
      <section style={{ padding: '4rem 2rem', background: 'white' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 700, color: '#1f2937', marginBottom: '0.5rem' }}>
              Future Scope
            </h2>
            <p style={{ color: '#6b7280' }}>Planned enhancements for future development phases</p>
          </div>
          <div className="grid-2" style={{ gap: '1rem' }}>
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
              <div key={i} style={{
                display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
                padding: '0.85rem 1rem', background: '#f9fafb',
                borderRadius: 10, border: '1px solid #e5e7eb'
              }}>
                <ChevronRight size={16} color="#2563eb" style={{ marginTop: 3, flexShrink: 0 }} />
                <span style={{ fontSize: '0.875rem', color: '#374151' }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ────────────────────────────────────────── */}
      <section style={{
        padding: '4rem 2rem',
        background: 'linear-gradient(135deg, #eff6ff, #dbeafe)'
      }}>
        <div style={{ textAlign: 'center', maxWidth: 600, margin: '0 auto' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 700, color: '#1e3a5f', marginBottom: '0.75rem' }}>
            Get Started
          </h2>
          <p style={{ color: '#4b5563', marginBottom: '2rem', lineHeight: 1.6 }}>
            Create an account to store records, track wellness and share securely with your doctor. Built as an educational project.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-primary btn-lg" onClick={() => navigate('/login/patient')}>
              <Heart size={18} /> Try as Patient
            </button>
            <button
              className="btn btn-outline btn-lg"
              style={{ background: 'white' }}
              onClick={() => navigate('/login/doctor')}
            >
              <Stethoscope size={18} /> Try as Doctor
            </button>
          </div>
          <div style={{
            marginTop: '1.5rem', padding: '0.85rem 1.25rem',
            background: '#fef9c3', border: '1px solid #fde68a', borderRadius: 10,
            fontSize: '0.8rem', color: '#713f12'
          }}>
            ⚠️ This application is an academic prototype. AI-generated information is for educational purposes only and does not replace professional medical advice.
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─────────────────────────────────────── */}
      <footer style={{
        background: '#1e3a5f', color: 'rgba(255,255,255,0.6)',
        textAlign: 'center', padding: '1.5rem 2rem', fontSize: '0.8rem'
      }}>
        <p>HealthAI Prototype — Academic College Project | Built with React + TypeScript + Vite</p>
        <p style={{ marginTop: '0.25rem', opacity: 0.7 }}>
          This is NOT a real medical application. For medical advice, consult a qualified healthcare provider.
        </p>
      </footer>
    </div>
  );
}
