import { tl , type DictKey } from '../lib/i18n';
import { useEffect, useRef, useState } from 'react';
import { Mic, Square, Check, RotateCcw, Keyboard } from 'lucide-react';
import { Measurements } from '../types/order';
import { parseVoiceMeasurements } from '../lib/voice-parse';

/* eslint-disable @typescript-eslint/no-explicit-any */
type Rec = any;
const getCtor = (): (new () => Rec) | null => {
  if (typeof window === 'undefined') return null;
  const w = window as any;
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
};

const LABELS: Record<keyof Measurements, DictKey> = {
  kameezLambai: 'm_length', teera: 'm_shoulder', bazu: 'm_sleeves', gala: 'm_neck',
  chhaati: 'm_chest', kamar: 'm_waist', ghera: 'm_daman', shalwarLambai: 'm_shalwar_length',
  paincha: 'm_bottom', asan: 'm_crotch', shalwarGhera: 'm_shalwar_width',
};

type Phase = 'idle' | 'listening' | 'preview' | 'error';

export function VoiceMeasurements({ onConfirm }: { onConfirm: (values: Partial<Measurements>) => void }) {
  const Ctor = getCtor();
  const recRef = useRef<Rec | null>(null);
  const triedFallback = useRef(false);
  const [phase, setPhase] = useState<Phase>('idle');
  const [transcript, setTranscript] = useState('');
  const [parsed, setParsed] = useState<Partial<Measurements>>({});
  const [error, setError] = useState('');
  const [lang, setLang] = useState('ur-PK');

  useEffect(() => () => { try { recRef.current?.abort(); } catch { /* ignore */ } }, []);

  if (!Ctor) return null;

  const start = (language = 'ur-PK') => {
    try { recRef.current?.abort(); } catch { /* ignore */ }
    const rec: Rec = new Ctor();
    recRef.current = rec;
    rec.lang = language; rec.interimResults = true; rec.continuous = true; rec.maxAlternatives = 1;
    setLang(language); setError(''); setPhase('listening');
    let finalText = '';
    rec.onresult = (e: any) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalText += t + ' '; else interim += t;
      }
      setTranscript((finalText + interim).trim());
    };
    rec.onerror = (e: any) => {
      const code = e?.error as string;
      if (code === 'language-not-supported' && !triedFallback.current) {
        triedFallback.current = true; start('en-US'); return;
      }
      if (code === 'aborted') return;
      const msg = code === 'not-allowed' || code === 'service-not-allowed'
        ? tl('m_microphone_permission_denied_please_type')
        : code === 'network'
          ? tl('m_voice_needs_internet_in_this_browser_ple')
          : code === 'no-speech' ? tl('m_no_speech_heard_try_again_closer_to_the_')
            : tl('m_voice_input_failed_please_type_measureme');
      setError(msg); setPhase('error');
    };
    rec.onend = () => {
      if (recRef.current !== rec) return;
      setPhase((p) => {
        if (p !== 'listening') return p;
        const values = parseVoiceMeasurements(finalText);
        setParsed(values);
        return 'preview';
      });
    };
    try { rec.start(); } catch { setError(tl('m_could_not_start_microphone')); setPhase('error'); }
  };

  const stop = () => { try { recRef.current?.stop(); } catch { /* ignore */ } };
  const reset = () => { try { recRef.current?.abort(); } catch { /* ignore */ } recRef.current = null; setPhase('idle'); setTranscript(''); setParsed({}); setError(''); };
  const entries = Object.entries(parsed).filter(([, v]) => typeof v === 'number' && Number.isFinite(v)) as [keyof Measurements, number][];

  return (
    <div className="mb-4 rounded-lg border border-border  bg-warning-soft/60  p-3" data-testid="voice-measurements">
      {phase === 'idle' && (
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => { triedFallback.current = false; setTranscript(''); start('ur-PK'); }}
            className="h-12 w-12 shrink-0 rounded-full bg-accent hover:bg-warning text-accent-foreground flex items-center justify-center active:scale-95 transition" aria-label={tl('m_speak_measurements')} data-testid="btn-voice-start">
            <Mic size={20} />
          </button>
          <div className="text-sm leading-snug">
            <div className="font-bold text-sm">{tl('j_speak_measurements')}</div>
            <div className="text-muted-foreground">{tl('j_e_g_lambai_chalees_bazu_chaubees_aur_aad')}</div>
          </div>
        </div>
      )}
      {phase === 'listening' && (
        <div className="space-y-2" aria-live="polite">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3"><span className="absolute inline-flex h-full w-full rounded-full bg-danger opacity-60 " /><span className="relative inline-flex h-3 w-3 rounded-full bg-danger" /></span>
            <span className="text-sm font-bold">{tl('voice_listening', { lang })}</span>
            <button type="button" onClick={stop} className="ml-auto min-h-[44px] px-4 rounded-lg bg-primary text-primary-foreground text-sm font-bold flex items-center gap-1.5" data-testid="btn-voice-stop"><Square size={14} /> {tl('j_done')}</button>
          </div>
          <p className="text-sm min-h-[2.5rem] bg-card rounded-lg p-2 border border-border">{transcript || '...'}</p>
        </div>
      )}
      {phase === 'preview' && (
        <div className="space-y-2">
          <div className="text-sm text-muted-foreground">{tl('j_heard')} <span className="text-foreground italic">"{transcript || '-'}"</span></div>
          {entries.length === 0 ? (
            <p className="text-sm font-semibold text-danger">{tl('j_no_measurements_recognised_try_again_or_')}</p>
          ) : (
            <ul className="grid grid-cols-2 gap-1.5">
              {entries.map(([k, v]) => (
                <li key={k} className="flex justify-between bg-card border border-border rounded-lg px-2 py-1.5 text-sm"><span>{tl(LABELS[k])}</span><b className="font-mono">{v}"</b></li>
              ))}
            </ul>
          )}
          <div className="flex gap-2">
            <button type="button" onClick={reset} className="flex-1 min-h-[44px] rounded-lg border border-border bg-card text-sm font-bold flex items-center justify-center gap-1.5" data-testid="btn-voice-retry"><RotateCcw size={14} /> {tl('j_retry')}</button>
            <button type="button" disabled={entries.length === 0} onClick={() => { onConfirm(Object.fromEntries(entries) as Partial<Measurements>); reset(); }}
              className="flex-[1.4] min-h-[44px] rounded-lg bg-primary disabled:opacity-40 text-primary-foreground text-sm font-bold flex items-center justify-center gap-1.5" data-testid="btn-voice-apply"><Check size={14} aria-hidden /> {tl('voice_apply_n', { count: entries.length })}</button>
          </div>
        </div>
      )}
      {phase === 'error' && (
        <div className="space-y-2" role="alert">
          <p className="text-sm font-semibold text-danger  flex items-start gap-2"><Keyboard size={16} className="shrink-0 mt-0.5" />{error}</p>
          <button type="button" onClick={reset} className="min-h-[44px] px-4 rounded-lg border border-border bg-card text-sm font-bold">{tl('j_ok')}</button>
        </div>
      )}
    </div>
  );
}
