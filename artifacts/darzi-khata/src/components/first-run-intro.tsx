import { useEffect, useState, type ReactNode } from 'react';
import { NotebookPen, Wallet, TrendingUp, ArrowRight } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { useAuthContext } from '../context/auth-context';

const SLIDES = [
  { icon: NotebookPen, en: 'Record every order', ur: 'ہر آرڈر لکھیں', body: 'Naap, kapra, delivery date. Your khata lives on this phone.', bodyUr: 'ناپ، کپڑا اور ترسیل کی تاریخ، سب ایک جگہ' },
  { icon: Wallet, en: 'Get paid, cash or digital', ur: 'نقد یا ڈیجیٹل وصولی', body: 'Log each payment with its method. Send WhatsApp reminders for balances.', bodyUr: 'ہر ادائیگی کا طریقہ لکھیں اور بقایا کی یاد دہانی بھیجیں' },
  { icon: TrendingUp, en: 'Build a credit record', ur: 'اپنا مالی ریکارڈ بنائیں', body: 'Steady records turn into a business profile you can show a lender.', bodyUr: 'باقاعدہ ریکارڈ سے کاروباری پروفائل بنتی ہے' },
];

export function FirstRunIntro(): ReactNode {
  const { currentUser, userId } = useAuthContext();
  const key = `darzi-khata-intro-seen-${userId}`;
  const [open, setOpen] = useState(false);
  const [i, setI] = useState(0);

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
      <DialogContent className="max-w-sm w-[calc(100%-1.5rem)] p-0 overflow-hidden rounded-3xl gap-0 [&>button]:hidden">
        <div className="bg-emerald-800 text-white px-6 pt-8 pb-6 relative">
          <div className="dk-stitch absolute left-0 right-0 bottom-0 opacity-80" />
          <div key={i} className="dk-rise">
            <div className="h-14 w-14 rounded-2xl bg-amber-500 text-emerald-950 flex items-center justify-center mb-4"><Icon size={28} /></div>
            <DialogTitle className="text-2xl font-black leading-tight">{s.en}</DialogTitle>
            <p className="font-urdu text-xl text-amber-200 mt-2 leading-loose" dir="rtl">{s.ur}</p>
          </div>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div key={i} className="dk-rise">
            <DialogDescription className="text-sm text-foreground">{s.body}</DialogDescription>
            <p className="font-urdu text-sm text-muted-foreground mt-2 leading-loose" dir="rtl">{s.bodyUr}</p>
          </div>
          <div className="flex justify-center gap-1.5" aria-label={`Step ${i + 1} of 3`}>
            {SLIDES.map((_, j) => <span key={j} className={`h-1.5 rounded-full transition-all ${j === i ? 'w-6 bg-emerald-700' : 'w-1.5 bg-border'}`} />)}
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={dismiss} className="min-h-[48px] px-4 rounded-xl text-sm font-bold text-muted-foreground hover:bg-muted" data-testid="btn-intro-skip">Skip / چھوڑیں</button>
            <button type="button" onClick={() => (last ? dismiss() : setI(i + 1))} className="flex-1 min-h-[48px] rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold flex items-center justify-center gap-2" data-testid="btn-intro-next">
              {last ? 'Start / شروع کریں' : 'Next / آگے'} <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
