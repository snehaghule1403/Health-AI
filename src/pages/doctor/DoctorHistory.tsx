import { Lock, Users } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { DEMO_EMERGENCY } from '../../data/demoData';

export default function DoctorHistory() {
  const { currentUser, users, consents, records, medicines, vaccines } = useApp();

  const grantedConsents = consents.filter(
    c => c.doctorId === currentUser?.id && c.status === 'granted'
  );

  const authorizedPatients = users.filter(u =>
    u.role === 'patient' && grantedConsents.some(c => c.patientId === u.id)
  );

  if (authorizedPatients.length === 0) {
    return (
      <div className="page-container">
        <div className="page-header">
          <div className="page-header-left">
            <h1>Medical History</h1>
            <p>View patient medical history</p>
          </div>
        </div>
        <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
          <Lock size={48} style={{ opacity: 0.3, margin: '0 auto 1rem', color: '#9ca3af' }} />
          <h3 style={{ color: '#6b7280' }}>No authorized patients</h3>
          <p style={{ color: '#9ca3af' }}>Access is granted only by patients through the Doctor Sharing section</p>
        </div>
      </div>
    );
  }

  const patient = authorizedPatients[0];
  const patientRecords = records.filter(r => r.patientId === patient.id);
  const patientMeds = medicines.filter(m => m.patientId === patient.id);
  const patientVaccines = vaccines.filter(v => v.patientId === patient.id);

  const timeline = [
    ...patientRecords.map(r => ({
      type: 'report' as const,
      date: r.date,
      title: r.name,
      detail: `${r.type} · ${r.hospital}`,
      color: '#2563eb', bg: '#dbeafe'
    })),
    ...patientMeds.map(m => ({
      type: 'medicine' as const,
      date: m.startDate,
      title: `Started: ${m.name}`,
      detail: `${m.dosage} · ${m.frequency}`,
      color: '#7c3aed', bg: '#ede9fe'
    })),
    ...patientVaccines.filter(v => v.status === 'completed').map(v => ({
      type: 'vaccine' as const,
      date: v.date,
      title: `Vaccine: ${v.name}`,
      detail: v.dose,
      color: '#16a34a', bg: '#dcfce7'
    })),
  ].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Medical History</h1>
          <p>Patient medical timeline and history</p>
        </div>
      </div>

      {/* Patient summary */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#2563eb', fontSize: '1rem' }}>
              {patient.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1f2937' }}>{patient.name}</h2>
              <p style={{ fontSize: '0.82rem', color: '#6b7280' }}>
                Blood Group: <strong>{patient.bloodGroup ?? DEMO_EMERGENCY.bloodGroup}</strong>
                {patient.dateOfBirth && ` · Age: ${new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear()}`}
                {patient.gender && ` · ${patient.gender}`}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 700, color: '#2563eb', fontSize: '1.3rem' }}>{patientRecords.length}</div>
              <div style={{ fontSize: '0.7rem', color: '#9ca3af' }}>Reports</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 700, color: '#7c3aed', fontSize: '1.3rem' }}>{patientMeds.length}</div>
              <div style={{ fontSize: '0.7rem', color: '#9ca3af' }}>Medicines</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 700, color: '#16a34a', fontSize: '1.3rem' }}>{patientVaccines.length}</div>
              <div style={{ fontSize: '0.7rem', color: '#9ca3af' }}>Vaccines</div>
            </div>
          </div>
        </div>
      </div>

      {/* Allergies & conditions */}
      <div className="grid-2" style={{ gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="card" style={{ padding: '1.25rem' }}>
          <h3 style={{ fontWeight: 600, color: '#dc2626', marginBottom: '0.75rem', fontSize: '0.9rem' }}>⚠️ Known Allergies</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {DEMO_EMERGENCY.allergies.map((a, i) => (
              <span key={i} className="badge badge-red">{a}</span>
            ))}
          </div>
        </div>
        <div className="card" style={{ padding: '1.25rem' }}>
          <h3 style={{ fontWeight: 600, color: '#ea580c', marginBottom: '0.75rem', fontSize: '0.9rem' }}>📋 Medical Conditions</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {DEMO_EMERGENCY.conditions.map((c, i) => (
              <span key={i} className="badge badge-orange">{c}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="card">
        <div className="card-header">
          <h3>Medical Timeline</h3>
          <span className="badge badge-gray">{timeline.length} events</span>
        </div>
        <div style={{ padding: '1.5rem' }}>
          <div style={{ position: 'relative', paddingLeft: '2rem', borderLeft: '2px solid #e5e7eb' }}>
            {timeline.map((item, i) => (
              <div key={i} style={{ position: 'relative', paddingBottom: '1.5rem' }}>
                <div style={{
                  position: 'absolute', left: '-2.4rem', top: 4,
                  width: 14, height: 14, borderRadius: '50%', background: item.color, border: '3px solid white',
                  boxShadow: '0 0 0 2px ' + item.color + '40'
                }} />
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '0.1rem' }}>{item.date}</div>
                    <div style={{ fontWeight: 600, color: '#1f2937', fontSize: '0.875rem' }}>{item.title}</div>
                    <div style={{ fontSize: '0.78rem', color: '#6b7280' }}>{item.detail}</div>
                  </div>
                  <span style={{ background: item.bg, color: item.color, padding: '0.2rem 0.6rem', borderRadius: 20, fontSize: '0.7rem', fontWeight: 600, flexShrink: 0 }}>
                    {item.type}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
