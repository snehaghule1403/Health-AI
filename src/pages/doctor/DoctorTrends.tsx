import { Lock } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { DEMO_TRENDS } from '../../data/demoData';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

export default function DoctorTrends() {
  const { currentUser, users, consents } = useApp();

  const grantedConsents = consents.filter(
    c => c.doctorId === currentUser?.id && c.status === 'granted'
  );

  const hasAccess = grantedConsents.length > 0;
  const patient = users.find(u => u.role === 'patient' && grantedConsents.some(c => c.patientId === u.id));

  if (!hasAccess) {
    return (
      <div className="page-container">
        <div className="page-header">
          <div className="page-header-left">
            <h1>Health Trends</h1>
          </div>
        </div>
        <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
          <Lock size={48} style={{ opacity: 0.3, margin: '0 auto 1rem', color: '#9ca3af' }} />
          <h3 style={{ color: '#6b7280' }}>No authorized patients</h3>
          <p style={{ color: '#9ca3af' }}>Health trends become visible when patients grant you access</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Health Trends</h1>
          <p>Patient health metric trends over time</p>
        </div>
        {patient && <span className="badge badge-blue">{patient.name}</span>}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div className="card">
          <div className="card-header"><h3>Hemoglobin & Blood Glucose</h3></div>
          <div style={{ padding: '1rem' }}>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={DEMO_TRENDS}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: '0.8rem' }} />
                <Legend />
                <Line type="monotone" dataKey="hemoglobin" stroke="#2563eb" strokeWidth={2.5} name="Hemoglobin (g/dL)" dot={{ r: 4 }} />
                <Line type="monotone" dataKey="glucose" stroke="#d97706" strokeWidth={2} name="Glucose (mg/dL)" dot={{ r: 3 }} strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h3>Blood Pressure</h3></div>
          <div style={{ padding: '1rem' }}>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={DEMO_TRENDS}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} unit=" mmHg" />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: '0.8rem' }} />
                <Legend />
                <Line type="monotone" dataKey="systolic" stroke="#dc2626" strokeWidth={2.5} name="Systolic" dot={{ r: 4 }} />
                <Line type="monotone" dataKey="diastolic" stroke="#ea580c" strokeWidth={2} name="Diastolic" dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h3>Weight & BMI</h3></div>
          <div style={{ padding: '1rem' }}>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={DEMO_TRENDS}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: '0.8rem' }} />
                <Legend />
                <Line type="monotone" dataKey="weight" stroke="#7c3aed" strokeWidth={2.5} name="Weight (kg)" dot={{ r: 4 }} />
                <Line type="monotone" dataKey="bmi" stroke="#16a34a" strokeWidth={2} name="BMI" dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{ padding: '0.85rem 1rem', background: '#eff6ff', border: '1px solid #93c5fd', borderRadius: 10, fontSize: '0.825rem', color: '#1e40af' }}>
          📊 <strong>Clinical Note:</strong> Patient's hemoglobin has improved 5% over 6 months (11.8 → 12.4 g/dL). Blood pressure remains within normal range. BMI stable at 20.9 (healthy weight). Recommend follow-up in 3 months.
        </div>
      </div>
    </div>
  );
}
