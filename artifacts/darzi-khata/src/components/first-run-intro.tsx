import { entry, DICT } from '../lib/i18n';
import { usePreferences } from '../hooks/use-preferences';
import { useEffect, useState, useSyncExternalStore, type ReactNode } from 'react';
import { ArrowRight } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { useAuthContext } from '../context/auth-context';
import { notifyStorage } from '../lib/local-store';

const SLIDES = [
  { ...entry('d_record_every_order'), body: 'intro_body_1' as const },
  { ...entry('d_get_paid_cash_or_digital'), body: 'intro_body_2' as const },
  { ...entry('d_build_a_credit_record'), body: 'intro_body_3' as const },
];

function subscribeSeen(listener: () => void) {
  window.addEventListener('darzi-khata-local-update', listener);
  window.addEventListener('storage', listener);
  return () => { window.removeEventListener('darzi-khata-local-update', listener); window.removeEventListener('storage', listener); };
}
export function FirstRunIntro(): ReactNode {
  const { currentUser, userId } = useAuthContext();
  const key = `darzi-khata-intro-seen-${userId}`;
  const seen = useSyncExternalStore(subscribeSeen, () => !!localStorage.getItem(key), () => true);
  const open = !!currentUser && !seen;
  const [i, setI] = useState(0);
  const { label, lang } = usePreferences();

  useEffect(() => {
    setI(0);
  }, [key]);

  const dismiss = () => { localStorage.setItem(key, new Date().toISOString()); notifyStorage(key); };
  if (!currentUser) return null;
  const s = SLIDES[i]; const last = i === SLIDES.length - 1;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) dismiss(); }}>
      <DialogContent data-testid="intro-dialog" className="max-w-sm w-[calc(100%-1.5rem)] p-0 overflow-hidden rounded-lg gap-0 [&>button]:hidden">
        <div className="bg-primary text-primary-foreground px-4 pt-4 pb-4 relative">
          <div className="dk-stitch absolute left-0 right-0 bottom-0 opacity-80" />
          <div key={i} className="dk-rise">
            <DialogTitle className={`text-2xl font-bold ${lang === 'ur' ? 'font-urdu' : 'leading-tight'}`} lang={lang} dir={lang === 'ur' ? 'rtl' : 'ltr'}>{DICT[s.tk][lang]}</DialogTitle>
          </div>
        </div>
        <div className="px-4 py-5 space-y-4">
          <div key={i} className="dk-rise">
            <DialogDescription className={`text-base text-foreground ${lang === 'ur' ? 'font-urdu' : ''}`} lang={lang} dir={lang === 'ur' ? 'rtl' : 'ltr'}>{DICT[s.body][lang]}</DialogDescription>
          </div>
          <div className="flex justify-center gap-1.5" role="img" aria-label={label('intro_progress', { n: i + 1, total: SLIDES.length })}>
            {SLIDES.map((_, j) => <span key={j} className={`h-1.5 rounded-full transition-all ${j === i ? 'w-6 bg-primary' : 'w-1.5 bg-border'}`} />)}
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={dismiss} className="min-h-[48px] px-4 rounded-lg text-sm font-bold text-muted-foreground hover:bg-muted" data-testid="btn-intro-skip">{label('intro_skip')}</button>
            <button type="button" onClick={() => (last ? dismiss() : setI(i + 1))} className="flex-1 min-h-[48px] rounded-lg bg-primary text-primary-foreground font-bold flex items-center justify-center gap-2" data-testid="btn-intro-next">
              {last ? label('intro_start') : label('intro_next')} <ArrowRight size={16} aria-hidden className="rtl:rotate-180" />
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
