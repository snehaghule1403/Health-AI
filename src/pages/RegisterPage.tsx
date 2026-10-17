import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Heart, Stethoscope, ArrowLeft } from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { User } from '../types';

export default function RegisterPage() {
  const { role } = useParams<{ role: 'patient' | 'doctor' }>();
  const navigate = useNavigate();
  const { register } = useApp();
  const isPatient = role === 'patient';

  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '', confirmPassword: '',
    dateOfBirth: '', gender: '', bloodGroup: '',
    medicalRegistrationId: '', specialization: '', hospital: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  const [notice, setNotice] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (!form.name.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!isPatient && !form.medicalRegistrationId.trim()) {
      setError('Medical registration ID is required for doctors.');
      return;
    }

    setLoading(true);
    {
      const user: User = {
        id: '',
        role: role!,
        name: form.name,
        email: form.email,
        phone: form.phone,
        ...(isPatient ? {
          dateOfBirth: form.dateOfBirth,
          gender: form.gender,
          bloodGroup: form.bloodGroup,
        } : {
          medicalRegistrationId: form.medicalRegistrationId,
          specialization: form.specialization,
          hospital: form.hospital,
        }),
      };

      const res = await register({ ...user, password: form.password });
      setLoading(false);
      if (!res.ok) return setError(res.error ?? 'Registration failed.');
      if (res.needsConfirmation) {
        setNotice('Account created. Check your email to confirm your address, then sign in.');
        return;
      }
      navigate(isPatient ? '/patient/dashboard' : '/doctor/dashboard');
    }
  };

  return (
    <div style={{
      minHeight: '100vh', background: 'transparent',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
    }}>
      <div style={{ width: '100%', maxWidth: 560 }}>
        <button
          className="btn btn-outline"
          style={{ background: 'var(--surface)', marginBottom: '1.25rem' }}
          onClick={() => navigate(`/login/${role}`)}
        >
          <ArrowLeft size={16} /> Back to Login
        </button>

        <div className="card">
          <div style={{ padding: '2rem 2rem 0' }}>
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
                {isPatient ? 'Patient Registration' : 'Doctor Registration'}
              </h1>
              <p style={{ color: 'var(--gray-500)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                Create your {isPatient ? 'health record' : 'medical'} account
              </p>
            </div>

            {error && <div className="alert alert-danger" role="alert">{error}</div>}
            {notice && <div className="alert alert-success" role="status">{notice}</div>}
            {!isPatient && (
              <div className="alert alert-info">Doctor accounts must be verified by an administrator before any patient data becomes visible.</div>
            )}
          </div>

          <form onSubmit={handleSubmit} style={{ padding: '0 2rem 2rem' }}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="registerpage-f1">Full Name *</label>
                <input id="registerpage-f1" value={form.name} onChange={set('name')} placeholder="Your full name" required />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="registerpage-f2">Phone Number</label>
                <input id="registerpage-f2" value={form.phone} onChange={set('phone')} placeholder="+91 98765 43210" />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="registerpage-f3">Email Address *</label>
              <input id="registerpage-f3" type="email" value={form.email} onChange={set('email')} placeholder="your@email.com" required />
            </div>

            {isPatient && (
              <>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label" htmlFor="registerpage-f4">Date of Birth</label>
                    <input id="registerpage-f4" type="date" value={form.dateOfBirth} onChange={set('dateOfBirth')} />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="registerpage-f5">Gender</label>
                    <select id="registerpage-f5" value={form.gender} onChange={set('gender')}>
                      <option value="">Select</option>
                      <option>Male</option>
                      <option>Female</option>
                      <option>Other</option>
                      <option>Prefer not to say</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="registerpage-f6">Blood Group</label>
                  <select id="registerpage-f6" value={form.bloodGroup} onChange={set('bloodGroup')}>
                    <option value="">Select blood group</option>
                    {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(g => (
                      <option key={g}>{g}</option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {!isPatient && (
              <>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label" htmlFor="registerpage-f7">Medical Registration ID *</label>
                    <input id="registerpage-f7" value={form.medicalRegistrationId} onChange={set('medicalRegistrationId')} placeholder="MH-2020-XXXXX" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="registerpage-f8">Specialization *</label>
                    <select id="registerpage-f8" value={form.specialization} onChange={set('specialization')} required>
                      <option value="">Select</option>
                      {['General Physician', 'Cardiologist', 'Neurologist', 'Orthopedist', 'Pediatrician', 'Dermatologist', 'Gynecologist', 'Radiologist', 'Other'].map(s => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="registerpage-f9">Hospital / Clinic *</label>
                  <input id="registerpage-f9" value={form.hospital} onChange={set('hospital')} placeholder="Hospital or clinic name" required />
                </div>
              </>
            )}

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="registerpage-f10">Password *</label>
                <input id="registerpage-f10" type="password" value={form.password} onChange={set('password')} placeholder="Minimum 8 characters" autoComplete="new-password" required />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="registerpage-f11">Confirm Password *</label>
                <input id="registerpage-f11" type="password" value={form.confirmPassword} onChange={set('confirmPassword')} placeholder="Repeat password" required />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ width: '100%', justifyContent: 'center', padding: '0.75rem', fontSize: '1rem', marginTop: '0.5rem' }}
            >
              {loading ? 'Creating Account...' : `Create ${isPatient ? 'Patient' : 'Doctor'} Account`}
            </button>

            <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.875rem', color: 'var(--gray-500)' }}>
              Already have an account?{' '}
              <button
                type="button"
                style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 600, cursor: 'pointer', fontSize: 'inherit' }}
                onClick={() => navigate(`/login/${role}`)}
              >
                Login here
              </button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
