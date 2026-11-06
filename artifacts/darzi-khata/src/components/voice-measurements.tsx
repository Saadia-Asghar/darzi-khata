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

const LABELS: Record<keyof Measurements, string> = {
  kameezLambai: 'Length / لمبائی', teera: 'Shoulder / تیرا', bazu: 'Sleeves / بازو', gala: 'Neck / گلا',
  chhaati: 'Chest / چھاتی', kamar: 'Waist / کمر', ghera: 'Daman / گھیرا', shalwarLambai: 'Shalwar length / شلوار لمبائی',
  paincha: 'Bottom / پائنچہ', asan: 'Crotch / آسن', shalwarGhera: 'Shalwar width / شلوار گھیرا',
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
        ? 'Microphone permission denied. Please type measurements below. / مائیک کی اجازت نہیں، ناپ ہاتھ سے لکھیں'
        : code === 'network'
          ? 'Voice needs internet in this browser. Please type instead. / آواز کے لیے انٹرنیٹ ضروری ہے'
          : code === 'no-speech' ? 'No speech heard. Try again closer to the phone. / آواز نہیں سنی گئی'
            : 'Voice input failed. Please type measurements. / آواز کام نہیں کر سکی';
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
    try { rec.start(); } catch { setError('Could not start microphone / مائیک شروع نہ ہو سکا'); setPhase('error'); }
  };

  const stop = () => { try { recRef.current?.stop(); } catch { /* ignore */ } };
  const reset = () => { try { recRef.current?.abort(); } catch { /* ignore */ } recRef.current = null; setPhase('idle'); setTranscript(''); setParsed({}); setError(''); };
  const entries = Object.entries(parsed).filter(([, v]) => typeof v === 'number' && Number.isFinite(v)) as [keyof Measurements, number][];

  return (
    <div className="mb-4 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/60 dark:bg-amber-900/10 p-3" data-testid="voice-measurements">
      {phase === 'idle' && (
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => { triedFallback.current = false; setTranscript(''); start('ur-PK'); }}
            className="h-12 w-12 shrink-0 rounded-full bg-amber-600 hover:bg-amber-700 text-white flex items-center justify-center active:scale-95 transition" aria-label="Speak measurements / ناپ بولیں" data-testid="btn-voice-start">
            <Mic size={20} />
          </button>
          <div className="text-xs leading-snug">
            <div className="font-bold text-sm">Speak measurements <span className="font-urdu font-normal">ناپ بول کر لکھیں</span></div>
            <div className="text-muted-foreground">e.g. "lambai chalees, bazu chaubees aur aadha". Needs internet in most browsers. / زیادہ تر براؤزرز میں انٹرنیٹ ضروری</div>
          </div>
        </div>
      )}
      {phase === 'listening' && (
        <div className="space-y-2" aria-live="polite">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3"><span className="absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-60 animate-ping" /><span className="relative inline-flex h-3 w-3 rounded-full bg-red-600" /></span>
            <span className="text-sm font-bold">Listening ({lang}) / سن رہا ہے</span>
            <button type="button" onClick={stop} className="ml-auto min-h-[44px] px-4 rounded-lg bg-emerald-800 text-white text-sm font-bold flex items-center gap-1.5" data-testid="btn-voice-stop"><Square size={14} /> Done / بس</button>
          </div>
          <p className="text-sm min-h-[2.5rem] bg-card rounded-lg p-2 border border-border">{transcript || '...'}</p>
        </div>
      )}
      {phase === 'preview' && (
        <div className="space-y-2">
          <div className="text-xs text-muted-foreground">Heard / سنا: <span className="text-foreground italic">"{transcript || '-'}"</span></div>
          {entries.length === 0 ? (
            <p className="text-sm font-semibold text-red-600">No measurements recognised. Try again or type below. / کوئی ناپ سمجھ نہیں آیا</p>
          ) : (
            <ul className="grid grid-cols-2 gap-1.5">
              {entries.map(([k, v]) => (
                <li key={k} className="flex justify-between bg-card border border-border rounded-lg px-2 py-1.5 text-xs"><span>{LABELS[k]}</span><b className="font-mono">{v}"</b></li>
              ))}
            </ul>
          )}
          <div className="flex gap-2">
            <button type="button" onClick={reset} className="flex-1 min-h-[44px] rounded-lg border border-border bg-card text-sm font-bold flex items-center justify-center gap-1.5" data-testid="btn-voice-retry"><RotateCcw size={14} /> Retry / دوبارہ</button>
            <button type="button" disabled={entries.length === 0} onClick={() => { onConfirm(Object.fromEntries(entries) as Partial<Measurements>); reset(); }}
              className="flex-[1.4] min-h-[44px] rounded-lg bg-emerald-700 disabled:opacity-40 text-white text-sm font-bold flex items-center justify-center gap-1.5" data-testid="btn-voice-apply"><Check size={14} /> Apply {entries.length} / لگائیں</button>
          </div>
        </div>
      )}
      {phase === 'error' && (
        <div className="space-y-2" role="alert">
          <p className="text-sm font-semibold text-red-700 dark:text-red-400 flex items-start gap-2"><Keyboard size={16} className="shrink-0 mt-0.5" />{error}</p>
          <button type="button" onClick={reset} className="min-h-[44px] px-4 rounded-lg border border-border bg-card text-sm font-bold">OK / ٹھیک ہے</button>
        </div>
      )}
    </div>
  );
}
