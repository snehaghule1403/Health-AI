import { useState } from 'react';
import { Lock } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import TrendsPanel from '../../components/TrendsPanel';

export default function DoctorTrends() {
  const { currentUser, users, consents } = useApp();

  // RLS already limits rows to consented patients; filter again for clarity.
  const grantedIds = new Set(consents.filter(c => c.doctorId === currentUser?.id && c.status === 'granted').map(c => c.patientId));
  const patients = users.filter(u => u.role === 'patient' && grantedIds.has(u.id));
  const [selectedId, setSelectedId] = useState<string>('');
  const patient = patients.find(p => p.id === selectedId) ?? patients[0];

  if (!patient) {
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
          <p>Recorded health metrics of an authorized patient</p>
        </div>
        <div>
          <label htmlFor="dt-patient" className="sr-only">Patient</label>
          <select id="dt-patient" value={patient.id} onChange={e => setSelectedId(e.target.value)} style={{ minWidth: 200 }}>
            {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
      </div>
      <TrendsPanel key={patient.id} patientId={patient.id} editable={false} />
    </div>
  );
}
