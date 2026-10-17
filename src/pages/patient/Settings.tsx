import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Shield, Lock, CheckCircle, Cpu, LogOut, AlertCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../lib/supabase';
import { getAIStatus, type AIStatus } from '../../lib/api';

const BLOOD_GROUPS = ['', 'A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

export default function Settings() {
  const navigate = useNavigate();
  const { currentUser, updateProfile, logout } = useApp();
  const isPatient = currentUser?.role === 'patient';
  const [form, setForm] = useState({
    name: '', phone: '', bloodGroup: '', dateOfBirth: '', gender: '', height: '',
    specialization: '', hospital: '', medicalRegistrationId: '',
  });
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [pw, setPw] = useState({ next: '', confirm: '' });
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [ai, setAi] = useState<AIStatus | null | 'loading'>('loading');

  useEffect(() => {
    if (!currentUser) return;
    setForm({
      name: currentUser.name, phone: currentUser.phone ?? '', bloodGroup: currentUser.bloodGroup ?? '',
      dateOfBirth: currentUser.dateOfBirth ?? '', gender: currentUser.gender ?? '', height: currentUser.height ? String(currentUser.height) : '',
      specialization: currentUser.specialization ?? '', hospital: currentUser.hospital ?? '', medicalRegistrationId: currentUser.medicalRegistrationId ?? '',
    });
  }, [currentUser]);

  useEffect(() => { getAIStatus().then(setAi); }, []);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm({ ...form, [k]: e.target.value });

  const saveProfile = async () => {
    setMsg(null);
    if (!form.name.trim()) return setMsg({ ok: false, text: 'Name is required.' });
    const h = form.height ? Number(form.height) : undefined;
    if (h !== undefined && (!Number.isFinite(h) || h < 30 || h > 272)) return setMsg({ ok: false, text: 'Height must be between 30 and 272 cm.' });
    if (form.dateOfBirth && form.dateOfBirth > new Date().toISOString().split('T')[0]) return setMsg({ ok: false, text: 'Date of birth cannot be in the future.' });
    setSaving(true);
    const ok = await updateProfile({
      name: form.name.trim(), phone: form.phone.trim() || undefined,
      ...(isPatient
        ? { bloodGroup: form.bloodGroup || undefined, dateOfBirth: form.dateOfBirth || undefined, gender: form.gender || undefined, height: h }
        : { specialization: form.specialization.trim(), hospital: form.hospital.trim(), medicalRegistrationId: form.medicalRegistrationId.trim() }),
    });
    setSaving(false);
    setMsg(ok ? { ok: true, text: 'Profile saved.' } : { ok: false, text: 'Could not save profile.' });
  };

  const changePassword = async () => {
    setPwMsg(null);
    if (pw.next.length < 8) return setPwMsg({ ok: false, text: 'Password must be at least 8 characters.' });
    if (pw.next !== pw.confirm) return setPwMsg({ ok: false, text: 'Passwords do not match.' });
    const { error } = await supabase.auth.updateUser({ password: pw.next });
    if (error) return setPwMsg({ ok: false, text: error.message });
    setPw({ next: '', confirm: '' });
    setPwMsg({ ok: true, text: 'Password updated.' });
  };

  const doLogout = async () => { await logout(); navigate('/'); };

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Settings</h1>
          <p>Manage your account and preferences</p>
        </div>
      </div>

      <div style={{ maxWidth: 680 }}>
        <div className="card" style={{ marginBottom: '1.25rem' }}>
          <div className="card-header">
            <h3><User size={16} style={{ marginRight: 8 }} aria-hidden />Profile Information</h3>
          </div>
          <div className="card-body">
            {msg && <div className={`alert ${msg.ok ? 'alert-success' : 'alert-danger'}`} role="status" style={{ marginBottom: '0.75rem' }}>{msg.ok && <CheckCircle size={14} />} {msg.text}</div>}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="s-name">Full Name</label>
                <input id="s-name" value={form.name} onChange={set('name')} maxLength={120} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="s-email">Email</label>
                <input id="s-email" value={currentUser?.email ?? ''} type="email" disabled title="Email changes are not supported in-app" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="s-phone">Phone</label>
                <input id="s-phone" type="tel" value={form.phone} onChange={set('phone')} />
              </div>
              {isPatient ? (
                <div className="form-group">
                  <label className="form-label" htmlFor="s-blood">Blood Group</label>
                  <select id="s-blood" value={form.bloodGroup} onChange={set('bloodGroup')}>
                    {BLOOD_GROUPS.map(g => <option key={g} value={g}>{g || 'Unknown'}</option>)}
                  </select>
                </div>
              ) : (
                <div className="form-group">
                  <label className="form-label" htmlFor="s-spec">Specialization</label>
                  <input id="s-spec" value={form.specialization} onChange={set('specialization')} />
                </div>
              )}
            </div>
            {isPatient ? (
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="s-dob">Date of birth</label>
                  <input id="s-dob" type="date" value={form.dateOfBirth} onChange={set('dateOfBirth')} />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="s-gender">Gender</label>
                  <select id="s-gender" value={form.gender} onChange={set('gender')}>
                    {['', 'Female', 'Male', 'Other', 'Prefer not to say'].map(g => <option key={g} value={g}>{g || 'Not set'}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="s-height">Height (cm)</label>
                  <input id="s-height" type="number" min={30} max={272} value={form.height} onChange={set('height')} />
                </div>
              </div>
            ) : (
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="s-hosp">Hospital</label>
                  <input id="s-hosp" value={form.hospital} onChange={set('hospital')} />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="s-reg">Medical registration ID</label>
                  <input id="s-reg" value={form.medicalRegistrationId} onChange={set('medicalRegistrationId')} />
                </div>
              </div>
            )}
            {!isPatient && (
              <p style={{ fontSize: '0.8rem', color: currentUser?.doctorVerified ? 'var(--green-ink)' : '#b45309', marginBottom: '0.75rem' }}>
                Verification status: {currentUser?.doctorVerified ? 'Verified' : 'Awaiting administrator verification'}
              </p>
            )}
            <button className="btn btn-primary btn-sm" onClick={saveProfile} disabled={saving}>{saving ? 'Saving…' : 'Save Profile'}</button>
          </div>
        </div>

        <div className="card" style={{ marginBottom: '1.25rem' }}>
          <div className="card-header">
            <h3><Shield size={16} style={{ marginRight: 8 }} aria-hidden />Security</h3>
          </div>
          <div className="card-body">
            {pwMsg && <div className={`alert ${pwMsg.ok ? 'alert-success' : 'alert-danger'}`} role="status" style={{ marginBottom: '0.75rem' }}>{pwMsg.text}</div>}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="s-pw">New password</label>
                <input id="s-pw" type="password" autoComplete="new-password" value={pw.next} onChange={e => setPw({ ...pw, next: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="s-pw2">Confirm password</label>
                <input id="s-pw2" type="password" autoComplete="new-password" value={pw.confirm} onChange={e => setPw({ ...pw, confirm: e.target.value })} />
              </div>
            </div>
            <button className="btn btn-outline btn-sm" onClick={changePassword}><Lock size={13} /> Update Password</button>
          </div>
        </div>

        <div className="card" style={{ marginBottom: '1.25rem' }}>
          <div className="card-header">
            <h3><Cpu size={16} style={{ marginRight: 8 }} aria-hidden />AI &amp; OCR status</h3>
          </div>
          <div className="card-body" style={{ fontSize: '0.875rem', lineHeight: 1.8 }}>
            {ai === 'loading' ? <p>Checking…</p> : ai === null ? (
              <p style={{ color: 'var(--red-ink)' }}><AlertCircle size={14} /> The API is not reachable. AI features are unavailable (on local <code>vite</code> dev, run <code>vercel dev</code> instead).</p>
            ) : (
              <>
                <div>AI provider: {ai.ai ? <strong style={{ color: 'var(--green-ink)' }}>Connected ({ai.model})</strong> : <strong style={{ color: 'var(--red-ink)' }}>Not configured — GROQ_API_KEY missing</strong>}</div>
                <div>Server database access: {ai.supabase ? <strong style={{ color: 'var(--green-ink)' }}>Configured</strong> : <strong style={{ color: 'var(--red-ink)' }}>Missing Supabase env vars</strong>}</div>
              </>
            )}
            <div>OCR: runs in your browser (Tesseract.js for images and scanned PDF pages, pdf.js for text PDFs).</div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: '1.25rem' }}>
          <div className="card-header"><h3><Lock size={16} style={{ marginRight: 8 }} aria-hidden />Privacy</h3></div>
          <div className="card-body" style={{ fontSize: '0.85rem', color: 'var(--gray-700)', lineHeight: 1.6 }}>
            <p>Your records are stored in a private database and file bucket protected by row-level security. Only you, and doctors you explicitly grant access to, can read them. Revoking access takes effect on the doctor's next request.</p>
            <p style={{ marginTop: '0.5rem' }}>When you use AI features, the relevant text (your question, symptom description or report text) is sent to the AI provider (Anthropic) to generate a response. AI chat history is stored in your account and visible only to you.</p>
            <p style={{ marginTop: '0.5rem' }}>HealthAI is an educational project. It is not a medical device and has not been clinically validated or certified for regulatory compliance.</p>
          </div>
        </div>

        <button className="btn btn-outline" onClick={doLogout}><LogOut size={15} /> Log out</button>
      </div>
    </div>
  );
}
