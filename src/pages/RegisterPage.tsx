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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const user: User = {
        id: `${role}-${Date.now()}`,
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

      const ok = register(user, form.password);
      if (ok) {
        navigate(`/login/${role}`);
      } else {
        setError('Email already registered. Please login.');
      }
      setLoading(false);
    }, 600);
  };

  return (
    <div style={{
      minHeight: '100vh', background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
    }}>
      <div style={{ width: '100%', maxWidth: 560 }}>
        <button
          className="btn btn-outline"
          style={{ background: 'white', marginBottom: '1.25rem' }}
          onClick={() => navigate(`/login/${role}`)}
        >
          <ArrowLeft size={16} /> Back to Login
        </button>

        <div className="card">
          <div style={{ padding: '2rem 2rem 0' }}>
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
                {isPatient ? 'Patient Registration' : 'Doctor Registration'}
              </h1>
              <p style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                Create your {isPatient ? 'health record' : 'medical'} account
              </p>
            </div>

            {error && <div className="alert alert-danger">{error}</div>}
          </div>

          <form onSubmit={handleSubmit} style={{ padding: '0 2rem 2rem' }}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input value={form.name} onChange={set('name')} placeholder="Your full name" required />
              </div>
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input value={form.phone} onChange={set('phone')} placeholder="+91 98765 43210" />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Email Address *</label>
              <input type="email" value={form.email} onChange={set('email')} placeholder="your@email.com" required />
            </div>

            {isPatient && (
              <>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Date of Birth</label>
                    <input type="date" value={form.dateOfBirth} onChange={set('dateOfBirth')} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Gender</label>
                    <select value={form.gender} onChange={set('gender')}>
                      <option value="">Select</option>
                      <option>Male</option>
                      <option>Female</option>
                      <option>Other</option>
                      <option>Prefer not to say</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Blood Group</label>
                  <select value={form.bloodGroup} onChange={set('bloodGroup')}>
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
                    <label className="form-label">Medical Registration ID *</label>
                    <input value={form.medicalRegistrationId} onChange={set('medicalRegistrationId')} placeholder="MH-2020-XXXXX" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Specialization *</label>
                    <select value={form.specialization} onChange={set('specialization')} required>
                      <option value="">Select</option>
                      {['General Physician', 'Cardiologist', 'Neurologist', 'Orthopedist', 'Pediatrician', 'Dermatologist', 'Gynecologist', 'Radiologist', 'Other'].map(s => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Hospital / Clinic *</label>
                  <input value={form.hospital} onChange={set('hospital')} placeholder="Hospital or clinic name" required />
                </div>
              </>
            )}

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Password *</label>
                <input type="password" value={form.password} onChange={set('password')} placeholder="Minimum 6 characters" required />
              </div>
              <div className="form-group">
                <label className="form-label">Confirm Password *</label>
                <input type="password" value={form.confirmPassword} onChange={set('confirmPassword')} placeholder="Repeat password" required />
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

            <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
              Already have an account?{' '}
              <button
                type="button"
                style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: 600, cursor: 'pointer', fontSize: 'inherit' }}
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
