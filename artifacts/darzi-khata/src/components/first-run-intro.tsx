import { entry, DICT } from '../lib/i18n';
import { usePreferences } from '../hooks/use-preferences';
import { useEffect, useState, type ReactNode } from 'react';
import { NotebookPen, Wallet, TrendingUp, ArrowRight } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { useAuthContext } from '../context/auth-context';

const SLIDES = [
  { icon: NotebookPen, ...entry('d_record_every_order'), body: 'intro_body_1' as const },
  { icon: Wallet, ...entry('d_get_paid_cash_or_digital'), body: 'intro_body_2' as const },
  { icon: TrendingUp, ...entry('d_build_a_credit_record'), body: 'intro_body_3' as const },
];

export function FirstRunIntro(): ReactNode {
  const { currentUser, userId } = useAuthContext();
  const key = `darzi-khata-intro-seen-${userId}`;
  const [open, setOpen] = useState(false);
  const [i, setI] = useState(0);
  const { label, lang } = usePreferences();

  useEffect(() => {
    if (!currentUser) { setOpen(false); return; }
    try { setOpen(!localStorage.getItem(key)); } catch { setOpen(false); }
    setI(0);
  }, [currentUser, key]);

  const dismiss = () => { try { localStorage.setItem(key, new Date().toISOString()); } catch { /* ignore */ } setOpen(false); };
  if (!currentUser) return null;
  const s = SLIDES[i]; const Icon = s.icon; const last = i === SLIDES.length - 1;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) dismiss(); }}>
      <DialogContent className="max-w-sm w-[calc(100%-1.5rem)] p-0 overflow-hidden rounded-lg gap-0 [&>button]:hidden">
        <div className="bg-primary text-primary-foreground px-6 pt-8 pb-6 relative">
          <div className="dk-stitch absolute left-0 right-0 bottom-0 opacity-80" />
          <div key={i} className="dk-rise">
            <div className="h-14 w-14 rounded-lg bg-accent text-primary flex items-center justify-center mb-4"><Icon size={28} aria-hidden /></div>
            <DialogTitle className={`text-2xl font-bold ${lang === 'ur' ? 'font-urdu' : 'leading-tight'}`} lang={lang} dir={lang === 'ur' ? 'rtl' : 'ltr'}>{DICT[s.tk][lang]}</DialogTitle>
          </div>
        </div>
        <div className="px-6 py-5 space-y-4">
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
