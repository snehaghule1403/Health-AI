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
      icon: <Users size={20} />, iconBg: 'var(--primary-light)', iconColor: 'var(--primary)',
      label: 'Authorized Patients', value: authorizedPatients.length, sub: 'Active consent'
    },
    {
      icon: <FileText size={20} />, iconBg: 'var(--green-light)', iconColor: 'var(--green)',
      label: 'Reports Available', value: records.filter(r =>
        grantedConsents.some(c => c.patientId === r.patientId)
      ).length, sub: 'Across all patients'
    },
    {
      icon: <ShieldCheck size={20} />, iconBg: 'var(--yellow-light)', iconColor: 'var(--orange)',
      label: 'Revoked Access', value: consents.filter(c =>
        c.doctorId === currentUser?.id && c.status === 'revoked'
      ).length, sub: 'Patients who withdrew consent'
    },
    {
      icon: <Activity size={20} />, iconBg: 'var(--violet-light)', iconColor: 'var(--violet)',
      label: 'AI Summaries', value: records.filter(r => r.aiAnalysis && grantedConsents.some(c => c.patientId === r.patientId)).length, sub: 'Reports with AI summary'
    },
  ];

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>

        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--gray-800)' }}>
          {greeting}, {firstName} 👋
        </h1>
        <p style={{ color: 'var(--gray-500)', marginTop: '0.25rem' }}>
          {currentUser?.specialization ?? 'Doctor'} · {currentUser?.hospital || 'Hospital not set'}
        </p>
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
                    padding: '1rem 1.5rem', borderBottom: '1px solid var(--gray-100)',
                    cursor: 'pointer'
                  }}
                  onClick={() => navigate(`/doctor/patients`)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      width: 42, height: 42, borderRadius: '50%', background: 'var(--primary-light)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, color: 'var(--primary)', fontSize: '0.9rem'
                    }}>
                      {patient.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--gray-800)' }}>
                        {patient.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>
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
          { icon: <Users size={20} />, title: 'Patient List', desc: 'View all authorized patients', path: '/doctor/patients', color: 'var(--primary)', bg: 'var(--primary-light)' },
          { icon: <FileText size={20} />, title: 'View Reports', desc: 'Access patient medical reports', path: '/doctor/reports', color: 'var(--green)', bg: 'var(--green-light)' },
          { icon: <TrendingUp size={20} />, title: 'Health Trends', desc: 'Monitor patient health metrics', path: '/doctor/trends', color: 'var(--orange)', bg: 'var(--orange-light)' },
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
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--gray-800)', marginBottom: '0.25rem' }}>
              {item.title}
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
