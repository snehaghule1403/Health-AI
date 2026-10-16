import { useMemo, useState } from 'react';
import { TrendingUp, AlertCircle, Plus, Trash2, Loader } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';
import { useApp } from '../context/AppContext';
import { apiPost } from '../lib/api';
import type { HealthMeasurement } from '../types';

// Reference bands are common adult guide values, shown only as visual guides.
export const METRICS = [
  { key: 'hemoglobin', label: 'Hemoglobin', unit: 'g/dL', color: '#2563eb' },
  { key: 'weight', label: 'Weight', unit: 'kg', color: '#7c3aed' },
  { key: 'bmi', label: 'BMI', unit: 'kg/m²', color: '#16a34a', normalMin: 18.5, normalMax: 24.9 },
  { key: 'systolic', label: 'Systolic BP', unit: 'mmHg', color: '#dc2626' },
  { key: 'diastolic', label: 'Diastolic BP', unit: 'mmHg', color: '#ea580c' },
  { key: 'glucose', label: 'Blood Glucose', unit: 'mg/dL', color: '#d97706' },
] as const;
type MetricKey = typeof METRICS[number]['key'];

const ENTRY_KINDS: { kind: HealthMeasurement['kind']; label: string; unit: string }[] = [
  { kind: 'glucose', label: 'Blood glucose', unit: 'mg/dL' },
  { kind: 'hemoglobin', label: 'Hemoglobin', unit: 'g/dL' },
  { kind: 'systolic', label: 'Systolic BP', unit: 'mmHg' },
  { kind: 'diastolic', label: 'Diastolic BP', unit: 'mmHg' },
  { kind: 'weight', label: 'Weight', unit: 'kg' },
];

