import { useState } from 'react';
import { TrendingUp, AlertCircle } from 'lucide-react';
import { DEMO_TRENDS } from '../../data/demoData';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine
} from 'recharts';

const METRICS = [
  { key: 'hemoglobin', label: 'Hemoglobin', unit: 'g/dL', color: '#2563eb', domain: [10, 14], normalMin: 12, normalMax: 16 },
  { key: 'weight', label: 'Weight', unit: 'kg', color: '#7c3aed', domain: [52, 60] },
  { key: 'bmi', label: 'BMI', unit: '', color: '#16a34a', domain: [19, 24], normalMin: 18.5, normalMax: 24.9 },
  { key: 'systolic', label: 'Systolic BP', unit: 'mmHg', color: '#dc2626', domain: [105, 125], normalMin: 90, normalMax: 120 },
  { key: 'diastolic', label: 'Diastolic BP', unit: 'mmHg', color: '#ea580c', domain: [65, 85] },
  { key: 'glucose', label: 'Blood Glucose', unit: 'mg/dL', color: '#d97706', domain: [80, 100], normalMin: 70, normalMax: 99 },
] as const;

export default function HealthTrends() {
  const [selectedMetric, setSelectedMetric] = useState<typeof METRICS[number]>(METRICS[0]);

  const data = DEMO_TRENDS;
  const first = data[0];
  const last = data[data.length - 1];
  const firstVal = first[selectedMetric.key as keyof typeof first] as number;
  const lastVal = last[selectedMetric.key as keyof typeof last] as number;
  const change = lastVal - firstVal;
  const pct = ((change / firstVal) * 100).toFixed(1);

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Health Trends</h1>
          <p>Track how your health metrics change over time</p>
        </div>
        <span className="demo-badge">DEMO DATA — May–Oct 2026</span>
      </div>

      <div className="disclaimer" style={{ marginBottom: '1.5rem' }}>
        <AlertCircle size={16} style={{ flexShrink: 0 }} />
        Charts show demo data for illustration purposes. Values may not reflect real health measurements.
      </div>

      {/* Metric selector */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        {METRICS.map(m => (
          <button
            key={m.key}
            onClick={() => setSelectedMetric(m)}
            className={`btn btn-sm ${selectedMetric.key === m.key ? 'btn-primary' : 'btn-outline'}`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Main chart */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header">
          <h3>{selectedMetric.label} Trend</h3>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <span className={`badge ${change >= 0 ? 'badge-green' : 'badge-orange'}`}>
              {change >= 0 ? '↑' : '↓'} {Math.abs(parseFloat(pct))}%
            </span>
          </div>
        </div>
        <div style={{ padding: '1.5rem' }}>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#9ca3af' }} />
              <YAxis
                domain={[...selectedMetric.domain] as [number, number]}
                tick={{ fontSize: 12, fill: '#9ca3af' }}
                unit={selectedMetric.unit ? ` ${selectedMetric.unit}` : ''}
              />
              <Tooltip
                formatter={(v: number) => [`${v}${selectedMetric.unit ? ' ' + selectedMetric.unit : ''}`, selectedMetric.label]}
                contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: '0.85rem' }}
              />
              {'normalMin' in selectedMetric && (
                <ReferenceLine y={(selectedMetric as { normalMin: number }).normalMin} stroke="#86efac" strokeDasharray="4 4" label={{ value: 'Min Normal', fill: '#16a34a', fontSize: 11 }} />
              )}
              {'normalMax' in selectedMetric && (
                <ReferenceLine y={(selectedMetric as { normalMax: number }).normalMax} stroke="#fca5a5" strokeDasharray="4 4" label={{ value: 'Max Normal', fill: '#dc2626', fontSize: 11 }} />
              )}
              <Line
                type="monotone"
                dataKey={selectedMetric.key}
                stroke={selectedMetric.color}
                strokeWidth={2.5}
                dot={{ fill: selectedMetric.color, r: 5, strokeWidth: 2, stroke: 'white' }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>

          {/* AI insight */}
          <div style={{
            marginTop: '1rem', padding: '0.85rem 1rem',
            background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8,
            fontSize: '0.85rem', color: '#166534'
          }}>
            <TrendingUp size={15} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
            <strong>AI Insight:</strong>{' '}
            Your {selectedMetric.label.toLowerCase()} changed from{' '}
            <strong>{firstVal} {selectedMetric.unit}</strong> in {first.date} to{' '}
            <strong>{lastVal} {selectedMetric.unit}</strong> in {last.date}.{' '}
            {change > 0 ? 'This is an upward trend.' : change < 0 ? 'This is a downward trend.' : 'Values have remained stable.'}{' '}
            Discuss any concerns with your doctor.
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid-3" style={{ gap: '1rem' }}>
        {METRICS.slice(0, 6).map(m => {
          const val = last[m.key as keyof typeof last] as number;
          const prev = first[m.key as keyof typeof first] as number;
          const diff = val - prev;
          return (
            <div key={m.key} className="card" style={{ padding: '1.25rem', cursor: 'pointer', borderLeft: `4px solid ${m.color}` }}
              onClick={() => setSelectedMetric(m)}>
              <div style={{ fontSize: '0.78rem', color: '#9ca3af', fontWeight: 600, marginBottom: '0.2rem', textTransform: 'uppercase' }}>
                {m.label}
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: m.color }}>
                {val} <span style={{ fontSize: '0.85rem', color: '#9ca3af' }}>{m.unit}</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: diff >= 0 ? '#16a34a' : '#ea580c', marginTop: '0.2rem' }}>
                {diff >= 0 ? '↑' : '↓'} {Math.abs(diff).toFixed(1)} from {first.date}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
