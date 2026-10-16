import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Heart, Stethoscope, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function LoginPage() {
  const { role } = useParams<{ role: 'patient' | 'doctor' }>();
  const navigate = useNavigate();
  const { login, resetPassword } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isPatient = role === 'patient';

  const [info, setInfo] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);
    const res = await login(email.trim(), password);
    setLoading(false);
    if (!res.ok) return setError(res.error ?? 'Login failed.');
    // Route by the role stored in the database, not the login page used.
    navigate(res.role === 'doctor' ? '/doctor/dashboard' : '/patient/dashboard');
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
      background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1rem'
    }}>
      <div style={{ width: '100%', maxWidth: 440 }}>
        {/* Back button */}
        <button
          className="btn btn-outline"
          style={{ background: 'white', marginBottom: '1.25rem' }}
          onClick={() => navigate('/')}
        >
          <ArrowLeft size={16} /> Back to Home
        </button>

        <div className="card">
          <div style={{ padding: '2rem 2rem 0' }}>
            {/* Logo */}
            <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
              <div style={{
                width: 56, height: 56, background: isPatient ? '#2563eb' : '#1e3a5f',
                borderRadius: 16, display: 'flex', alignItems: 'center',
                justifyContent: 'center', margin: '0 auto 0.75rem'
              }}>
                {isPatient
                  ? <Heart size={28} color="white" fill="white" />
                  : <Stethoscope size={28} color="white" />
                }
              </div>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#1f2937' }}>
                {isPatient ? 'Patient Login' : 'Doctor Login'}
              </h1>
              <p style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                {isPatient ? 'Access your personal health records' : 'Access authorized patient records'}
              </p>
            </div>

            {error && (
              <div className="alert alert-danger" role="alert" style={{ marginBottom: '1rem' }}>
                {error}
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
              <label className="form-label">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </div>

            <div className="form-group" style={{ position: 'relative' }}>
              <label className="form-label">Password</label>
              <input
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
                style={{
                  position: 'absolute', right: '0.75rem', top: '2.1rem',
                  background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280'
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <div style={{ textAlign: 'right', marginTop: '-0.5rem', marginBottom: '0.5rem' }}>
              <button type="button" onClick={handleForgot}
                style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontSize: '0.8rem' }}>
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              className={`btn ${isPatient ? 'btn-primary' : ''}`}
              disabled={loading}
              style={{
                width: '100%', justifyContent: 'center', padding: '0.75rem',
                fontSize: '1rem', marginTop: '0.5rem',
                background: isPatient ? undefined : '#1e3a5f',
                color: isPatient ? undefined : 'white'
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

            <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.875rem', color: '#6b7280' }}>
              Don't have an account?{' '}
              <button
                type="button"
                style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: 600, cursor: 'pointer', fontSize: 'inherit' }}
                onClick={() => navigate(`/register/${role}`)}
              >
                Register here
              </button>
            </div>

            {!isPatient && (
              <div style={{ textAlign: 'center', marginTop: '0.5rem', fontSize: '0.875rem' }}>
                <button
                  type="button"
                  style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontSize: 'inherit' }}
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
                  style={{ background: 'none', border: 'none', color: '#1e3a5f', cursor: 'pointer', fontSize: 'inherit' }}
                  onClick={() => navigate('/login/doctor')}
                >
                  Are you a Doctor? →
                </button>
              </div>
            )}
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.75rem', color: '#9ca3af' }}>
          Educational project — not a substitute for professional medical care
        </p>
      </div>
    </div>
  );
}
