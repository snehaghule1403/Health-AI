import { useCallback, useEffect, useRef, useState } from 'react';

// Voice input/output via the browser's built-in Web Speech API.
// No API keys are involved and nothing is recorded or stored by HealthAI:
// audio goes only to the browser's own speech service while the mic is on.

export type VoiceLang = 'en' | 'hi' | 'mr';

export const VOICE_LANGS: { id: VoiceLang; label: string; bcp47: string }[] = [
  { id: 'en', label: 'English', bcp47: 'en-IN' },
  { id: 'hi', label: 'हिन्दी (Hindi)', bcp47: 'hi-IN' },
  { id: 'mr', label: 'मराठी (Marathi)', bcp47: 'mr-IN' },
];

export const bcp47 = (l: VoiceLang) => VOICE_LANGS.find(v => v.id === l)!.bcp47;

// Minimal typings — SpeechRecognition is not in TypeScript's DOM lib.
type RecognitionResult = { isFinal: boolean; 0: { transcript: string } };
interface Recognition extends EventTarget {
  lang: string; interimResults: boolean; continuous: boolean; maxAlternatives: number;
  start(): void; stop(): void; abort(): void;
  onresult: ((e: { resultIndex: number; results: ArrayLike<RecognitionResult> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
}
type RecognitionCtor = new () => Recognition;

const getRecognition = (): RecognitionCtor | undefined => {
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
};

const MIC_ERRORS: Record<string, string> = {
  'not-allowed': 'Microphone access was blocked. Allow it in your browser’s site settings, or type your question instead.',
  'service-not-allowed': 'Speech recognition is not allowed in this browser. Please type your question instead.',
  'audio-capture': 'No microphone was found. Check that one is connected, or type your question instead.',
  'network': 'Speech recognition needs an internet connection. Please try again or type instead.',
  'language-not-supported': 'This browser cannot recognise speech in the selected language. Try English, or type instead.',
  'no-speech': 'No speech was heard. Tap the microphone and try again.',
};

/** Speech-to-text. `onFinal` receives the finished transcript. */
export function useSpeechInput(lang: VoiceLang, onFinal: (text: string) => void) {
  const supported = typeof window !== 'undefined' && Boolean(getRecognition());
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState('');
  const [error, setError] = useState('');
  const rec = useRef<Recognition | null>(null);
  const finalRef = useRef('');
  const onFinalRef = useRef(onFinal);
  onFinalRef.current = onFinal;

  const stop = useCallback(() => rec.current?.stop(), []);

  const start = useCallback(() => {
    const Ctor = getRecognition();
    if (!Ctor) { setError('Voice input is not supported in this browser. Try Chrome or Edge, or type your question.'); return; }
    rec.current?.abort();
    const r = new Ctor();
    r.lang = bcp47(lang);
    r.interimResults = true;
    r.continuous = false;
    r.maxAlternatives = 1;
    finalRef.current = '';
    r.onresult = (e) => {
      let live = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        if (res.isFinal) finalRef.current += res[0].transcript;
        else live += res[0].transcript;
      }
      setInterim((finalRef.current + live).trim());
    };
    r.onerror = (e) => { if (e.error !== 'aborted') setError(MIC_ERRORS[e.error] ?? 'Voice input stopped unexpectedly. Please try again.'); };
    r.onend = () => {
      setListening(false);
      setInterim('');
      const text = finalRef.current.trim();
      if (text) onFinalRef.current(text);
    };
    setError('');
    rec.current = r;
    try { r.start(); setListening(true); }
    catch { setError('Could not start the microphone. Please try again.'); }
  }, [lang]);

  useEffect(() => () => rec.current?.abort(), []);

  return { supported, listening, interim, error, start, stop, clearError: () => setError('') };
}

/** Removes markdown so the speech engine does not read symbols aloud. */
const forSpeech = (t: string) => t.replace(/\*\*|__|`|#+\s/g, '').replace(/^\s*[-•]\s+/gm, '').replace(/\n{2,}/g, '. ');

/** Text-to-speech with play / pause / resume / stop. */
export function useSpeechOutput() {
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (!supported) return;
    // Voices load asynchronously in Chrome.
    window.speechSynthesis.getVoices();
    return () => window.speechSynthesis.cancel();
  }, [supported]);

  const stop = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    setSpeakingId(null);
    setPaused(false);
  }, [supported]);

  const speak = useCallback((id: string, text: string, lang: VoiceLang) => {
    if (!supported) { setNotice('Spoken replies are not supported in this browser.'); return; }
    window.speechSynthesis.cancel();
    const tag = bcp47(lang);
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(v => v.lang === tag) ?? voices.find(v => v.lang.startsWith(lang));
    setNotice(!voice && lang !== 'en' && voices.length
      ? `No ${VOICE_LANGS.find(v => v.id === lang)!.label} voice is installed on this device, so the reply may be read with a different accent.`
      : '');
    const u = new SpeechSynthesisUtterance(forSpeech(text));
    u.lang = tag;
    if (voice) u.voice = voice;
    u.rate = 0.98;
    u.onend = () => { setSpeakingId(null); setPaused(false); };
    u.onerror = () => { setSpeakingId(null); setPaused(false); };
    setSpeakingId(id);
    setPaused(false);
    window.speechSynthesis.speak(u);
  }, [supported]);

  const pause = useCallback(() => { window.speechSynthesis.pause(); setPaused(true); }, []);
  const resume = useCallback(() => { window.speechSynthesis.resume(); setPaused(false); }, []);

  return { supported, speakingId, paused, notice, speak, pause, resume, stop };
}
