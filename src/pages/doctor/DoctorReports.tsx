import { useState } from 'react';
import { FileText, Lock, Brain, X, CheckCircle, AlertCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { HealthRecord } from '../../types';

export default function DoctorReports() {
  const { currentUser, users, consents, records } = useApp();
  const [viewRecord, setViewRecord] = useState<HealthRecord | null>(null);

  const grantedConsents = consents.filter(
    c => c.doctorId === currentUser?.id && c.status === 'granted'
  );

  const authorizedPatientIds = grantedConsents.map(c => c.patientId);
  const authorizedRecords = records.filter(r => authorizedPatientIds.includes(r.patientId));

  const getPatientName = (id: string) => users.find(u => u.id === id)?.name ?? 'Unknown';

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Reports</h1>
          <p>View medical reports from authorized patients</p>
        </div>
        <span className="badge badge-blue">{authorizedRecords.length} reports accessible</span>
      </div>

      {authorizedRecords.length === 0 ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
          <Lock size={48} style={{ opacity: 0.3, margin: '0 auto 1rem', color: '#9ca3af' }} />
          <h3 style={{ color: '#6b7280', marginBottom: '0.5rem' }}>No authorized records</h3>
          <p style={{ color: '#9ca3af' }}>Access patient reports after patients grant you consent</p>
        </div>
      ) : (
        <div className="card">
          <div className="card-header">
            <h3>Patient Reports</h3>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Report</th>
                  <th>Patient</th>
                  <th>Type</th>
                  <th>Date</th>
                  <th>Hospital</th>
                  <th>AI</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {authorizedRecords.map(record => (
                  <tr key={record.id}>
                    <td style={{ fontWeight: 500 }}>{record.name}</td>
                    <td>{getPatientName(record.patientId)}</td>
                    <td>
                      <span className="badge badge-blue" style={{ fontSize: '0.7rem' }}>{record.type}</span>
                    </td>
                    <td>{record.date}</td>
                    <td style={{ color: '#6b7280' }}>{record.hospital || '—'}</td>
                    <td>
                      {record.aiAnalysis
                        ? <span className="badge badge-green" style={{ fontSize: '0.7rem' }}><CheckCircle size={9} /> Done</span>
                        : <span style={{ color: '#9ca3af', fontSize: '0.75rem' }}>—</span>
                      }
                    </td>
                    <td>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => setViewRecord(record)}
                      >
                        <FileText size={12} /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* View Record Modal */}
      {viewRecord && (
        <div className="modal-overlay" onClick={() => setViewRecord(null)}>
          <div className="modal" style={{ maxWidth: 680 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{viewRecord.name}</h3>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setViewRecord(null)}>
                <X size={20} color="#6b7280" />
              </button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                {[
                  { label: 'Patient', value: getPatientName(viewRecord.patientId) },
                  { label: 'Type', value: viewRecord.type },
                  { label: 'Date', value: viewRecord.date },
                  { label: 'Hospital', value: viewRecord.hospital || 'N/A' },
                ].map(({ label, value }) => (
                  <div key={label} style={{ background: '#f9fafb', borderRadius: 8, padding: '0.75rem' }}>
                    <div style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 600 }}>{label}</div>
                    <div style={{ fontSize: '0.875rem', color: '#1f2937', fontWeight: 500 }}>{value}</div>
                  </div>
                ))}
              </div>

              {viewRecord.extractedText && (
                <div style={{ marginBottom: '1rem' }}>
                  <h4 style={{ fontWeight: 600, fontSize: '0.875rem', color: '#374151', marginBottom: '0.5rem' }}>Report Content</h4>
                  <pre style={{ background: '#1f2937', color: '#f9fafb', padding: '1rem', borderRadius: 8, fontSize: '0.78rem', whiteSpace: 'pre-wrap', maxHeight: 220, overflowY: 'auto', fontFamily: 'monospace' }}>
                    {viewRecord.extractedText}
                  </pre>
                </div>
              )}

              {viewRecord.aiAnalysis && (
                <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, padding: '1rem' }}>
                  <h4 style={{ fontWeight: 600, color: '#166534', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                    <Brain size={14} /> AI Analysis Summary
                  </h4>
                  <p style={{ fontSize: '0.85rem', color: '#374151', marginBottom: '0.75rem' }}>{viewRecord.aiAnalysis.summary}</p>
                  <div style={{ marginBottom: '0.75rem' }}>
                    <h5 style={{ fontWeight: 600, fontSize: '0.8rem', color: '#166534', marginBottom: '0.4rem' }}>Key Findings:</h5>
                    {viewRecord.aiAnalysis.keyFindings.map((f, i) => (
                      <div key={i} style={{ display: 'flex', gap: '0.4rem', fontSize: '0.8rem', color: '#374151', marginBottom: '0.2rem' }}>
                        <CheckCircle size={12} color="#16a34a" style={{ flexShrink: 0, marginTop: 2 }} />
                        {f}
                      </div>
                    ))}
                  </div>
                  <div style={{ padding: '0.75rem', background: '#fef9c3', borderRadius: 6, fontSize: '0.75rem', color: '#713f12' }}>
                    <AlertCircle size={12} style={{ display: 'inline', marginRight: 4 }} />
                    {viewRecord.aiAnalysis.disclaimer}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