export default function TrendsPanel({ patientId, editable }: { patientId: string; editable: boolean }) {
  const { trendsFor, measurements, addMeasurement, deleteMeasurement, users } = useApp();
  const [metric, setMetric] = useState<MetricKey>('hemoglobin');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [entry, setEntry] = useState({ kind: 'glucose' as HealthMeasurement['kind'], value: '', date: new Date().toISOString().split('T')[0] });
  const [entryError, setEntryError] = useState('');
  const [ai, setAi] = useState<{ loading: boolean; text?: string; error?: string }>({ loading: false });

  const m = METRICS.find(x => x.key === metric)!;
  const all = trendsFor(patientId);
  const data = useMemo(() => all.filter(e => (!from || e.date >= from) && (!to || e.date <= to) && e[metric] != null), [all, from, to, metric]);
  const first = data[0]?.[metric];
  const last = data[data.length - 1]?.[metric];
  const hasHeight = !!users.find(u => u.id === patientId)?.height;

  const own = measurements.filter(x => x.patientId === patientId).sort((a, b) => b.date.localeCompare(a.date));

  const submit = async () => {
    setEntryError('');
    const v = Number(entry.value);
    if (!entry.value || !Number.isFinite(v) || v <= 0 || v > 1000) return setEntryError('Enter a valid positive number.');
    if (!entry.date || entry.date > new Date().toISOString().split('T')[0]) return setEntryError('Enter a date that is not in the future.');
    const unit = ENTRY_KINDS.find(k => k.kind === entry.kind)!.unit;
    await addMeasurement({ kind: entry.kind, value: v, unit, date: entry.date });
    setEntry({ ...entry, value: '' });
  };

  const summarize = async () => {
    setAi({ loading: true });
    try {
      const { summary } = await apiPost<{ summary: string }>('/api/ai/trends', { patientId });
      setAi({ loading: false, text: summary });
    } catch (e) {
      setAi({ loading: false, error: (e as Error).message });
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }} role="tablist" aria-label="Metric">
        {METRICS.map(x => (
          <button key={x.key} role="tab" aria-selected={metric === x.key} onClick={() => setMetric(x.key)}
            className={`btn btn-sm ${metric === x.key ? 'btn-primary' : 'btn-outline'}`}>
            {x.label}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem', alignItems: 'center', fontSize: '0.85rem' }}>
        <label htmlFor="tr-from">From</label>
        <input id="tr-from" type="date" value={from} onChange={e => setFrom(e.target.value)} style={{ width: 'auto' }} />
        <label htmlFor="tr-to">To</label>
        <input id="tr-to" type="date" value={to} onChange={e => setTo(e.target.value)} style={{ width: 'auto' }} />
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header">
          <h3>{m.label} Trend</h3>
          {data.length >= 2 && first != null && last != null && (
            <span className="badge badge-gray">{first} → {last} {m.unit}</span>
          )}
        </div>
        <div style={{ padding: '1.5rem' }}>
          {data.length === 0 ? (
            <div className="empty-state" style={{ padding: '2rem 1rem' }}>
              <TrendingUp size={36} />
              <h3>No {m.label.toLowerCase()} data{from || to ? ' in this range' : ' yet'}</h3>
              <p>
                {metric === 'bmi' && !hasHeight ? 'BMI needs a height in the profile plus weight entries.' :
                  editable ? 'Add a measurement below or log weight in the Wellness tracker.' : 'The patient has not recorded this measurement.'}
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#9ca3af' }} />
                <YAxis domain={['auto', 'auto']} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                <Tooltip formatter={(v: number) => [`${v} ${m.unit}`, m.label]} contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: '0.85rem' }} />
                {'normalMin' in m && <ReferenceLine y={m.normalMin} stroke="#86efac" strokeDasharray="4 4" />}
                {'normalMax' in m && <ReferenceLine y={m.normalMax} stroke="#fca5a5" strokeDasharray="4 4" />}
                <Line type="monotone" dataKey={metric} stroke={m.color} strokeWidth={2.5} connectNulls
                  dot={{ fill: m.color, r: 5, strokeWidth: 2, stroke: 'white' }} activeDot={{ r: 7 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
          {metric === 'bmi' && data.length > 0 && (
            <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.5rem' }}>
              BMI = weight (kg) ÷ height (m)². It is a rough screening measure and does not assess overall health.
            </p>
          )}
          <div style={{ marginTop: '1rem', padding: '0.85rem 1rem', background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: 8, fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <strong style={{ color: '#5b21b6' }}><TrendingUp size={15} style={{ display: 'inline', verticalAlign: 'middle' }} aria-hidden /> AI trend summary</strong>
              <button className="btn btn-sm btn-outline" onClick={summarize} disabled={ai.loading || all.length === 0}>
                {ai.loading ? <><Loader size={13} className="spin" /> Summarizing…</> : 'Summarize all measurements'}
              </button>
            </div>
            {ai.error && <p role="alert" style={{ color: '#991b1b', marginTop: '0.5rem' }}><AlertCircle size={13} /> {ai.error}</p>}
            {ai.text && <p className="ai-text" style={{ marginTop: '0.5rem', color: '#374151' }}>{ai.text}</p>}
            {!ai.text && !ai.error && <p style={{ color: '#6b7280', marginTop: '0.35rem' }}>Describes patterns in recorded values only — not causes or diagnoses.</p>}
          </div>
        </div>
      </div>

      {editable && (
        <div className="card">
          <div className="card-header"><h3>Measurements</h3></div>
          <div style={{ padding: '1.25rem' }}>
            {entryError && <div className="alert alert-danger" role="alert" style={{ marginBottom: '0.75rem' }}>{entryError}</div>}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
              <label className="sr-only" htmlFor="m-kind">Measurement</label>
              <select id="m-kind" value={entry.kind} onChange={e => setEntry({ ...entry, kind: e.target.value as HealthMeasurement['kind'] })} style={{ width: 'auto' }}>
                {ENTRY_KINDS.map(k => <option key={k.kind} value={k.kind}>{k.label} ({k.unit})</option>)}
              </select>
              <label className="sr-only" htmlFor="m-val">Value</label>
              <input id="m-val" type="number" step="any" inputMode="decimal" placeholder="Value" value={entry.value}
                onChange={e => setEntry({ ...entry, value: e.target.value })} style={{ width: 120 }} />
              <label className="sr-only" htmlFor="m-date">Date</label>
              <input id="m-date" type="date" value={entry.date} onChange={e => setEntry({ ...entry, date: e.target.value })} style={{ width: 'auto' }} />
              <button className="btn btn-primary btn-sm" onClick={submit}><Plus size={14} /> Add</button>
            </div>
            {own.length === 0 ? <p style={{ fontSize: '0.85rem', color: '#9ca3af' }}>No measurements recorded yet.</p> : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', fontSize: '0.85rem', borderCollapse: 'collapse' }}>
                  <thead><tr style={{ textAlign: 'left', color: '#6b7280' }}><th>Date</th><th>Measurement</th><th>Value</th><th><span className="sr-only">Actions</span></th></tr></thead>
                  <tbody>
                    {own.slice(0, 50).map(x => (
                      <tr key={x.id} style={{ borderTop: '1px solid #f3f4f6' }}>
                        <td style={{ padding: '0.4rem 0' }}>{x.date}</td>
                        <td>{ENTRY_KINDS.find(k => k.kind === x.kind)?.label ?? x.label ?? x.kind}</td>
                        <td>{x.value} {x.unit}</td>
                        <td style={{ textAlign: 'right' }}>
                          <button className="btn btn-sm" style={{ background: 'none', color: '#dc2626', border: 'none' }}
                            aria-label={`Delete ${x.kind} on ${x.date}`} onClick={() => { if (confirm('Delete this measurement?')) deleteMeasurement(x.id); }}>
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {own.length > 50 && <p style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Showing latest 50 of {own.length}. All values appear in the charts.</p>}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
