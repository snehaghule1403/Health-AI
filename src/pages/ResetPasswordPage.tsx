import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

// Landing page for the password-recovery email link from Supabase Auth.
export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [hasSession, setHasSession] = useState<boolean | null>(null);
  const [status, setStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setHasSession(!!data.session));
    const { data } = supabase.auth.onAuthStateChange((event) => { if (event === 'PASSWORD_RECOVERY') setHasSession(true); });
    return () => data.subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return setStatus({ ok: false, msg: 'Password must be at least 8 characters.' });
    if (password !== confirm) return setStatus({ ok: false, msg: 'Passwords do not match.' });
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (error) return setStatus({ ok: false, msg: error.message });
    setStatus({ ok: true, msg: 'Password updated. You can now sign in.' });
    await supabase.auth.signOut();
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)' }}>
      <div className="card" style={{ width: '100%', maxWidth: 420, padding: '2rem' }}>
        <h1 style={{ fontSize: '1.4rem', marginBottom: '1rem' }}>Set a new password</h1>
        {hasSession === false && !status?.ok && (
          <p role="alert" style={{ color: '#991b1b' }}>This reset link is invalid or has expired. Request a new one from the login page.</p>
        )}
        {hasSession && !status?.ok && (
          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <label htmlFor="pw">New password</label>
            <input id="pw" type="password" autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} required />
            <label htmlFor="pw2">Confirm password</label>
            <input id="pw2" type="password" autoComplete="new-password" value={confirm} onChange={e => setConfirm(e.target.value)} required />
            <button className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Update password'}</button>
          </form>
        )}
        {status && <p role="status" style={{ marginTop: '0.75rem', color: status.ok ? '#166534' : '#991b1b' }}>{status.msg}</p>}
        <button className="btn btn-outline" style={{ marginTop: '1rem' }} onClick={() => navigate('/')}>Back to home</button>
      </div>
    </div>
  );
}
