import { useState } from 'react';
import {
  FileText, Plus, Search, Eye, Brain, Scan, Share2, Trash2,
  X, Upload, AlertCircle, ChevronDown, CheckCircle, Loader
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { HealthRecord } from '../../types';
import { analyzeReport } from '../../utils/aiUtils';

const RECORD_TYPES = ['Blood Report', 'MRI', 'CT Scan', 'X-Ray', 'Prescription', 'Vaccination', 'Other'] as const;

export default function HealthRecords() {
  const { currentUser, records, addRecord, updateRecord, deleteRecord } = useApp();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [showUpload, setShowUpload] = useState(false);
  const [viewRecord, setViewRecord] = useState<HealthRecord | null>(null);
  const [ocrRecord, setOcrRecord] = useState<HealthRecord | null>(null);
  const [analyzeRec, setAnalyzeRec] = useState<HealthRecord | null>(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [analyzeLoading, setAnalyzeLoading] = useState(false);

  const patientRecords = records
    .filter(r => r.patientId === currentUser?.id)
    .filter(r => filterType === 'All' || r.type === filterType)
    .filter(r =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.hospital.toLowerCase().includes(search.toLowerCase())
    );

  const [form, setForm] = useState({
    name: '', type: 'Blood Report' as typeof RECORD_TYPES[number],
    date: new Date().toISOString().split('T')[0],
    hospital: '', doctor: '', notes: ''
  });

  const handleUpload = () => {
    if (!form.name || !form.date) return;
    const newRecord: HealthRecord = {
      id: `rec-${Date.now()}`,
      patientId: currentUser!.id,
      ...form,
    };
    addRecord(newRecord);
    setShowUpload(false);
    setForm({ name: '', type: 'Blood Report', date: new Date().toISOString().split('T')[0], hospital: '', doctor: '', notes: '' });
  };

  const handleOCR = (record: HealthRecord) => {
    setOcrRecord(record);
    if (!record.extractedText) {
      setOcrLoading(true);
      setTimeout(() => {
        const fallback = `[OCR EXTRACTED TEXT — DEMO FALLBACK]
Report: ${record.name}
Date: ${record.date}
Hospital: ${record.hospital}

Hemoglobin: 12.4 g/dL
WBC Count: 7200 cells/mcL
Platelets: 2.4 lakh/mcL
MCH: 26 pg

Note: This is a simulated OCR extraction for demonstration purposes.`;
        updateRecord({ ...record, extractedText: fallback });
        setOcrRecord({ ...record, extractedText: fallback });
        setOcrLoading(false);
      }, 2000);
    }
  };

  const handleAnalyze = (record: HealthRecord) => {
    setAnalyzeRec(record);
    if (!record.aiAnalysis) {
      setAnalyzeLoading(true);
      setTimeout(() => {
        const analysis = analyzeReport(record);
        const updated = { ...record, aiAnalysis: analysis };
        updateRecord(updated);
        setAnalyzeRec(updated);
        setAnalyzeLoading(false);
      }, 1500);
    }
  };

  const badgeClass = (type: string) => {
    if (type === 'Blood Report') return 'badge-blue';
    if (type === 'MRI' || type === 'CT Scan' || type === 'X-Ray') return 'badge-orange';
    if (type === 'Prescription') return 'badge-green';
    return 'badge-gray';
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1>Health Records</h1>
          <p>Manage and analyze your medical documents</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowUpload(true)}>
          <Plus size={16} /> Upload Record
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
          <input
            placeholder="Search records..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: '2.25rem' }}
          />
        </div>
        <div style={{ position: 'relative' }}>
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            style={{ paddingRight: '2rem', minWidth: 140 }}
          >
            <option value="All">All Types</option>
            {RECORD_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
          <ChevronDown size={14} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#6b7280' }} />
        </div>
      </div>

      {/* Records Grid */}
      {patientRecords.length === 0 ? (
        <div className="empty-state">
          <FileText size={48} />
          <h3>No records found</h3>
          <p>Upload your first medical report to get started</p>
          <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => setShowUpload(true)}>
            <Plus size={16} /> Upload Record
          </button>
        </div>
      ) : (
        <div className="grid-2" style={{ gap: '1rem' }}>
          {patientRecords.map(record => (
            <div key={record.id} className="card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: 42, height: 42, borderRadius: 10, background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FileText size={20} color="#2563eb" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#1f2937' }}>{record.name}</h3>
                    <span className={`badge ${badgeClass(record.type)}`} style={{ marginTop: '0.2rem' }}>{record.type}</span>
                  </div>
                </div>
                {record.aiAnalysis && (
                  <span className="badge badge-green" style={{ flexShrink: 0 }}>
                    <CheckCircle size={10} /> AI Done
                  </span>
                )}
              </div>

              <div style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '1rem', lineHeight: 1.6 }}>
                <div>📅 {record.date}</div>
                <div>🏥 {record.hospital || 'Not specified'}</div>
                {record.doctor && <div>👨‍⚕️ {record.doctor}</div>}
                {record.notes && <div style={{ marginTop: '0.25rem', color: '#9ca3af' }}>📝 {record.notes}</div>}
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button className="btn btn-outline btn-sm" onClick={() => setViewRecord(record)}>
                  <Eye size={13} /> View
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => handleOCR(record)}>
                  <Scan size={13} /> OCR Extract
                </button>
                <button
                  className="btn btn-sm"
                  style={{ background: '#ede9fe', color: '#7c3aed', border: 'none' }}
                  onClick={() => handleAnalyze(record)}
                >
                  <Brain size={13} /> AI Analyze
                </button>
                <button
                  className="btn btn-sm"
                  style={{ background: '#fee2e2', color: '#dc2626', border: 'none', marginLeft: 'auto' }}
                  onClick={() => deleteRecord(record.id)}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── UPLOAD MODAL ─── */}
      {showUpload && (
        <div className="modal-overlay" onClick={() => setShowUpload(false)}>
          <div className="modal" style={{ maxWidth: 540 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3><Upload size={18} style={{ marginRight: 8 }} />Upload New Record</h3>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setShowUpload(false)}>
                <X size={20} color="#6b7280" />
              </button>
            </div>
            <div className="modal-body">
              <div className="demo-badge" style={{ marginBottom: '1rem' }}>
                Demo Mode — File upload simulated
              </div>
              <div className="form-group">
                <label className="form-label">Report Name *</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g., CBC Blood Report" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Report Type *</label>
                  <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as typeof RECORD_TYPES[number] })}>
                    {RECORD_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Date *</label>
                  <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Hospital / Lab</label>
                  <input value={form.hospital} onChange={e => setForm({ ...form, hospital: e.target.value })} placeholder="Hospital name" />
                </div>
                <div className="form-group">
                  <label className="form-label">Doctor</label>
                  <input value={form.doctor} onChange={e => setForm({ ...form, doctor: e.target.value })} placeholder="Doctor name" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Any additional notes..." rows={2} style={{ resize: 'vertical' }} />
              </div>
              <div style={{
                border: '2px dashed #d1d5db', borderRadius: 10, padding: '1.5rem',
                textAlign: 'center', color: '#9ca3af', background: '#f9fafb', cursor: 'pointer'
              }}>
                <Upload size={28} style={{ margin: '0 auto 0.5rem' }} />
                <p style={{ fontWeight: 500, color: '#6b7280' }}>Click to upload or drag & drop</p>
                <p style={{ fontSize: '0.75rem' }}>PDF, JPG, PNG supported (Demo mode — not actually saved)</p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowUpload(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleUpload} disabled={!form.name}>
                <Plus size={16} /> Add Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── VIEW MODAL ─── */}
      {viewRecord && (
        <div className="modal-overlay" onClick={() => setViewRecord(null)}>
          <div className="modal" style={{ maxWidth: 620 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{viewRecord.name}</h3>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setViewRecord(null)}>
                <X size={20} color="#6b7280" />
              </button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
                {[
                  { label: 'Type', value: viewRecord.type },
                  { label: 'Date', value: viewRecord.date },
                  { label: 'Hospital', value: viewRecord.hospital || 'N/A' },
                  { label: 'Doctor', value: viewRecord.doctor || 'N/A' },
                ].map(({ label, value }) => (
                  <div key={label} style={{ background: '#f9fafb', borderRadius: 8, padding: '0.75rem' }}>
                    <div style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 600, marginBottom: '0.2rem' }}>{label}</div>
                    <div style={{ fontSize: '0.875rem', color: '#1f2937', fontWeight: 500 }}>{value}</div>
                  </div>
                ))}
              </div>
              {viewRecord.notes && (
                <div style={{ background: '#f9fafb', borderRadius: 8, padding: '0.75rem', marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 600, marginBottom: '0.2rem' }}>Notes</div>
                  <p style={{ fontSize: '0.875rem', color: '#374151' }}>{viewRecord.notes}</p>
                </div>
              )}
              {viewRecord.extractedText && (
                <div>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>Extracted Text (OCR)</h4>
                  <pre style={{
                    background: '#1f2937', color: '#f9fafb', padding: '1rem',
                    borderRadius: 8, fontSize: '0.78rem', whiteSpace: 'pre-wrap',
                    fontFamily: 'monospace', lineHeight: 1.6, maxHeight: 280, overflowY: 'auto'
                  }}>{viewRecord.extractedText}</pre>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => { setViewRecord(null); handleOCR(viewRecord); }}>
                <Scan size={14} /> OCR Extract
              </button>
              <button className="btn btn-primary" onClick={() => { setViewRecord(null); handleAnalyze(viewRecord); }}>
                <Brain size={14} /> AI Analyze
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── OCR MODAL ─── */}
      {ocrRecord && (
        <div className="modal-overlay" onClick={() => setOcrRecord(null)}>
          <div className="modal" style={{ maxWidth: 660 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3><Scan size={18} style={{ marginRight: 8 }} />OCR Text Extraction — {ocrRecord.name}</h3>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setOcrRecord(null)}>
                <X size={20} color="#6b7280" />
              </button>
            </div>
            <div className="modal-body">
              {ocrLoading ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <Loader size={32} color="#2563eb" className="spin" style={{ margin: '0 auto 1rem' }} />
                  <p style={{ color: '#6b7280' }}>Extracting text from document...</p>
                  <p style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '0.5rem' }}>
                    Using Tesseract.js OCR engine (demo fallback)
                  </p>
                </div>
              ) : (
                <>
                  <div className="alert alert-success" style={{ marginBottom: '1rem' }}>
                    <CheckCircle size={16} /> Text extracted successfully! You can edit before sending to AI.
                  </div>
                  <label className="form-label">Extracted Text</label>
                  <textarea
                    value={ocrRecord.extractedText || ''}
                    onChange={e => setOcrRecord({ ...ocrRecord, extractedText: e.target.value })}
                    rows={12}
                    style={{ fontFamily: 'monospace', fontSize: '0.82rem', lineHeight: 1.6, resize: 'vertical' }}
                  />
                </>
              )}
            </div>
            {!ocrLoading && (
              <div className="modal-footer">
                <button className="btn btn-outline" onClick={() => setOcrRecord(null)}>Close</button>
                <button className="btn btn-primary" onClick={() => {
                  if (ocrRecord) {
                    updateRecord(ocrRecord);
                    setOcrRecord(null);
                    handleAnalyze(ocrRecord);
                  }
                }}>
                  <Brain size={14} /> Analyze with AI
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── AI ANALYSIS MODAL ─── */}
      {analyzeRec && (
        <div className="modal-overlay" onClick={() => setAnalyzeRec(null)}>
          <div className="modal" style={{ maxWidth: 700 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3><Brain size={18} style={{ marginRight: 8 }} />AI Analysis — {analyzeRec.name}</h3>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setAnalyzeRec(null)}>
                <X size={20} color="#6b7280" />
              </button>
            </div>
            <div className="modal-body">
              {analyzeLoading ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <Loader size={32} color="#7c3aed" className="spin" style={{ margin: '0 auto 1rem' }} />
                  <p style={{ color: '#6b7280' }}>Analyzing your report with AI...</p>
                </div>
              ) : analyzeRec.aiAnalysis ? (
                <AIAnalysisView analysis={analyzeRec.aiAnalysis} />
              ) : null}
            </div>
            {!analyzeLoading && (
              <div className="modal-footer">
                <button className="btn btn-outline" onClick={() => setAnalyzeRec(null)}>Close</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function AIAnalysisView({ analysis }: { analysis: NonNullable<HealthRecord['aiAnalysis']> }) {
  const statusColor = (s: string) => {
    if (s === 'normal') return { bg: '#dcfce7', color: '#166534' };
    if (s === 'low') return { bg: '#dbeafe', color: '#1e40af' };
    if (s === 'high') return { bg: '#fee2e2', color: '#991b1b' };
    return { bg: '#f3f4f6', color: '#374151' };
  };

  return (
    <div>
      <div className="disclaimer" style={{ marginBottom: '1.25rem' }}>
        <AlertCircle size={14} />
        {analysis.disclaimer}
      </div>

      <section style={{ marginBottom: '1.25rem' }}>
        <h4 style={{ fontWeight: 600, color: '#1f2937', marginBottom: '0.5rem' }}>📋 Report Summary</h4>
        <p style={{ fontSize: '0.9rem', color: '#374151', lineHeight: 1.6 }}>{analysis.summary}</p>
      </section>

      <section style={{ marginBottom: '1.25rem' }}>
        <h4 style={{ fontWeight: 600, color: '#1f2937', marginBottom: '0.75rem' }}>📊 Key Values</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.6rem' }}>
          {analysis.importantValues.map((v, i) => {
            const c = statusColor(v.status);
            return (
              <div key={i} style={{ background: c.bg, borderRadius: 8, padding: '0.75rem', textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: c.color, fontWeight: 600, marginBottom: '0.2rem' }}>{v.name}</div>
                <div style={{ fontWeight: 700, color: c.color, fontSize: '1rem' }}>{v.value}</div>
                <div style={{ fontSize: '0.7rem', color: c.color, textTransform: 'capitalize', marginTop: '0.2rem' }}>{v.status}</div>
              </div>
            );
          })}
        </div>
      </section>

      <section style={{ marginBottom: '1.25rem' }}>
        <h4 style={{ fontWeight: 600, color: '#1f2937', marginBottom: '0.5rem' }}>🔍 Key Findings</h4>
        {analysis.keyFindings.map((f, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.4rem', fontSize: '0.875rem', color: '#374151' }}>
            <CheckCircle size={14} color="#16a34a" style={{ marginTop: 3, flexShrink: 0 }} />
            {f}
          </div>
        ))}
      </section>

      <section style={{ marginBottom: '1.25rem' }}>
        <h4 style={{ fontWeight: 600, color: '#1f2937', marginBottom: '0.5rem' }}>💬 Simple Explanation</h4>
        <div style={{ background: '#f9fafb', borderRadius: 8, padding: '0.85rem', fontSize: '0.875rem', color: '#374151', lineHeight: 1.6 }}>
          {analysis.simpleExplanation}
        </div>
      </section>

      <section>
        <h4 style={{ fontWeight: 600, color: '#1f2937', marginBottom: '0.5rem' }}>🩺 Questions to Ask Your Doctor</h4>
        {analysis.questionsForDoctor.map((q, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.4rem', fontSize: '0.875rem', color: '#374151' }}>
            <span style={{ color: '#2563eb', fontWeight: 700, flexShrink: 0 }}>Q{i + 1}.</span>
            {q}
          </div>
        ))}
      </section>
    </div>
  );
}
