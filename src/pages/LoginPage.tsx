import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Heart, Stethoscope, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { readAuthUrlError } from '../lib/siteUrl';

export default function LoginPage() {
  const { role } = useParams<{ role: 'patient' | 'doctor' }>();
  const navigate = useNavigate();
  const { login, resetPassword, resendVerification, currentUser, ready } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isPatient = role === 'patient';

  const [info, setInfo] = useState('');
  const [unconfirmed, setUnconfirmed] = useState(false);

  // Arriving from an email link: show its error, or continue once the session loads.
  useEffect(() => {
    const urlError = readAuthUrlError();
    if (urlError) {
      setError(urlError);
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);
  useEffect(() => {
    if (ready && currentUser) navigate(currentUser.role === 'doctor' ? '/doctor/dashboard' : '/patient/dashboard', { replace: true });
  }, [ready, currentUser, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);
    const res = await login(email.trim(), password);
    setLoading(false);
    if (!res.ok) {
      setUnconfirmed(/not confirmed/i.test(res.error ?? ''));
      return setError(/not confirmed/i.test(res.error ?? '') ? 'Please verify your email first — check your inbox for the confirmation link.' : res.error ?? 'Login failed.');
    }
    // Route by the role stored in the database, not the login page used.
    navigate(res.role === 'doctor' ? '/doctor/dashboard' : '/patient/dashboard');
  };

  const handleResend = async () => {
    setError('');
    const res = await resendVerification(email.trim(), isPatient ? 'patient' : 'doctor');
    if (res.ok) { setUnconfirmed(false); setInfo('A new verification email has been sent.'); }
    else setError(res.error ?? 'Could not resend the verification email.');
  };

  const handleForgot = async () => {
    setError('');
    setInfo('');
    if (!email.trim()) return setError('Enter your email address first, then click "Forgot password".');
    const res = await resetPassword(email.trim());
    if (res.ok) setInfo('If an account exists for that email, a password reset link has been sent.');
    else setError(res.error ?? 'Could not send reset email.');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'transparent',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1rem'
    }}>
      <div style={{ width: '100%', maxWidth: 440 }}>
        {/* Back button */}
        <button
          className="btn btn-outline"
          style={{ background: 'var(--surface)', marginBottom: '1.25rem' }}
          onClick={() => navigate('/')}
        >
          <ArrowLeft size={16} /> Back to Home
        </button>

        <div className="card">
          <div style={{ padding: '2rem 2rem 0' }}>
            {/* Logo */}
            <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
              <div style={{
                width: 56, height: 56, background: 'var(--grad)',
                borderRadius: 16, display: 'flex', alignItems: 'center',
                justifyContent: 'center', margin: '0 auto 0.75rem'
              }}>
                {isPatient
                  ? <Heart size={28} color="#0b0d12" fill="#0b0d12" />
                  : <Stethoscope size={28} color="#0b0d12" />
                }
              </div>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--gray-800)' }}>
                {isPatient ? 'Patient Login' : 'Doctor Login'}
              </h1>
              <p style={{ color: 'var(--gray-500)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                {isPatient ? 'Access your personal health records' : 'Access authorized patient records'}
              </p>
            </div>

            {error && (
              <div className="alert alert-danger" role="alert" style={{ marginBottom: '1rem' }}>
                {error}
                {unconfirmed && email.trim() && (
                  <button type="button" className="btn btn-outline btn-sm" style={{ marginLeft: 'auto' }} onClick={handleResend}>Resend email</button>
                )}
              </div>
            )}
            {info && (
              <div className="alert alert-info" role="status" style={{ marginBottom: '1rem' }}>
                {info}
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} style={{ padding: '0 2rem 2rem' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="login-email">Email Address</label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </div>

            <div className="form-group" style={{ position: 'relative' }}>
              <label className="form-label" htmlFor="login-password">Password</label>
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                required
                style={{ paddingRight: '2.75rem' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                style={{
                  position: 'absolute', right: '0.75rem', top: '2.1rem',
                  background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-500)'
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <div style={{ textAlign: 'right', marginTop: '-0.5rem', marginBottom: '0.5rem' }}>
              <button type="button" onClick={handleForgot}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.8rem' }}>
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{
                width: '100%', justifyContent: 'center', padding: '0.75rem',
                fontSize: '1rem', marginTop: '0.5rem',
              }}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="spinner" style={{ width: 18, height: 18 }} />
                  Logging in...
                </span>
              ) : (
                `Sign In as ${isPatient ? 'Patient' : 'Doctor'}`
              )}
            </button>

            <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.875rem', color: 'var(--gray-500)' }}>
              Don't have an account?{' '}
              <button
                type="button"
                style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 600, cursor: 'pointer', fontSize: 'inherit' }}
                onClick={() => navigate(`/register/${role}`)}
              >
                Register here
              </button>
            </div>

            {!isPatient && (
              <div style={{ textAlign: 'center', marginTop: '0.5rem', fontSize: '0.875rem' }}>
                <button
                  type="button"
                  style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: 'inherit' }}
                  onClick={() => navigate('/login/patient')}
                >
                  Switch to Patient Login →
                </button>
              </div>
            )}
            {isPatient && (
              <div style={{ textAlign: 'center', marginTop: '0.5rem', fontSize: '0.875rem' }}>
                <button
                  type="button"
                  style={{ background: 'none', border: 'none', color: 'var(--navy)', cursor: 'pointer', fontSize: 'inherit' }}
                  onClick={() => navigate('/login/doctor')}
                >
                  Are you a Doctor? →
                </button>
              </div>
            )}
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.75rem', color: 'var(--gray-400)' }}>
          Educational project — not a substitute for professional medical care
        </p>
      </div>
    </div>
  );
}
