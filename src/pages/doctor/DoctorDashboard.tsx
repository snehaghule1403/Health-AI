import { useNavigate } from 'react-router-dom';
import { Users, FileText, ShieldCheck, TrendingUp, ChevronRight, AlertCircle, Activity } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const { currentUser, users, consents, records } = useApp();

  // Patients who have granted this doctor access
  const grantedConsents = consents.filter(
    c => c.doctorId === currentUser?.id && c.status === 'granted'
  );

  const authorizedPatients = users.filter(u =>
    u.role === 'patient' &&
    grantedConsents.some(c => c.patientId === u.id)
  );

  const firstName = currentUser?.name.split(' ')[0] ?? 'Doctor';
  const greetingHour = new Date().getHours();
  const greeting = greetingHour < 12 ? 'Good morning' : greetingHour < 17 ? 'Good afternoon' : 'Good evening';

  const statCards = [
    {
      icon: <Users size={20} />, iconBg: '#dbeafe', iconColor: '#2563eb',
      label: 'Authorized Patients', value: authorizedPatients.length, sub: 'Active consent'
    },
    {
      icon: <FileText size={20} />, iconBg: '#dcfce7', iconColor: '#16a34a',
      label: 'Reports Available', value: records.filter(r =>
        grantedConsents.some(c => c.patientId === r.patientId)
      ).length, sub: 'Across all patients'
    },
    {
      icon: <ShieldCheck size={20} />, iconBg: '#fef3c7', iconColor: '#d97706',
      label: 'Pending Requests', value: consents.filter(c =>
        c.doctorId === currentUser?.id && c.status === 'pending'
      ).length, sub: 'Awaiting patient approval'
    },
    {
      icon: <Activity size={20} />, iconBg: '#ede9fe', iconColor: '#7c3aed',
      label: 'Consultations', value: 3, sub: 'This month (demo)'
    },
  ];

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <div className="demo-badge" style={{ marginBottom: '0.5rem' }}>DEMO DATA</div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1f2937' }}>
          {greeting}, {firstName} 👋
        </h1>
        <p style={{ color: '#6b7280', marginTop: '0.25rem' }}>
          {currentUser?.specialization ?? 'Doctor'} · {currentUser?.hospital ?? 'Demo Medical Center'}
        </p>
      </div>

      <div className="disclaimer" style={{ marginBottom: '1.5rem' }}>
        <AlertCircle size={16} style={{ flexShrink: 0 }} />
        You can only access patient records when the patient has explicitly granted you consent.
      </div>

      {/* Stats */}
      <div className="grid-4" style={{ marginBottom: '2rem' }}>
        {statCards.map((card, i) => (
          <div key={i} className="stat-card">
            <div className="stat-card-icon" style={{ background: card.iconBg, color: card.iconColor }}>
              {card.icon}
            </div>
            <div className="stat-card-label">{card.label}</div>
            <div className="stat-card-value">{card.value}</div>
            <div className="stat-card-sub">{card.sub}</div>
          </div>
        ))}
      </div>

      {/* Authorized Patients */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header">
          <h3>Authorized Patients</h3>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/doctor/patients')}>
            View All <ChevronRight size={14} />
          </button>
        </div>
        {authorizedPatients.length === 0 ? (
          <div className="empty-state">
            <Users size={40} />
            <h3>No authorized patients</h3>
            <p>Patients will appear here once they grant you access</p>
          </div>
        ) : (
          <div style={{ padding: '0.5rem 0' }}>
            {authorizedPatients.map(patient => {
              const patientRecords = records.filter(r => r.patientId === patient.id);
              return (
                <div
                  key={patient.id}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '1rem 1.5rem', borderBottom: '1px solid #f3f4f6',
                    cursor: 'pointer'
                  }}
                  onClick={() => navigate(`/doctor/patients`)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      width: 42, height: 42, borderRadius: '50%', background: '#dbeafe',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, color: '#2563eb', fontSize: '0.9rem'
                    }}>
                      {patient.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#1f2937' }}>
                        {patient.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                        {patient.bloodGroup ?? 'N/A'} · {patientRecords.length} records
                        {patient.dateOfBirth && ` · Age: ${new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear()}`}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span className="badge badge-green">Access Granted</span>
                    <ChevronRight size={16} color="#9ca3af" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Access */}
      <div className="grid-3" style={{ gap: '1rem' }}>
        {[
          { icon: <Users size={20} />, title: 'Patient List', desc: 'View all authorized patients', path: '/doctor/patients', color: '#2563eb', bg: '#dbeafe' },
          { icon: <FileText size={20} />, title: 'View Reports', desc: 'Access patient medical reports', path: '/doctor/reports', color: '#16a34a', bg: '#dcfce7' },
          { icon: <TrendingUp size={20} />, title: 'Health Trends', desc: 'Monitor patient health metrics', path: '/doctor/trends', color: '#ea580c', bg: '#ffedd5' },
        ].map((item, i) => (
          <div
            key={i}
            className="card"
            style={{ padding: '1.25rem', cursor: 'pointer' }}
            onClick={() => navigate(item.path)}
          >
            <div style={{
              width: 44, height: 44, borderRadius: 12, background: item.bg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: item.color, marginBottom: '0.75rem'
            }}>
              {item.icon}
            </div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#1f2937', marginBottom: '0.25rem' }}>
              {item.title}
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#6b7280' }}>{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
