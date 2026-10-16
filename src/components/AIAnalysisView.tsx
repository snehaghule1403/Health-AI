import { AlertCircle, CheckCircle } from 'lucide-react';
import type { AIAnalysis } from '../types';

// Renders a saved AI report analysis. Values shown here were extracted from the
// report text by the model; the explanation sections are AI interpretation.
export default function AIAnalysisView({ analysis }: { analysis: AIAnalysis }) {
  const statusColor = (s: string) => {
    if (s === 'normal') return { bg: '#dcfce7', color: '#166534' };
    if (s === 'low') return { bg: '#dbeafe', color: '#1e40af' };
    if (s === 'high') return { bg: '#fee2e2', color: '#991b1b' };
    return { bg: '#f3f4f6', color: '#374151' };
  };

  return (
    <div>
      <div className="disclaimer" style={{ marginBottom: '1.25rem' }}>
        <AlertCircle size={14} aria-hidden />
        {analysis.disclaimer}
      </div>

      <section style={{ marginBottom: '1.25rem' }}>
        <h4 style={{ fontWeight: 600, color: '#1f2937', marginBottom: '0.5rem' }}>📋 Report Summary <small style={{ color: '#7c3aed', fontWeight: 500 }}>(AI interpretation)</small></h4>
        <p style={{ fontSize: '0.9rem', color: '#374151', lineHeight: 1.6 }}>{analysis.summary}</p>
      </section>

      <section style={{ marginBottom: '1.25rem' }}>
        <h4 style={{ fontWeight: 600, color: '#1f2937', marginBottom: '0.75rem' }}>📊 Values found in the report</h4>
        {analysis.importantValues.length === 0 ? (
          <p style={{ fontSize: '0.85rem', color: '#6b7280' }}>No numeric values were identified in the extracted text.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.6rem' }}>
            {analysis.importantValues.map((v, i) => {
              const c = statusColor(v.status);
              return (
                <div key={i} style={{ background: c.bg, borderRadius: 8, padding: '0.75rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: c.color, fontWeight: 600, marginBottom: '0.2rem' }}>{v.name}</div>
                  <div style={{ fontWeight: 700, color: c.color, fontSize: '1rem' }}>{v.value}</div>
                  {v.referenceRange && <div style={{ fontSize: '0.7rem', color: c.color }}>Ref: {v.referenceRange}</div>}
                  <div style={{ fontSize: '0.7rem', color: c.color, textTransform: 'capitalize', marginTop: '0.2rem' }}>
                    {v.status === 'info' ? 'No flag in report' : v.status}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {analysis.keyFindings.length > 0 && (
        <section style={{ marginBottom: '1.25rem' }}>
          <h4 style={{ fontWeight: 600, color: '#1f2937', marginBottom: '0.5rem' }}>🔍 Key Findings</h4>
          {analysis.keyFindings.map((f, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.4rem', fontSize: '0.875rem', color: '#374151' }}>
              <CheckCircle size={14} color="#16a34a" style={{ marginTop: 3, flexShrink: 0 }} aria-hidden />
              {f}
            </div>
          ))}
        </section>
      )}

      <section style={{ marginBottom: '1.25rem' }}>
        <h4 style={{ fontWeight: 600, color: '#1f2937', marginBottom: '0.5rem' }}>💬 Simple Explanation</h4>
        <div style={{ background: '#f9fafb', borderRadius: 8, padding: '0.85rem', fontSize: '0.875rem', color: '#374151', lineHeight: 1.6 }}>
          {analysis.simpleExplanation}
        </div>
      </section>

      {!!analysis.missingOrUncertain?.length && (
        <section style={{ marginBottom: '1.25rem' }}>
          <h4 style={{ fontWeight: 600, color: '#1f2937', marginBottom: '0.5rem' }}>⚠️ Missing or uncertain</h4>
          <ul style={{ paddingLeft: '1.25rem', fontSize: '0.875rem', color: '#374151' }}>
            {analysis.missingOrUncertain.map((m, i) => <li key={i}>{m}</li>)}
          </ul>
        </section>
      )}

      {analysis.questionsForDoctor.length > 0 && (
        <section>
          <h4 style={{ fontWeight: 600, color: '#1f2937', marginBottom: '0.5rem' }}>🩺 Questions to Ask Your Doctor</h4>
          {analysis.questionsForDoctor.map((q, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.4rem', fontSize: '0.875rem', color: '#374151' }}>
              <span style={{ color: '#2563eb', fontWeight: 700, flexShrink: 0 }}>Q{i + 1}.</span>
              {q}
            </div>
          ))}
        </section>
      )}

      <p style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: '1rem' }}>
        Generated {new Date(analysis.generatedAt).toLocaleString()}{analysis.model ? ` by ${analysis.model}` : ''}.
      </p>
    </div>
  );
}
