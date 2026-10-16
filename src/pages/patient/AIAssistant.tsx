import { useState, useRef, useEffect } from 'react';
import { Send, Brain, Trash2, AlertCircle, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { apiPost } from '../../lib/api';
import type { Symptom } from '../../types';

const SUGGESTED = [
  'Explain my latest blood report.',
  'What does hemoglobin mean?',
  'Compare my previous reports.',
  'What is BMI?',
  'What should I discuss with my doctor?',
  'Tell me about fatigue.',
];

const SEVERITY_LEVELS = ['Mild', 'Moderate', 'Severe'] as const;

export default function AIAssistant() {
  const { currentUser, chatMessages, addChatMessage, clearChat, addSymptom } = useApp();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'symptom'>('chat');

  // Symptom form
  const [symptomForm, setSymptomForm] = useState({
    symptom: '', duration: '', severity: 'Moderate' as typeof SEVERITY_LEVELS[number],
    frequency: '', notes: ''
  });
  const [symptomResult, setSymptomResult] = useState('');
  const [symptomLoading, setSymptomLoading] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, loading]);

  const [chatError, setChatError] = useState('');
  const [symptomError, setSymptomError] = useState('');

  const sendMessage = async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;
    setInput('');
    setChatError('');
    setLoading(true);

    addChatMessage({ id: `local-${Date.now()}`, role: 'user', content: msg, timestamp: new Date().toISOString() });
    try {
      // The server calls the AI provider and saves both messages.
      const { reply } = await apiPost<{ reply: string }>('/api/ai/chat', { message: msg });
      addChatMessage({ id: `local-${Date.now() + 1}`, role: 'assistant', content: reply, timestamp: new Date().toISOString() });
    } catch (e) {
      setChatError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleSymptomCheck = async () => {
    if (!symptomForm.symptom.trim()) return setSymptomError('Please describe your symptom.');
    setSymptomLoading(true);
    setSymptomResult('');
    setSymptomError('');
    try {
      const { reply, symptom } = await apiPost<{ reply: string; symptom: Record<string, string> }>('/api/ai/symptoms', symptomForm);
      setSymptomResult(reply);
      const sym: Symptom = {
        id: symptom.id, patientId: currentUser?.id ?? '', symptom: symptomForm.symptom, duration: symptomForm.duration,
        severity: symptomForm.severity, frequency: symptomForm.frequency, notes: symptomForm.notes,
        date: symptom.created_at, aiResponse: reply,
      };
      addSymptom(sym);
    } catch (e) {
      setSymptomError((e as Error).message);
    } finally {
      setSymptomLoading(false);
    }
  };

  // Simple markdown-like rendering
  const renderContent = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, i) => {
      if (line.startsWith('**') && line.endsWith('**')) {
        return <strong key={i} style={{ display: 'block', marginTop: i > 0 ? '0.5rem' : 0 }}>{line.slice(2, -2)}</strong>;
      }
      if (line.includes('**')) {
        const parts = line.split(/\*\*(.*?)\*\*/g);
        return (
          <span key={i} style={{ display: 'block' }}>
            {parts.map((p, j) => j % 2 === 1 ? <strong key={j}>{p}</strong> : p)}
          </span>
        );
      }
      if (line.startsWith('- ')) {
        return <div key={i} style={{ paddingLeft: '0.75rem', marginTop: '0.2rem' }}>• {line.slice(2)}</div>;
      }
      if (line === '') return <br key={i} />;
      return <span key={i} style={{ display: 'block' }}>{line}</span>;
    });
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-header-left">
          <h1>AI Health Assistant</h1>
          <p>Get plain-language health information and symptom guidance</p>
        </div>
      </div>

      <div className="disclaimer" style={{ marginBottom: '1.5rem' }}>
        <AlertCircle size={16} style={{ flexShrink: 0 }} />
        This AI provides educational health information only. It does not diagnose, prescribe, or replace professional medical advice.
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {([['chat', 'AI Chat Assistant'], ['symptom', 'Symptom Checker']] as const).map(([tab, label]) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`btn ${activeTab === tab ? 'btn-primary' : 'btn-outline'}`}
          >
            {tab === 'chat' ? <Brain size={15} /> : <Sparkles size={15} />}
            {label}
          </button>
        ))}
      </div>

      {/* ─── CHAT TAB ─── */}
      {activeTab === 'chat' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '1.25rem', alignItems: 'start' }}>
          {/* Chat window */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', height: 600 }}>
            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {chatMessages.length === 0 && (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#9ca3af' }}>
                  <Brain size={48} style={{ opacity: 0.3, margin: '0 auto 1rem' }} />
                  <p style={{ fontWeight: 500, color: '#6b7280' }}>Start a conversation</p>
                  <p style={{ fontSize: '0.85rem' }}>Ask about your health, reports, or medical terms</p>
                </div>
              )}
              {chatMessages.map(msg => (
                <div key={msg.id} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  {msg.role === 'assistant' && (
                    <div style={{
                      width: 30, height: 30, borderRadius: '50%', background: '#dbeafe',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0, marginRight: '0.5rem', alignSelf: 'flex-end'
                    }}>
                      <Brain size={15} color="#2563eb" />
                    </div>
                  )}
                  <div className={`chat-bubble ${msg.role}`}>
                    {msg.role === 'assistant'
                      ? <div style={{ lineHeight: 1.6 }}>{renderContent(msg.content)}</div>
                      : msg.content
                    }
                  </div>
                </div>
              ))}
              {loading && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Brain size={15} color="#2563eb" />
                  </div>
                  <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 12, padding: '0.75rem 1rem' }}>
                    <span style={{ display: 'flex', gap: 4 }}>
                      {[0, 1, 2].map(i => (
                        <span key={i} style={{
                          width: 7, height: 7, borderRadius: '50%', background: '#9ca3af',
                          animation: `bounce 1s ${i * 0.2}s infinite`
                        }} />
                      ))}
                    </span>
                  </div>
                </div>
              )}
              {chatError && (
                <div className="alert alert-danger" role="alert" style={{ margin: '0.5rem 0' }}>
                  <AlertCircle size={14} /> {chatError}
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div style={{ padding: '1rem', borderTop: '1px solid #f3f4f6' }}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  placeholder="Ask a health question..."
                  style={{ flex: 1 }}
                />
                <button
                  className="btn btn-primary"
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || loading}
                  style={{ padding: '0.55rem 1rem' }}
                >
                  <Send size={16} />
                </button>
              </div>
              {chatMessages.length > 0 && (
                <button
                  onClick={clearChat}
                  style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: '0.75rem', cursor: 'pointer', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                >
                  <Trash2 size={12} /> Clear chat
                </button>
              )}
            </div>
          </div>

          {/* Suggestions */}
          <div>
            <div className="card" style={{ padding: '1.25rem' }}>
              <h4 style={{ fontWeight: 600, color: '#1f2937', marginBottom: '0.75rem', fontSize: '0.9rem' }}>
                💡 Suggested Questions
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {SUGGESTED.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(q)}
                    style={{
                      background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8,
                      padding: '0.6rem 0.85rem', textAlign: 'left', cursor: 'pointer',
                      fontSize: '0.8rem', color: '#374151', lineHeight: 1.4,
                      transition: 'all 0.15s'
                    }}
                    onMouseEnter={e => {
                      (e.target as HTMLButtonElement).style.background = '#dbeafe';
                      (e.target as HTMLButtonElement).style.borderColor = '#93c5fd';
                      (e.target as HTMLButtonElement).style.color = '#1e40af';
                    }}
                    onMouseLeave={e => {
                      (e.target as HTMLButtonElement).style.background = '#f9fafb';
                      (e.target as HTMLButtonElement).style.borderColor = '#e5e7eb';
                      (e.target as HTMLButtonElement).style.color = '#374151';
                    }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            <div className="card" style={{ padding: '1.25rem', marginTop: '1rem' }}>
              <h4 style={{ fontWeight: 600, color: '#1f2937', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                ℹ️ About This AI
              </h4>
              <p style={{ fontSize: '0.78rem', color: '#6b7280', lineHeight: 1.5 }}>
                Answers are generated by a real AI model on our server. Your chat history is saved privately to your account and is never shared with doctors. Not a substitute for professional medical advice.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ─── SYMPTOM TAB ─── */}
      {activeTab === 'symptom' && (
        <div className="grid-2" style={{ alignItems: 'start', gap: '1.5rem' }}>
          <div className="card">
            <div className="card-header">
              <h3>Log a Symptom</h3>
            </div>
            <div className="card-body">
              <div className="form-group">
                <label className="form-label">Symptom *</label>
                <input
                  value={symptomForm.symptom}
                  onChange={e => setSymptomForm({ ...symptomForm, symptom: e.target.value })}
                  placeholder="e.g., Fatigue, Headache, Nausea"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Duration</label>
                  <input
                    value={symptomForm.duration}
                    onChange={e => setSymptomForm({ ...symptomForm, duration: e.target.value })}
                    placeholder="e.g., 5 days"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Severity</label>
                  <select
                    value={symptomForm.severity}
                    onChange={e => setSymptomForm({ ...symptomForm, severity: e.target.value as typeof SEVERITY_LEVELS[number] })}
                  >
                    {SEVERITY_LEVELS.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Frequency</label>
                <input
                  value={symptomForm.frequency}
                  onChange={e => setSymptomForm({ ...symptomForm, frequency: e.target.value })}
                  placeholder="e.g., Constant, Intermittent, Morning only"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea
                  value={symptomForm.notes}
                  onChange={e => setSymptomForm({ ...symptomForm, notes: e.target.value })}
                  placeholder="Any additional details..."
                  rows={3}
                  style={{ resize: 'vertical' }}
                />
              </div>
              <button
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center' }}
                disabled={!symptomForm.symptom || symptomLoading}
                onClick={handleSymptomCheck}
              >
                {symptomLoading ? 'Analyzing...' : <><Sparkles size={15} /> Check Symptom</>}
              </button>
            </div>
          </div>

          <div>
            {symptomError && (
              <div className="alert alert-danger" role="alert" style={{ marginBottom: '1rem' }}>
                <AlertCircle size={14} /> {symptomError}
              </div>
            )}
            {symptomResult ? (
              <div className="card">
                <div className="card-header">
                  <h3>AI Health Guidance</h3>
                  <span className="demo-badge">AI-generated</span>
                </div>
                <div className="card-body">
                  <div className="disclaimer" style={{ marginBottom: '1rem' }}>
                    <AlertCircle size={14} />
                    Not a diagnosis. For educational purposes only.
                  </div>
                  <div style={{ whiteSpace: 'pre-wrap', fontSize: '0.875rem', color: '#374151', lineHeight: 1.7 }}>
                    {symptomResult}
                  </div>
                </div>
              </div>
            ) : (
              <div className="card" style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af' }}>
                <Sparkles size={40} style={{ opacity: 0.3, margin: '0 auto 1rem' }} />
                <p style={{ color: '#6b7280', fontWeight: 500 }}>Enter a symptom to get guidance</p>
                <p style={{ fontSize: '0.8rem' }}>Examples: Fatigue, Headache, Nausea, Back pain</p>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
}
