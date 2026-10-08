import { ShieldCheck, CheckCircle, XCircle, History, AlertCircle, Lock } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { ConsentRecord } from '../../types';

export default function DoctorConsent() {
  const { currentUser, consents, users } = useApp();

  const myConsents = consents.filter(c => c.doctorId === currentUser?.id);

  const getPatientName = (id: string) => users.find(u => u.id === id)?.name ?? 'Unknown';

  const statusBadge = (status: ConsentRecord['status']) => {
    if (status === 'granted') return <span className="badge badge-green"><CheckCircle size={10} /> Access Granted</span>;
    if (status === 'revoked') return <span className="badge badge-red"><XCircle size={10} /> Access Revoked</span>;
    return <span className="badge badge-orange">Pending</span>;
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Patient Consent</h1>
          <p>Manage access permissions granted by patients</p>
        </div>
      </div>

      <div className="disclaimer" style={{ marginBottom: '1.5rem' }}>
        <ShieldCheck size={16} style={{ flexShrink: 0 }} />
        You can only access patient data when explicit consent has been granted. Patients can revoke access at any time.
      </div>

      {myConsents.length === 0 ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>
          <ShieldCheck size={48} style={{ opacity: 0.3, margin: '0 auto 1rem' }} />
          <h3 style={{ color: '#6b7280' }}>No consent records</h3>
          <p>Patients will appear here after they grant you access</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {myConsents.map(consent => (
            <div key={consent.id} className="card" style={{ padding: '1.5rem', borderLeft: `4px solid ${consent.status === 'granted' ? '#16a34a' : consent.status === 'revoked' ? '#dc2626' : '#d97706'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ fontWeight: 600, color: '#1f2937', marginBottom: '0.25rem' }}>
                    {getPatientName(consent.patientId)}
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                    {consent.accessType} · {consent.hospital}
                  </p>
                </div>
                {statusBadge(consent.status)}
              </div>

              {consent.status === 'revoked' && (
                <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>
                  <Lock size={14} />
                  Access Denied — Patient has revoked your permission. You cannot view this patient's records.
                </div>
              )}

              {consent.status === 'granted' && (
                <div className="alert alert-success" style={{ marginBottom: '1rem' }}>
                  <CheckCircle size={14} />
                  You have full access to this patient's medical records, AI summaries, and health trends.
                </div>
              )}

              {/* Access history */}
              <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '0.75rem' }}>
                <h4 style={{ fontSize: '0.78rem', fontWeight: 600, color: '#9ca3af', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <History size={12} /> ACCESS LOG
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  {consent.history.slice().reverse().map((h, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.78rem' }}>
                      <div style={{
                        width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                        background: h.action.includes('Granted') ? '#16a34a' : h.action.includes('Revoked') ? '#dc2626' : '#6b7280'
                      }} />
                      <span style={{ color: '#374151', minWidth: 140 }}>{h.action}</span>
                      <span style={{ color: '#9ca3af' }}>
                        {new Date(h.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="card" style={{ marginTop: '1.5rem', padding: '1.25rem', background: '#f9fafb' }}>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
          <AlertCircle size={18} color="#6b7280" style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <h4 style={{ fontWeight: 600, color: '#374151', marginBottom: '0.3rem', fontSize: '0.9rem' }}>
              How Patient Consent Works
            </h4>
            <ul style={{ fontSize: '0.8rem', color: '#6b7280', lineHeight: 1.7, paddingLeft: '1rem' }}>
              <li>Patients control access to their own health data at all times</li>
              <li>When a patient revokes access, you immediately lose the ability to view their records</li>
              <li>Access history is maintained for transparency and audit purposes</li>
              <li>You can ask patients to grant access through the Doctor Sharing section of their portal</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
