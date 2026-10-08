import { useState } from 'react';
import { Users, FileText, TrendingUp, ChevronRight, Lock, X, Brain, CheckCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { HealthRecord } from '../../types';
import { analyzeReport } from '../../utils/aiUtils';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { DEMO_TRENDS } from '../../data/demoData';

export default function DoctorPatients() {
  const { currentUser, users, consents, records, medicines, vaccines } = useApp();
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'records' | 'history' | 'trends'>('records');
  const [viewRecord, setViewRecord] = useState<HealthRecord | null>(null);

  const grantedConsents = consents.filter(
    c => c.doctorId === currentUser?.id && c.status === 'granted'
  );

  const patients = users.filter(u =>
    u.role === 'patient' &&
    grantedConsents.some(c => c.patientId === u.id)
  );

  const allPatients = users.filter(u => u.role === 'patient');

  const selectedPatient = patients.find(p => p.id === selectedPatientId);
  const hasAccess = selectedPatient !== undefined;

  const patientRecords = selectedPatientId
    ? records.filter(r => r.patientId === selectedPatientId)
    : [];

  const patientMeds = selectedPatientId
    ? medicines.filter(m => m.patientId === selectedPatientId)
    : [];

  const patientVaccines = selectedPatientId
    ? vaccines.filter(v => v.patientId === selectedPatientId)
    : [];

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Patients</h1>
          <p>View authorized patient records</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '1.25rem', alignItems: 'start' }}>
        {/* Patient list */}
        <div className="card">
          <div className="card-header">
            <h3>Patient List</h3>
            <span className="badge badge-green">{patients.length} authorized</span>
          </div>
          <div>
            {allPatients.map(patient => {
              const authorized = grantedConsents.some(c => c.patientId === patient.id);
              return (
                <div
                  key={patient.id}
                  onClick={() => authorized ? setSelectedPatientId(patient.id) : null}
                  style={{
                    padding: '0.85rem 1rem',
                    borderBottom: '1px solid #f3f4f6',
                    cursor: authorized ? 'pointer' : 'not-allowed',
                    background: selectedPatientId === patient.id ? '#dbeafe' : 'transparent',
                    opacity: authorized ? 1 : 0.5,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%',
                        background: authorized ? '#dcfce7' : '#f3f4f6',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700, fontSize: '0.8rem',
                        color: authorized ? '#16a34a' : '#9ca3af'
                      }}>
                        {patient.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#1f2937' }}>{patient.name}</div>
                        <div style={{ fontSize: '0.7rem', color: '#9ca3af' }}>
                          {patient.bloodGroup ?? 'N/A'}
                          {patient.dateOfBirth && ` · ${new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear()}y`}
                        </div>
                      </div>
                    </div>
                    {authorized
                      ? <ChevronRight size={14} color="#9ca3af" />
                      : <Lock size={13} color="#9ca3af" />
                    }
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Patient detail */}
        <div>
          {!selectedPatient ? (
            <div className="card" style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>
              <Users size={48} style={{ opacity: 0.3, margin: '0 auto 1rem' }} />
              <h3 style={{ color: '#6b7280' }}>Select a patient</h3>
              <p>Choose an authorized patient from the list to view their records</p>
            </div>
          ) : (
            <>
              {/* Patient header */}
              <div className="card" style={{ marginBottom: '1rem', padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{
                      width: 52, height: 52, borderRadius: '50%', background: '#dbeafe',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, color: '#2563eb', fontSize: '1rem'
                    }}>
                      {selectedPatient.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                      <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1f2937' }}>{selectedPatient.name}</h2>
                      <p style={{ fontSize: '0.82rem', color: '#6b7280' }}>
                        Blood Group: <strong>{selectedPatient.bloodGroup ?? 'N/A'}</strong>
                        {selectedPatient.dateOfBirth && ` · Age: ${new Date().getFullYear() - new Date(selectedPatient.dateOfBirth).getFullYear()}`}
                        {selectedPatient.gender && ` · ${selectedPatient.gender}`}
                      </p>
                    </div>
                  </div>
                  <span className="badge badge-green">Access Authorized</span>
                </div>
              </div>

              {/* View tabs */}
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                {([['records', 'Medical Records'], ['history', 'Medical History'], ['trends', 'Health Trends']] as const).map(([tab, label]) => (
                  <button
                    key={tab}
                    onClick={() => setActiveView(tab)}
                    className={`btn btn-sm ${activeView === tab ? 'btn-primary' : 'btn-outline'}`}
                  >
                    {tab === 'records' ? <FileText size={13} /> : tab === 'history' ? <Users size={13} /> : <TrendingUp size={13} />}
                    {label}
                  </button>
                ))}
              </div>

              {/* Records view */}
              {activeView === 'records' && (
                <div className="card">
                  <div className="card-header"><h3>Medical Records ({patientRecords.length})</h3></div>
                  {patientRecords.length === 0 ? (
                    <div className="empty-state">
                      <p>No records available</p>
                    </div>
                  ) : (
                    <div>
                      {patientRecords.map(record => (
                        <div
                          key={record.id}
                          style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '0.85rem 1.25rem', borderBottom: '1px solid #f3f4f6', cursor: 'pointer'
                          }}
                          onClick={() => setViewRecord(record)}
                        >
                          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                            <FileText size={18} color="#2563eb" />
                            <div>
                              <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#1f2937' }}>{record.name}</div>
                              <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{record.date} · {record.hospital}</div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            {record.aiAnalysis && <span className="badge badge-green btn-sm"><Brain size={10} /> AI</span>}
                            <span className="badge badge-gray" style={{ fontSize: '0.7rem' }}>{record.type}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* History view */}
              {activeView === 'history' && (
                <div className="card">
                  <div className="card-header"><h3>Medical Timeline</h3></div>
                  <div style={{ padding: '1rem 1.5rem' }}>
                    <div style={{ position: 'relative', paddingLeft: '1.5rem', borderLeft: '2px solid #e5e7eb' }}>
                      {[
                        ...patientRecords.map(r => ({ type: 'report', date: r.date, title: r.name, detail: `${r.type} · ${r.hospital}`, color: '#2563eb' })),
                        ...patientMeds.map(m => ({ type: 'medicine', date: m.startDate, title: `Started ${m.name}`, detail: m.dosage, color: '#7c3aed' })),
                        ...patientVaccines.filter(v => v.status === 'completed').map(v => ({ type: 'vaccine', date: v.date, title: `Vaccine: ${v.name}`, detail: v.dose, color: '#16a34a' })),
                      ].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10).map((item, i) => (
                        <div key={i} style={{ position: 'relative', paddingBottom: '1.25rem' }}>
                          <div style={{
                            position: 'absolute', left: '-1.65rem', top: 2,
                            width: 12, height: 12, borderRadius: '50%', background: item.color, border: '2px solid white'
                          }} />
                          <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '0.1rem' }}>{item.date}</div>
                          <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#1f2937' }}>{item.title}</div>
                          <div style={{ fontSize: '0.78rem', color: '#6b7280' }}>{item.detail}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Trends view */}
              {activeView === 'trends' && (
                <div className="card">
                  <div className="card-header"><h3>Health Trends</h3></div>
                  <div style={{ padding: '1.25rem' }}>
                    <ResponsiveContainer width="100%" height={260}>
                      <LineChart data={DEMO_TRENDS}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip contentStyle={{ borderRadius: 8, fontSize: '0.8rem' }} />
                        <Line type="monotone" dataKey="hemoglobin" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} name="Hemoglobin" />
                        <Line type="monotone" dataKey="bmi" stroke="#16a34a" strokeWidth={2} dot={{ r: 3 }} name="BMI" />
                      </LineChart>
                    </ResponsiveContainer>
                    <div style={{
                      marginTop: '0.75rem', padding: '0.75rem', background: '#eff6ff',
                      borderRadius: 8, fontSize: '0.8rem', color: '#1e40af'
                    }}>
                      📊 AI Insight: Patient's hemoglobin has shown a positive trend from 11.8 to 12.4 g/dL over 6 months. BMI remains stable in the normal range.
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Record detail modal */}
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
                  { label: 'Type', value: viewRecord.type },
                  { label: 'Date', value: viewRecord.date },
                  { label: 'Hospital', value: viewRecord.hospital || 'N/A' },
                  { label: 'Doctor', value: viewRecord.doctor || 'N/A' },
                ].map(({ label, value }) => (
                  <div key={label} style={{ background: '#f9fafb', borderRadius: 8, padding: '0.75rem' }}>
                    <div style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 600 }}>{label}</div>
                    <div style={{ fontSize: '0.875rem', color: '#1f2937', fontWeight: 500 }}>{value}</div>
                  </div>
                ))}
              </div>

              {viewRecord.extractedText && (
                <div style={{ marginBottom: '1rem' }}>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>Report Content</h4>
                  <pre style={{ background: '#1f2937', color: '#f9fafb', padding: '1rem', borderRadius: 8, fontSize: '0.78rem', whiteSpace: 'pre-wrap', maxHeight: 200, overflowY: 'auto', fontFamily: 'monospace' }}>
                    {viewRecord.extractedText}
                  </pre>
                </div>
              )}

              {viewRecord.aiAnalysis && (
                <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, padding: '1rem' }}>
                  <h4 style={{ fontWeight: 600, color: '#166534', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                    <Brain size={14} /> AI Summary
                  </h4>
                  <p style={{ fontSize: '0.85rem', color: '#374151', marginBottom: '0.5rem' }}>{viewRecord.aiAnalysis.summary}</p>
                  {viewRecord.aiAnalysis.keyFindings.slice(0, 2).map((f, i) => (
                    <div key={i} style={{ display: 'flex', gap: '0.4rem', fontSize: '0.8rem', color: '#166534', marginBottom: '0.2rem' }}>
                      <CheckCircle size={12} style={{ flexShrink: 0, marginTop: 2 }} />
                      {f}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
