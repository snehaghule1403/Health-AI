import { useState, useRef, useEffect } from 'react';
import { Send, Brain, Trash2, AlertCircle, Sparkles, Mic, MicOff, Volume2, Pause, Play, Square } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { apiPost, getAIStatus } from '../../lib/api';
import type { Symptom } from '../../types';
import { useSpeechInput, useSpeechOutput, VOICE_LANGS, type VoiceLang } from '../../lib/speech';

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

  // null = unknown (still checking or status endpoint unreachable) — don't block in that case.
  const [aiAvailable, setAiAvailable] = useState<boolean | null>(null);
  useEffect(() => { getAIStatus().then(st => setAiAvailable(st ? st.ai : null)); }, []);
  const aiOff = aiAvailable === false;

  // ─── Voice ───
  const [lang, setLang] = useState<VoiceLang>('en');
  const [autoSpeak, setAutoSpeak] = useState(true);
  const lastInputWasVoice = useRef(false);
  const tts = useSpeechOutput();
  const mic = useSpeechInput(lang, (text) => { lastInputWasVoice.current = true; void sendMessage(text); });

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
    tts.stop();
    const spoken = lastInputWasVoice.current;
    lastInputWasVoice.current = false;

    addChatMessage({ id: `local-${Date.now()}`, role: 'user', content: msg, timestamp: new Date().toISOString() });
    try {
      // The server calls the AI provider and saves both messages.
      const { reply } = await apiPost<{ reply: string }>('/api/ai/chat', { message: msg, language: lang });
      const replyId = `local-${Date.now() + 1}`;
      addChatMessage({ id: replyId, role: 'assistant', content: reply, timestamp: new Date().toISOString() });
      if (spoken && autoSpeak) tts.speak(replyId, reply, lang);
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

      {aiOff && (
        <div className="alert alert-info" role="status" style={{ marginBottom: '1.25rem' }}>
          <AlertCircle size={16} style={{ flexShrink: 0 }} />
          <span>
            <strong>The AI assistant is not available yet.</strong> The server has not been connected to the AI service.
            Your records, wellness tracking and other features work normally.
          </span>
        </div>
      )}

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
        <div className="assistant-layout">
          {/* Chat window */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', height: 600 }}>
            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {chatMessages.length === 0 && (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--gray-400)' }}>
                  <Brain size={48} style={{ opacity: 0.3, margin: '0 auto 1rem' }} />
                  <p style={{ fontWeight: 500, color: 'var(--gray-500)' }}>Start a conversation</p>
                  <p style={{ fontSize: '0.85rem' }}>Ask about your health, reports, or medical terms</p>
                </div>
              )}
              {chatMessages.map(msg => (
                <div key={msg.id} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  {msg.role === 'assistant' && (
                    <div style={{
                      width: 30, height: 30, borderRadius: '50%', background: 'var(--primary-light)',
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
                    {msg.role === 'assistant' && tts.supported && (
                      <div className="speak-controls" role="group" aria-label="Read reply aloud">
                        {tts.speakingId !== msg.id ? (
                          <button type="button" onClick={() => tts.speak(msg.id, msg.content, lang)} aria-label="Listen to this reply">
                            <Volume2 size={14} /> Listen
                          </button>
                        ) : (
                          <>
                            {tts.paused
                              ? <button type="button" onClick={tts.resume} aria-label="Resume reading"><Play size={14} /> Resume</button>
                              : <button type="button" onClick={tts.pause} aria-label="Pause reading"><Pause size={14} /> Pause</button>}
                            <button type="button" onClick={tts.stop} aria-label="Stop reading"><Square size={13} /> Stop</button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Brain size={15} color="#2563eb" />
                  </div>
                  <div style={{ background: 'var(--surface)', border: '1px solid var(--gray-200)', borderRadius: 12, padding: '0.75rem 1rem' }}>
                    <span style={{ display: 'flex', gap: 4 }}>
                      {[0, 1, 2].map(i => (
                        <span key={i} style={{
                          width: 7, height: 7, borderRadius: '50%', background: 'var(--gray-400)',
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
            <div style={{ padding: '1rem', borderTop: '1px solid var(--gray-100)' }}>
              <div className="voice-bar">
                <label htmlFor="voice-lang" className="sr-only">Language</label>
                <select id="voice-lang" value={lang} onChange={e => { mic.stop(); tts.stop(); setLang(e.target.value as VoiceLang); }} style={{ width: 'auto' }}>
                  {VOICE_LANGS.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}
                </select>
                {tts.supported && (
                  <label className="voice-toggle">
                    <input type="checkbox" checked={autoSpeak} onChange={e => { setAutoSpeak(e.target.checked); if (!e.target.checked) tts.stop(); }} />
                    Read replies aloud after voice questions
                  </label>
                )}
                {tts.speakingId && (
                  <button type="button" className="btn btn-outline btn-sm" onClick={tts.stop} style={{ marginLeft: 'auto' }}>
                    <Square size={12} /> Stop speaking
                  </button>
                )}
              </div>
              {(mic.error || tts.notice) && (
                <div className="alert alert-warning" role="alert" style={{ marginBottom: '0.6rem', padding: '0.55rem 0.8rem' }}>
                  <AlertCircle size={14} style={{ flexShrink: 0 }} /> {mic.error || tts.notice}
                </div>
              )}
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  className={`btn mic-btn ${mic.listening ? 'listening' : 'btn-outline'}`}
                  onClick={mic.listening ? mic.stop : mic.start}
                  disabled={loading || !mic.supported || aiOff}
                  aria-pressed={mic.listening}
                  aria-label={mic.listening ? 'Stop listening' : 'Speak your question'}
                  title={mic.supported ? (mic.listening ? 'Stop listening' : 'Speak your question') : 'Voice input is not supported in this browser — try Chrome or Edge'}
                >
                  {mic.listening ? <MicOff size={16} /> : <Mic size={16} />}
                </button>
                <label htmlFor="chat-input" className="sr-only">Your question</label>
                <input
                  id="chat-input"
                  value={mic.listening ? mic.interim : input}
                  readOnly={mic.listening}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  placeholder={mic.listening ? 'Listening… speak now' : 'Type or speak a health question…'}
                  style={{ flex: 1 }}
                />
                <button
                  className="btn btn-primary"
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || loading || mic.listening || aiOff}
                  style={{ padding: '0.55rem 1rem' }}
                  aria-label="Send message"
                >
                  <Send size={16} />
                </button>
              </div>
              <p style={{ fontSize: '0.72rem', color: 'var(--gray-400)', marginTop: '0.5rem' }}>
                Voice uses your browser’s speech service while the mic is on. HealthAI never records or stores audio.
              </p>
              {chatMessages.length > 0 && (
                <button
                  onClick={() => { tts.stop(); clearChat(); }}
                  style={{ background: 'none', border: 'none', color: 'var(--gray-400)', fontSize: '0.75rem', cursor: 'pointer', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                >
                  <Trash2 size={12} /> Clear chat
                </button>
              )}
            </div>
          </div>

          {/* Suggestions */}
          <div>
            <div className="card" style={{ padding: '1.25rem' }}>
              <h4 style={{ fontWeight: 600, color: 'var(--gray-800)', marginBottom: '0.75rem', fontSize: '0.9rem' }}>
                💡 Suggested Questions
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {SUGGESTED.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(q)}
                    disabled={aiOff}
                    style={{
                      background: 'var(--gray-50)', border: '1px solid var(--gray-200)', borderRadius: 8,
                      padding: '0.6rem 0.85rem', textAlign: 'left', cursor: 'pointer',
                      fontSize: '0.8rem', color: 'var(--gray-700)', lineHeight: 1.4,
                      transition: 'all 0.15s'
                    }}
                    onMouseEnter={e => {
                      (e.target as HTMLButtonElement).style.background = 'var(--primary-light)';
                      (e.target as HTMLButtonElement).style.borderColor = 'var(--primary)';
                      (e.target as HTMLButtonElement).style.color = 'var(--primary-ink)';
                    }}
                    onMouseLeave={e => {
                      (e.target as HTMLButtonElement).style.background = 'var(--gray-50)';
                      (e.target as HTMLButtonElement).style.borderColor = 'var(--gray-200)';
                      (e.target as HTMLButtonElement).style.color = 'var(--gray-700)';
                    }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            <div className="card" style={{ padding: '1.25rem', marginTop: '1rem' }}>
              <h4 style={{ fontWeight: 600, color: 'var(--gray-800)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                ℹ️ About This AI
              </h4>
              <p style={{ fontSize: '0.78rem', color: 'var(--gray-500)', lineHeight: 1.5 }}>
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
                <label className="form-label" htmlFor="aiassistant-f1">Symptom *</label>
                <input id="aiassistant-f1"
                  value={symptomForm.symptom}
                  onChange={e => setSymptomForm({ ...symptomForm, symptom: e.target.value })}
                  placeholder="e.g., Fatigue, Headache, Nausea"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="aiassistant-f2">Duration</label>
                  <input id="aiassistant-f2"
                    value={symptomForm.duration}
                    onChange={e => setSymptomForm({ ...symptomForm, duration: e.target.value })}
                    placeholder="e.g., 5 days"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="aiassistant-f3">Severity</label>
                  <select id="aiassistant-f3"
                    value={symptomForm.severity}
                    onChange={e => setSymptomForm({ ...symptomForm, severity: e.target.value as typeof SEVERITY_LEVELS[number] })}
                  >
                    {SEVERITY_LEVELS.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="aiassistant-f4">Frequency</label>
                <input id="aiassistant-f4"
                  value={symptomForm.frequency}
                  onChange={e => setSymptomForm({ ...symptomForm, frequency: e.target.value })}
                  placeholder="e.g., Constant, Intermittent, Morning only"
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="aiassistant-f5">Notes</label>
                <textarea id="aiassistant-f5"
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
                disabled={!symptomForm.symptom || symptomLoading || aiOff}
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
                  <div style={{ whiteSpace: 'pre-wrap', fontSize: '0.875rem', color: 'var(--gray-700)', lineHeight: 1.7 }}>
                    {symptomResult}
                  </div>
                </div>
              </div>
            ) : (
              <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--gray-400)' }}>
                <Sparkles size={40} style={{ opacity: 0.3, margin: '0 auto 1rem' }} />
                <p style={{ color: 'var(--gray-500)', fontWeight: 500 }}>Enter a symptom to get guidance</p>
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
