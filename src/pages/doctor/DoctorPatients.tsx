import { useMemo, useState } from 'react';
import { Lock, Search, FileText, Eye, X, Brain, Download, Loader, AlertCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { HealthRecord } from '../../types';
import { apiPost } from '../../lib/api';
import AIAnalysisView from '../../components/AIAnalysisView';
import TrendsPanel from '../../components/TrendsPanel';

const PAGE_SIZE = 20;

export default function DoctorPatients() {
  const { currentUser, users, consents, records, medicines, vaccines, getFileUrl } = useApp();
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'records' | 'history' | 'trends'>('records');
  const [viewRecord, setViewRecord] = useState<HealthRecord | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [ai, setAi] = useState<{ loading: boolean; error?: string; analysis?: HealthRecord['aiAnalysis'] }>({ loading: false });

  // Patients come from the database; RLS returns only those with current consent.
  const grantedIds = new Set(consents.filter(c => c.doctorId === currentUser?.id && c.status === 'granted').map(c => c.patientId));
  const patients = useMemo(() => users
    .filter(u => u.role === 'patient' && grantedIds.has(u.id))
    .filter(u => !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name)),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [users, consents, search]);

  const pageCount = Math.max(1, Math.ceil(patients.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pagePatients = patients.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const selectedPatient = patients.find(p => p.id === selectedPatientId) ?? users.find(u => u.id === selectedPatientId && grantedIds.has(u.id));
  const patientRecords = records.filter(r => r.patientId === selectedPatient?.id).sort((a, b) => b.date.localeCompare(a.date));
  const patientMeds = medicines.filter(m => m.patientId === selectedPatient?.id);
  const patientVaccines = vaccines.filter(v => v.patientId === selectedPatient?.id);

  const openRecord = (r: HealthRecord) => { setViewRecord(r); setAi({ loading: false, analysis: r.aiAnalysis }); };

  const runAI = async () => {
    if (!viewRecord) return;
    setAi({ loading: true });
    try {
      const { analysis } = await apiPost<{ analysis: HealthRecord['aiAnalysis'] }>('/api/ai/summarize', { recordId: viewRecord.id });
      setAi({ loading: false, analysis });
    } catch (e) {
      setAi({ loading: false, error: (e as Error).message });
    }
  };

  const openFile = async (r: HealthRecord, download: boolean) => {
    const url = await getFileUrl(r, download);
    if (url) window.open(url, '_blank', 'noopener');
  };

  const age = (dob?: string) => dob ? Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 3600 * 1000)) : null;

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Patients</h1>
          <p>View authorized patient records</p>
        </div>
      </div>

      <div className="doctor-patients-layout">
        {/* Patient list */}
        <div className="card">
          <div className="card-header">
            <h3>Patient List</h3>
            <span className="badge badge-green">{grantedIds.size} authorized</span>
          </div>
          <div style={{ padding: '0.75rem' }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} aria-hidden style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
              <label htmlFor="pt-search" className="sr-only">Search patients</label>
              <input id="pt-search" placeholder="Search name or email" value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }} style={{ paddingLeft: '2rem' }} />
            </div>
          </div>
          <div>
            {pagePatients.length === 0 && (
              <p style={{ padding: '1rem', fontSize: '0.85rem', color: '#9ca3af', textAlign: 'center' }}>
                {grantedIds.size === 0 ? 'No patients have granted you access yet.' : 'No patients match your search.'}
              </p>
            )}
            {pagePatients.map(patient => (
              <button
                key={patient.id}
                onClick={() => { setSelectedPatientId(patient.id); setActiveView('records'); }}
                aria-pressed={selectedPatient?.id === patient.id}
                style={{
                  display: 'flex', width: '100%', textAlign: 'left', alignItems: 'center', gap: '0.75rem',
                  padding: '0.85rem 1rem', border: 'none', borderTop: '1px solid #f3f4f6', cursor: 'pointer',
                  background: selectedPatient?.id === patient.id ? '#dbeafe' : 'transparent',
                }}
              >
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#2563eb', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem', flexShrink: 0 }}>
                  {patient.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#1f2937' }}>{patient.name}</div>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {records.filter(r => r.patientId === patient.id).length} records
                  </div>
                </div>
              </button>
            ))}
          </div>
          {pageCount > 1 && (
            <nav className="pager" aria-label="Patient pages" style={{ padding: '0.75rem' }}>
              <button className="btn btn-outline btn-sm" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>Prev</button>
              <span>{currentPage}/{pageCount}</span>
              <button className="btn btn-outline btn-sm" disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)}>Next</button>
            </nav>
          )}
        </div>

        {/* Patient detail */}
        <div>
          {!selectedPatient ? (
            <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
              <Lock size={48} style={{ opacity: 0.3, margin: '0 auto 1rem', color: '#9ca3af' }} />
              <h3 style={{ color: '#6b7280' }}>Select a patient</h3>
              <p style={{ color: '#9ca3af' }}>Only patients who have granted you access are listed.</p>
            </div>
          ) : (
            <>
              <div className="card" style={{ padding: '1.25rem', marginBottom: '1rem' }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1f2937' }}>{selectedPatient.name}</h2>
                <p style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                  Blood Group: <strong>{selectedPatient.bloodGroup || 'N/A'}</strong>
                  {age(selectedPatient.dateOfBirth) !== null && ` · Age: ${age(selectedPatient.dateOfBirth)}`}
                  {selectedPatient.gender && ` · ${selectedPatient.gender}`}
                </p>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', flexWrap: 'wrap' }} role="tablist">
                  {(['records', 'history', 'trends'] as const).map(v => (
                    <button key={v} role="tab" aria-selected={activeView === v}
                      className={`btn btn-sm ${activeView === v ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveView(v)}>
                      {v === 'records' ? `Records (${patientRecords.length})` : v === 'history' ? 'Medicines & Vaccines' : 'Trends'}
                    </button>
                  ))}
                </div>
              </div>

              {activeView === 'records' && (
                patientRecords.length === 0 ? (
                  <div className="card empty-state"><FileText size={36} /><p>No records shared by this patient.</p></div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {patientRecords.map(r => (
                      <div key={r.id} className="card" style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <div>
                          <div style={{ fontWeight: 600 }}>{r.name}</div>
                          <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>{r.type} · {r.date} · {r.hospital || 'N/A'}</div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          {r.aiAnalysis && <span className="badge badge-green">AI summary</span>}
                          <button className="btn btn-outline btn-sm" onClick={() => openRecord(r)}><Eye size={13} /> View</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}

              {activeView === 'history' && (
                <div className="grid-2" style={{ gap: '1rem' }}>
                  <div className="card">
                    <div className="card-header"><h3>Medicines</h3></div>
                    <div style={{ padding: '1rem' }}>
                      {patientMeds.length === 0 ? <p style={{ color: '#9ca3af', fontSize: '0.85rem' }}>None recorded.</p> :
                        patientMeds.map(m => (
                          <div key={m.id} style={{ padding: '0.5rem 0', borderBottom: '1px solid #f3f4f6', fontSize: '0.85rem' }}>
                            <strong>{m.name}</strong> {m.dosage} — {m.frequency}
                            <div style={{ color: '#6b7280', fontSize: '0.75rem' }}>{m.startDate}{m.endDate ? ` → ${m.endDate}` : ' → ongoing'}</div>
                          </div>
                        ))}
                    </div>
                  </div>
                  <div className="card">
                    <div className="card-header"><h3>Vaccinations</h3></div>
                    <div style={{ padding: '1rem' }}>
                      {patientVaccines.length === 0 ? <p style={{ color: '#9ca3af', fontSize: '0.85rem' }}>None recorded.</p> :
                        patientVaccines.map(v => (
                          <div key={v.id} style={{ padding: '0.5rem 0', borderBottom: '1px solid #f3f4f6', fontSize: '0.85rem' }}>
                            <strong>{v.name}</strong> {v.dose} <span className={`badge ${v.status === 'completed' ? 'badge-green' : v.status === 'overdue' ? 'badge-red' : 'badge-orange'}`}>{v.status}</span>
                            <div style={{ color: '#6b7280', fontSize: '0.75rem' }}>{v.date || '—'}{v.nextDose ? ` · next ${v.nextDose}` : ''}</div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              )}

              {activeView === 'trends' && <TrendsPanel key={selectedPatient.id} patientId={selectedPatient.id} editable={false} />}
            </>
          )}
        </div>
      </div>

      {viewRecord && (
        <div className="modal-overlay" onClick={() => setViewRecord(null)}>
          <div className="modal" role="dialog" aria-modal="true" style={{ maxWidth: 700 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{viewRecord.name}</h3>
              <button aria-label="Close" style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setViewRecord(null)}>
                <X size={20} color="#6b7280" />
              </button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '1rem' }}>
                {viewRecord.type} · {viewRecord.date} · {viewRecord.hospital || 'N/A'} · {viewRecord.doctor || 'N/A'}
              </p>
              {viewRecord.notes && <p style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>📝 {viewRecord.notes}</p>}
              {viewRecord.filePath && (
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                  <button className="btn btn-outline btn-sm" onClick={() => openFile(viewRecord, false)}><Eye size={13} /> Open file</button>
                  <button className="btn btn-outline btn-sm" onClick={() => openFile(viewRecord, true)}><Download size={13} /> Download</button>
                </div>
              )}
              {viewRecord.extractedText && (
                <details style={{ marginBottom: '1rem' }}>
                  <summary style={{ cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem' }}>Extracted text</summary>
                  <pre style={{ background: '#1f2937', color: '#f9fafb', padding: '1rem', borderRadius: 8, fontSize: '0.78rem', whiteSpace: 'pre-wrap', maxHeight: 240, overflowY: 'auto' }}>{viewRecord.extractedText}</pre>
                </details>
              )}
              {ai.loading ? (
                <p role="status"><Loader size={16} className="spin" /> Generating AI summary…</p>
              ) : ai.error ? (
                <div className="alert alert-danger" role="alert"><AlertCircle size={14} /> {ai.error}</div>
              ) : ai.analysis ? (
                <AIAnalysisView analysis={ai.analysis} />
              ) : viewRecord.extractedText ? (
                <button className="btn btn-primary btn-sm" onClick={runAI}><Brain size={14} /> Generate AI summary</button>
              ) : (
                <p style={{ fontSize: '0.8rem', color: '#9ca3af' }}>No extracted text or AI summary available for this record.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
