import { useState } from 'react';
import { Share2, CheckCircle, XCircle, Clock, Shield, History, UserPlus, AlertCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { ConsentRecord } from '../../types';

export default function DoctorSharing() {
  const { currentUser, consents, addConsent, updateConsent, users } = useApp();
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [reqForm, setReqForm] = useState({ doctorEmail: '' });
  const [reqError, setReqError] = useState('');
  const [reqSuccess, setReqSuccess] = useState('');

  const patientConsents = consents.filter(c => c.patientId === currentUser?.id);

  const handleGrant = (consent: ConsentRecord) => {
    const now = new Date().toISOString();
    updateConsent({
      ...consent,
      status: 'granted',
      grantedAt: now,
      revokedAt: undefined,
      history: [
        ...consent.history,
        { action: 'Access Granted', timestamp: now },
      ],
    });
  };

  const handleRevoke = (consent: ConsentRecord) => {
    const now = new Date().toISOString();
    updateConsent({
      ...consent,
      status: 'revoked',
      revokedAt: now,
      history: [
        ...consent.history,
        { action: 'Access Revoked', timestamp: now },
      ],
    });
  };

  const handleRequest = () => {
    setReqError('');
    const doctor = users.find(u => u.email === reqForm.doctorEmail && u.role === 'doctor');
    if (!doctor) {
      setReqError('Doctor not found. Use: doctor@healthai.demo');
      return;
    }
    const existing = patientConsents.find(c => c.doctorId === doctor.id);
    if (existing) {
      setReqError('You already have a consent record with this doctor.');
      return;
    }
    const newConsent: ConsentRecord = {
      id: `con-${Date.now()}`,
      patientId: currentUser!.id,
      doctorId: doctor.id,
      doctorName: doctor.name,
      hospital: doctor.hospital ?? 'Unknown',
      accessType: 'Full Medical Records',
      status: 'granted',
      grantedAt: new Date().toISOString(),
      history: [
        { action: 'Access Granted', timestamp: new Date().toISOString() },
      ],
    };
    addConsent(newConsent);
    setReqSuccess(`Access granted to ${doctor.name}`);
    setShowRequestForm(false);
    setReqForm({ doctorEmail: '' });
    setTimeout(() => setReqSuccess(''), 4000);
  };

  const statusBadge = (status: ConsentRecord['status']) => {
    if (status === 'granted') return <span className="badge badge-green"><CheckCircle size={10} /> Granted</span>;
    if (status === 'revoked') return <span className="badge badge-red"><XCircle size={10} /> Revoked</span>;
    return <span className="badge badge-orange"><Clock size={10} /> Pending</span>;
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Doctor Sharing</h1>
          <p>Control which doctors can access your health records</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowRequestForm(!showRequestForm)}>
          <UserPlus size={16} /> Grant Doctor Access
        </button>
      </div>

      {reqSuccess && (
        <div className="alert alert-success">{reqSuccess}</div>
      )}

      <div className="disclaimer" style={{ marginBottom: '1.5rem' }}>
        <Shield size={16} style={{ flexShrink: 0 }} />
        You have full control over your health data. Grant or revoke doctor access at any time. Revoked access takes immediate effect.
      </div>

      {/* Add Doctor Form */}
      {showRequestForm && (
        <div className="card" style={{ marginBottom: '1.5rem', padding: '1.5rem' }}>
          <h3 style={{ fontWeight: 600, marginBottom: '1rem', fontSize: '0.95rem' }}>
            <UserPlus size={16} style={{ marginRight: 8 }} />
            Grant New Doctor Access
          </h3>
          {reqError && <div className="alert alert-danger" style={{ marginBottom: '0.75rem' }}>{reqError}</div>}
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <label className="form-label">Doctor Email Address</label>
              <input
                value={reqForm.doctorEmail}
                onChange={e => setReqForm({ doctorEmail: e.target.value })}
                placeholder="doctor@healthai.demo"
              />
              <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.3rem' }}>
                Demo: Use doctor@healthai.demo
              </p>
            </div>
            <button className="btn btn-success" onClick={handleRequest}>
              <CheckCircle size={14} /> Grant Access
            </button>
            <button className="btn btn-outline" onClick={() => setShowRequestForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Consent List */}
      {patientConsents.length === 0 ? (
        <div className="empty-state">
          <Share2 size={48} />
          <h3>No sharing records</h3>
          <p>Grant a doctor access to start sharing your records</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {patientConsents.map(consent => (
            <div key={consent.id} className="card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: '50%', background: '#dcfce7',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, color: '#16a34a', fontSize: '0.9rem'
                  }}>
                    {consent.doctorName.split(' ').slice(-1)[0].slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 style={{ fontWeight: 600, color: '#1f2937', fontSize: '1rem' }}>{consent.doctorName}</h3>
                    <p style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                      {consent.hospital} · {consent.accessType}
                    </p>
                  </div>
                </div>
                {statusBadge(consent.status)}
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
                {consent.status !== 'granted' && (
                  <button className="btn btn-success btn-sm" onClick={() => handleGrant(consent)}>
                    <CheckCircle size={13} /> Grant Access
                  </button>
                )}
                {consent.status === 'granted' && (
                  <button className="btn btn-danger btn-sm" onClick={() => handleRevoke(consent)}>
                    <XCircle size={13} /> Revoke Access
                  </button>
                )}
              </div>

              {/* History */}
              <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '0.75rem' }}>
                <h4 style={{ fontSize: '0.78rem', fontWeight: 600, color: '#9ca3af', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <History size={12} /> ACCESS HISTORY
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  {consent.history.slice().reverse().slice(0, 5).map((h, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.78rem' }}>
                      <div style={{
                        width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                        background: h.action.includes('Granted') ? '#16a34a' : h.action.includes('Revoked') ? '#dc2626' : '#6b7280'
                      }} />
                      <span style={{ color: '#374151' }}>{h.action}</span>
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

      {/* Info card */}
      <div className="card" style={{ padding: '1.25rem', marginTop: '1.5rem', background: '#f0fdf4', border: '1px solid #86efac' }}>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
          <AlertCircle size={18} color="#16a34a" style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <h4 style={{ fontWeight: 600, color: '#166534', marginBottom: '0.25rem', fontSize: '0.9rem' }}>
              About Consent-Based Sharing
            </h4>
            <p style={{ fontSize: '0.825rem', color: '#16a34a', lineHeight: 1.6 }}>
              When you grant access to a doctor, they can view your medical records, AI summaries, and health trends.
              When you revoke access, the doctor immediately loses the ability to view your data.
              You can grant access again at any time.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
