import { useMemo, useState } from 'react';
import {
  FileText, Plus, Search, Eye, Brain, Scan, Trash2, Download,
  X, Upload, AlertCircle, ChevronDown, CheckCircle, Loader
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { HealthRecord } from '../../types';
import { apiPost } from '../../lib/api';
import { extractText } from '../../lib/ocr';
import { ALLOWED_MIME, MAX_FILE_BYTES } from '../../lib/supabase';
import AIAnalysisView from '../../components/AIAnalysisView';

const RECORD_TYPES = ['Blood Report', 'MRI', 'CT Scan', 'X-Ray', 'Prescription', 'Vaccination', 'Other'] as const;
const PAGE_SIZE = 12;
type SortKey = 'newest' | 'oldest' | 'name' | 'added';

const emptyForm = () => ({
  name: '', type: 'Blood Report' as typeof RECORD_TYPES[number],
  date: new Date().toISOString().split('T')[0],
  hospital: '', doctor: '', notes: ''
});

export default function HealthRecords() {
  const { currentUser, records, addRecord, updateRecord, deleteRecord, getFileUrl, downloadFile } = useApp();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [sort, setSort] = useState<SortKey>('newest');
  const [page, setPage] = useState(1);
  const [showUpload, setShowUpload] = useState(false);
  const [viewRecord, setViewRecord] = useState<HealthRecord | null>(null);
  const [ocrRecord, setOcrRecord] = useState<HealthRecord | null>(null);
  const [analyzeRec, setAnalyzeRec] = useState<HealthRecord | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<HealthRecord | null>(null);
  const [ocrProgress, setOcrProgress] = useState<string | null>(null);
  const [ocrError, setOcrError] = useState('');
  const [ocrMethod, setOcrMethod] = useState('');
  const [analyzeLoading, setAnalyzeLoading] = useState(false);
  const [analyzeError, setAnalyzeError] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [file, setFile] = useState<File | null>(null);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = records
      .filter(r => r.patientId === currentUser?.id)
      .filter(r => filterType === 'All' || r.type === filterType)
      .filter(r => !fromDate || r.date >= fromDate)
      .filter(r => !toDate || r.date <= toDate)
      .filter(r => !q || [r.name, r.hospital, r.doctor, r.notes].some(s => s?.toLowerCase().includes(q)));
    const cmp: Record<SortKey, (a: HealthRecord, b: HealthRecord) => number> = {
      newest: (a, b) => b.date.localeCompare(a.date),
      oldest: (a, b) => a.date.localeCompare(b.date),
      name: (a, b) => a.name.localeCompare(b.name),
      added: (a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''),
    };
    return list.sort(cmp[sort]);
  }, [records, currentUser, filterType, fromDate, toDate, search, sort]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const pickFile = (f: File | null) => {
    setFormError('');
    if (!f) return setFile(null);
    if (!ALLOWED_MIME.includes(f.type)) { setFile(null); return setFormError('Only PDF, PNG and JPEG files are supported.'); }
    if (f.size > MAX_FILE_BYTES) { setFile(null); return setFormError('File must be 10 MB or smaller.'); }
    setFile(f);
    if (!form.name) setForm(prev => ({ ...prev, name: f.name.replace(/\.[^.]+$/, '') }));
  };

  const handleUpload = async () => {
    setFormError('');
    if (!form.name.trim()) return setFormError('Report name is required.');
    if (!form.date) return setFormError('Date is required.');
    if (form.date > new Date().toISOString().split('T')[0]) return setFormError('Date cannot be in the future.');
    setSaving(true);
    const saved = await addRecord({ id: '', patientId: currentUser!.id, ...form, name: form.name.trim() }, file);
    setSaving(false);
    if (!saved) return setFormError('The record could not be saved. See the error at the top of the page.');
    setShowUpload(false);
    setForm(emptyForm());
    setFile(null);
  };

  const handleOCR = async (record: HealthRecord) => {
    setOcrRecord(record);
    setOcrError('');
    setOcrMethod('');
    if (record.extractedText) return; // already extracted; user can review/edit
    if (!record.filePath || !record.fileMime) {
      setOcrError('This record has no attached file. You can paste the report text below instead.');
      return;
    }
    setOcrProgress('Downloading file');
    try {
      const blob = await downloadFile(record);
      if (!blob) throw new Error('Could not download the file for OCR.');
      const { text, method, confidence } = await extractText(blob, record.fileMime, (msg, f) =>
        setOcrProgress(f !== undefined ? `${msg} (${Math.round(f * 100)}%)` : msg));
      setOcrMethod(confidence !== undefined ? `${method}, confidence ${Math.round(confidence)}%` : method);
      setOcrRecord({ ...record, extractedText: text });
    } catch (e) {
      setOcrError(`${(e as Error).message} You can type or paste the report text below instead.`);
      await updateRecord({ ...record, ocrStatus: 'failed' });
    } finally {
      setOcrProgress(null);
    }
  };

  const saveOcr = async (thenAnalyze: boolean) => {
    if (!ocrRecord) return;
    const text = ocrRecord.extractedText?.trim();
    if (!text) return setOcrError('There is no text to save.');
    const saved = await updateRecord({ ...ocrRecord, extractedText: text, ocrStatus: 'done', aiAnalysis: undefined });
    if (!saved) return;
    setOcrRecord(null);
    if (thenAnalyze) handleAnalyze(saved, true);
  };

  const handleAnalyze = async (record: HealthRecord, force = false) => {
    setAnalyzeRec(record);
    setAnalyzeError('');
    if (record.aiAnalysis && !force) return;
    if (!record.extractedText?.trim()) {
      setAnalyzeError('This record has no extracted text yet. Run OCR Extract first.');
      return;
    }
    setAnalyzeLoading(true);
    try {
      const { analysis } = await apiPost<{ analysis: HealthRecord['aiAnalysis'] }>('/api/ai/summarize', { recordId: record.id });
      setAnalyzeRec({ ...record, aiAnalysis: analysis });
      // The API saved it; mirror locally without another write.
      await updateRecord({ ...record, aiAnalysis: analysis });
    } catch (e) {
      setAnalyzeError((e as Error).message);
    } finally {
      setAnalyzeLoading(false);
    }
  };

  const openFile = async (record: HealthRecord, download: boolean) => {
    setBusyId(record.id);
    const url = await getFileUrl(record, download);
    setBusyId(null);
    if (url) window.open(url, '_blank', 'noopener');
  };

  const doDelete = async () => {
    if (!confirmDelete) return;
    setBusyId(confirmDelete.id);
    await deleteRecord(confirmDelete.id);
    setBusyId(null);
    setConfirmDelete(null);
  };

  const badgeClass = (type: string) => {
    if (type === 'Blood Report') return 'badge-blue';
    if (type === 'MRI' || type === 'CT Scan' || type === 'X-Ray') return 'badge-orange';
    if (type === 'Prescription') return 'badge-green';
    return 'badge-gray';
  };

  const resetPage = <T,>(fn: (v: T) => void) => (v: T) => { fn(v); setPage(1); };

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
          <Search size={16} aria-hidden style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
          <label htmlFor="rec-search" className="sr-only">Search records</label>
          <input
            id="rec-search"
            placeholder="Search title, hospital, doctor, notes..."
            value={search}
            onChange={e => resetPage(setSearch)(e.target.value)}
            style={{ paddingLeft: '2.25rem' }}
          />
        </div>
        <div style={{ position: 'relative' }}>
          <label htmlFor="rec-type" className="sr-only">Filter by type</label>
          <select id="rec-type" value={filterType} onChange={e => resetPage(setFilterType)(e.target.value)} style={{ paddingRight: '2rem', minWidth: 140 }}>
            <option value="All">All Types</option>
            {RECORD_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
          <ChevronDown size={14} aria-hidden style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#6b7280' }} />
        </div>
        <label className="sr-only" htmlFor="rec-from">From date</label>
        <input id="rec-from" type="date" value={fromDate} onChange={e => resetPage(setFromDate)(e.target.value)} style={{ width: 'auto' }} title="From date" />
        <label className="sr-only" htmlFor="rec-to">To date</label>
        <input id="rec-to" type="date" value={toDate} onChange={e => resetPage(setToDate)(e.target.value)} style={{ width: 'auto' }} title="To date" />
        <label className="sr-only" htmlFor="rec-sort">Sort</label>
        <select id="rec-sort" value={sort} onChange={e => setSort(e.target.value as SortKey)} style={{ width: 'auto' }}>
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="name">Name A–Z</option>
          <option value="added">Recently added</option>
        </select>
      </div>

      <p style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '0.75rem' }} aria-live="polite">
        {filtered.length} record{filtered.length === 1 ? '' : 's'}
      </p>

      {/* Records Grid */}
      {filtered.length === 0 ? (
        <div className="empty-state">
          <FileText size={48} />
          <h3>No records found</h3>
          <p>{records.some(r => r.patientId === currentUser?.id) ? 'Try changing your filters.' : 'Upload your first medical report to get started'}</p>
          <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => setShowUpload(true)}>
            <Plus size={16} /> Upload Record
          </button>
        </div>
      ) : (
        <>
          <div className="grid-2" style={{ gap: '1rem' }}>
            {pageItems.map(record => (
              <div key={record.id} className="card" style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                    <div style={{ width: 42, height: 42, borderRadius: 10, background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <FileText size={20} color="#2563eb" />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#1f2937', overflowWrap: 'anywhere' }}>{record.name}</h3>
                      <span className={`badge ${badgeClass(record.type)}`} style={{ marginTop: '0.2rem' }}>{record.type}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end', flexShrink: 0 }}>
                    {record.ocrStatus === 'done' && <span className="badge badge-blue">OCR ✓</span>}
                    {record.ocrStatus === 'failed' && <span className="badge badge-red">OCR failed</span>}
                    {record.aiAnalysis && <span className="badge badge-green"><CheckCircle size={10} /> AI Done</span>}
                  </div>
                </div>

                <div style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '1rem', lineHeight: 1.6 }}>
                  <div>📅 {record.date}</div>
                  <div>🏥 {record.hospital || 'Not specified'}</div>
                  {record.doctor && <div>👨‍⚕️ {record.doctor}</div>}
                  {record.fileName && <div>📎 {record.fileName}</div>}
                  {record.notes && <div style={{ marginTop: '0.25rem', color: '#9ca3af' }}>📝 {record.notes}</div>}
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button className="btn btn-outline btn-sm" onClick={() => setViewRecord(record)}>
                    <Eye size={13} /> View
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={() => handleOCR(record)}>
                    <Scan size={13} /> OCR Extract
                  </button>
                  <button className="btn btn-sm" style={{ background: '#ede9fe', color: '#7c3aed', border: 'none' }} onClick={() => handleAnalyze(record)}>
                    <Brain size={13} /> AI Analyze
                  </button>
                  <button
                    className="btn btn-sm"
                    style={{ background: '#fee2e2', color: '#dc2626', border: 'none', marginLeft: 'auto' }}
                    onClick={() => setConfirmDelete(record)}
                    aria-label={`Delete ${record.name}`}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          {pageCount > 1 && (
            <nav className="pager" aria-label="Records pages">
              <button className="btn btn-outline btn-sm" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>Previous</button>
              <span>Page {currentPage} of {pageCount}</span>
              <button className="btn btn-outline btn-sm" disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)}>Next</button>
            </nav>
          )}
        </>
      )}

      {/* ─── UPLOAD MODAL ─── */}
      {showUpload && (
        <div className="modal-overlay" onClick={() => !saving && setShowUpload(false)}>
          <div className="modal" role="dialog" aria-modal="true" aria-labelledby="upload-title" style={{ maxWidth: 540 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 id="upload-title"><Upload size={18} style={{ marginRight: 8 }} />Upload New Record</h3>
              <button aria-label="Close" style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setShowUpload(false)}>
                <X size={20} color="#6b7280" />
              </button>
            </div>
            <div className="modal-body">
              {formError && <div className="alert alert-danger" role="alert" style={{ marginBottom: '1rem' }}>{formError}</div>}
              <div className="form-group">
                <label className="form-label" htmlFor="f-name">Report Name *</label>
                <input id="f-name" value={form.name} maxLength={200} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g., CBC Blood Report" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="f-type">Report Type *</label>
                  <select id="f-type" value={form.type} onChange={e => setForm({ ...form, type: e.target.value as typeof RECORD_TYPES[number] })}>
                    {RECORD_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="f-date">Date *</label>
                  <input id="f-date" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="f-hosp">Hospital / Lab</label>
                  <input id="f-hosp" value={form.hospital} onChange={e => setForm({ ...form, hospital: e.target.value })} placeholder="Hospital name" />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="f-doc">Doctor</label>
                  <input id="f-doc" value={form.doctor} onChange={e => setForm({ ...form, doctor: e.target.value })} placeholder="Doctor name" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="f-notes">Notes</label>
                <textarea id="f-notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Any additional notes..." rows={2} style={{ resize: 'vertical' }} />
              </div>
              <label
                htmlFor="f-file"
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); pickFile(e.dataTransfer.files[0] ?? null); }}
                style={{
                  display: 'block', border: '2px dashed #d1d5db', borderRadius: 10, padding: '1.5rem',
                  textAlign: 'center', color: '#9ca3af', background: '#f9fafb', cursor: 'pointer'
                }}
              >
                <Upload size={28} style={{ margin: '0 auto 0.5rem' }} aria-hidden />
                <p style={{ fontWeight: 500, color: '#6b7280' }}>{file ? file.name : 'Click to upload or drag & drop'}</p>
                <p style={{ fontSize: '0.75rem' }}>{file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'PDF, JPG, PNG — up to 10 MB. Stored privately.'}</p>
                <input id="f-file" type="file" accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
                  className="sr-only" onChange={e => pickFile(e.target.files?.[0] ?? null)} />
              </label>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowUpload(false)} disabled={saving}>Cancel</button>
              <button className="btn btn-primary" onClick={handleUpload} disabled={!form.name || saving}>
                {saving ? <><Loader size={16} className="spin" /> Saving…</> : <><Plus size={16} /> Add Record</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── VIEW MODAL ─── */}
      {viewRecord && (
        <div className="modal-overlay" onClick={() => setViewRecord(null)}>
          <div className="modal" role="dialog" aria-modal="true" style={{ maxWidth: 620 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{viewRecord.name}</h3>
              <button aria-label="Close" style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setViewRecord(null)}>
                <X size={20} color="#6b7280" />
              </button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
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
              {viewRecord.filePath ? (
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                  <button className="btn btn-outline btn-sm" disabled={busyId === viewRecord.id} onClick={() => openFile(viewRecord, false)}>
                    <Eye size={13} /> Open file
                  </button>
                  <button className="btn btn-outline btn-sm" disabled={busyId === viewRecord.id} onClick={() => openFile(viewRecord, true)}>
                    <Download size={13} /> Download
                  </button>
                  <span style={{ fontSize: '0.75rem', color: '#9ca3af', alignSelf: 'center' }}>Links expire after 5 minutes.</span>
                </div>
              ) : (
                <p style={{ fontSize: '0.8rem', color: '#9ca3af', marginBottom: '1rem' }}>No file attached to this record.</p>
              )}
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
        <div className="modal-overlay" onClick={() => !ocrProgress && setOcrRecord(null)}>
          <div className="modal" role="dialog" aria-modal="true" style={{ maxWidth: 660 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3><Scan size={18} style={{ marginRight: 8 }} />OCR Text Extraction — {ocrRecord.name}</h3>
              <button aria-label="Close" disabled={!!ocrProgress} style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setOcrRecord(null)}>
                <X size={20} color="#6b7280" />
              </button>
            </div>
            <div className="modal-body">
              {ocrProgress ? (
                <div style={{ textAlign: 'center', padding: '2rem' }} role="status">
                  <Loader size={32} color="#2563eb" className="spin" style={{ margin: '0 auto 1rem' }} />
                  <p style={{ color: '#6b7280' }}>{ocrProgress}…</p>
                  <p style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '0.5rem' }}>
                    Processing happens in your browser. Large scans can take a minute.
                  </p>
                </div>
              ) : (
                <>
                  {ocrError ? (
                    <div className="alert alert-danger" role="alert" style={{ marginBottom: '1rem' }}>
                      <AlertCircle size={16} /> {ocrError}
                    </div>
                  ) : ocrRecord.extractedText ? (
                    <div className="alert alert-info" style={{ marginBottom: '1rem' }}>
                      {ocrMethod ? `Extracted with ${ocrMethod}. ` : ''}Review and correct the text before saving — OCR can misread values.
                    </div>
                  ) : null}
                  <label className="form-label" htmlFor="ocr-text">Extracted Text</label>
                  <textarea
                    id="ocr-text"
                    value={ocrRecord.extractedText || ''}
                    onChange={e => setOcrRecord({ ...ocrRecord, extractedText: e.target.value })}
                    rows={12}
                    style={{ fontFamily: 'monospace', fontSize: '0.82rem', lineHeight: 1.6, resize: 'vertical' }}
                  />
                </>
              )}
            </div>
            {!ocrProgress && (
              <div className="modal-footer">
                <button className="btn btn-outline" onClick={() => setOcrRecord(null)}>Close</button>
                <button className="btn btn-secondary" disabled={!ocrRecord.extractedText?.trim()} onClick={() => saveOcr(false)}>Save text</button>
                <button className="btn btn-primary" disabled={!ocrRecord.extractedText?.trim()} onClick={() => saveOcr(true)}>
                  <Brain size={14} /> Save &amp; Analyze with AI
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── AI ANALYSIS MODAL ─── */}
      {analyzeRec && (
        <div className="modal-overlay" onClick={() => !analyzeLoading && setAnalyzeRec(null)}>
          <div className="modal" role="dialog" aria-modal="true" style={{ maxWidth: 700 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3><Brain size={18} style={{ marginRight: 8 }} />AI Analysis — {analyzeRec.name}</h3>
              <button aria-label="Close" style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setAnalyzeRec(null)}>
                <X size={20} color="#6b7280" />
              </button>
            </div>
            <div className="modal-body">
              {analyzeLoading ? (
                <div style={{ textAlign: 'center', padding: '2rem' }} role="status">
                  <Loader size={32} color="#7c3aed" className="spin" style={{ margin: '0 auto 1rem' }} />
                  <p style={{ color: '#6b7280' }}>Analyzing your report with AI...</p>
                </div>
              ) : analyzeError ? (
                <div className="alert alert-danger" role="alert"><AlertCircle size={16} /> {analyzeError}</div>
              ) : analyzeRec.aiAnalysis ? (
                <AIAnalysisView analysis={analyzeRec.aiAnalysis} />
              ) : null}
            </div>
            {!analyzeLoading && (
              <div className="modal-footer">
                {analyzeRec.aiAnalysis && !analyzeError && (
                  <button className="btn btn-outline" onClick={() => handleAnalyze(analyzeRec, true)}>Re-analyze</button>
                )}
                <button className="btn btn-outline" onClick={() => setAnalyzeRec(null)}>Close</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── DELETE CONFIRM ─── */}
      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal" role="alertdialog" aria-modal="true" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>Delete record?</h3></div>
            <div className="modal-body">
              <p>“{confirmDelete.name}”{confirmDelete.filePath ? ' and its attached file' : ''} will be permanently deleted. This cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button className="btn" style={{ background: '#dc2626', color: 'white' }} disabled={busyId === confirmDelete.id} onClick={doDelete}>
                {busyId === confirmDelete.id ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
