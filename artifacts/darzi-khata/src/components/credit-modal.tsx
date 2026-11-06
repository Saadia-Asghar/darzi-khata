import { usePreferences } from '../hooks/use-preferences';
import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { ShieldCheck, Info, Printer, ArrowLeft, Lock, FileText } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Order } from '../types/order';
import { computeCreditScore, type CreditProfile } from '../lib/credit-score';
import { useSettings } from '../hooks/use-settings';
import { useDemoMode } from '../hooks/use-demo-mode';
import { shopTypeLabel, pkr, monthLabel } from './shop-type';

interface Props { open: boolean; onOpenChange: (o: boolean) => void; orders: Order[] }
type View = 'score' | 'consent' | 'profile';

export function CreditModal({ open, onOpenChange, orders }: Props) {
  const p = useMemo(() => computeCreditScore(orders), [orders]);
  const { label } = usePreferences();
  const { settings } = useSettings();
  const { demoMode } = useDemoMode();
  const [view, setView] = useState<View>('score');
  const [agree, setAgree] = useState(false);
  const generatedAt = useMemo(() => new Date(), [view]); // eslint-disable-line react-hooks/exhaustive-deps

  const close = (o: boolean) => { onOpenChange(o); if (!o) { setView('score'); setAgree(false); } };
  const print = () => {
    document.body.classList.add('dk-printing');
    const done = () => { document.body.classList.remove('dk-printing'); window.removeEventListener('afterprint', done); };
    window.addEventListener('afterprint', done);
    window.print();
    setTimeout(done, 1500);
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-w-lg w-[calc(100%-1rem)] p-0 overflow-hidden rounded-2xl gap-0 max-h-[92dvh] flex flex-col">
        <div className="bg-emerald-900 text-white px-5 py-4 shrink-0">
          <div className="flex items-center gap-2">
            {view !== 'score' && <button onClick={() => setView(view === 'profile' ? 'consent' : 'score')} className="-ml-2 h-11 w-11 flex items-center justify-center rounded-full hover:bg-emerald-800" aria-label={label('Back', 'واپس')}><ArrowLeft size={18} className="rtl:rotate-180" aria-hidden /></button>}
            <div>
              <DialogTitle className="text-lg font-black">{view === 'score' ? label('Business credit score', 'کاروباری کریڈٹ اسکور') : view === 'consent' ? label('Share consent', 'اجازت نامہ') : label('Business profile', 'کاروباری پروفائل')}</DialogTitle>
              <DialogDescription className="text-emerald-200 text-xs">{label('On-device estimate', 'فون پر حساب')}{demoMode && ` · ${label('Demo data', 'ڈیمو ڈیٹا')}`}</DialogDescription>
            </div>
          </div>
        </div>
        <div className="overflow-y-auto p-5 space-y-5">
          {view === 'score' && <ScoreView p={p} onApply={() => setView('consent')} />}
          {view === 'consent' && (
            <div className="space-y-4 dk-rise">
              <p className="text-sm">{label('Only this summary goes into the profile.', 'صرف یہ خلاصہ شامل ہوگا')}</p>
              <ul className="rounded-xl border border-border divide-y divide-border text-sm">
                {[
                  [label('Shop name & type', 'دکان کا نام و قسم'), `${settings.shopName} · ${shopTypeLabel(settings.shopType)}`],
                  [label('Months active', 'مہینے'), String(p.monthsActive)],
                  [label('Monthly revenue series', 'ماہانہ آمدن'), label(`${p.monthly.length} months`, `${p.monthly.length} مہینے`)],
                  [label('Order count', 'آرڈر'), String(p.totalOrders)],
                  [label('On-time & collection %', 'بروقت و وصولی'), `${p.onTimePercent.toFixed(1)}% · ${p.collectionPercent.toFixed(1)}%`],
                  [label('Score', 'اسکور'), String(p.score)],
                ].map(([k, v]) => <li key={k} className="flex justify-between gap-3 px-3 py-2.5"><span className="text-muted-foreground">{k}</span><b className="text-end">{v}</b></li>)}
              </ul>
              <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 p-3 text-xs flex gap-2">
                <Lock size={16} className="shrink-0 text-emerald-700 mt-0.5" />
                <span className="leading-relaxed">{label('Never included: customer names, phone numbers, measurements. Nothing is sent anywhere. This creates a printable page on your phone only; you decide whom to show.', 'گاہکوں کے نام، نمبر اور ناپ شامل نہیں۔ کچھ بھی کہیں نہیں بھیجا جاتا۔ صرف آپ کے فون پر پرنٹ ہونے والا صفحہ بنتا ہے')}</span>
              </div>
              <label className="flex items-start gap-3 min-h-[44px] cursor-pointer">
                <Checkbox checked={agree} onCheckedChange={(c) => setAgree(c === true)} className="mt-1 h-5 w-5" data-testid="checkbox-consent" />
                <span className="text-sm">{label('I agree to create this business profile.', 'میں پروفائل بنانے پر رضامند ہوں')}</span>
              </label>
              <button disabled={!agree} onClick={() => setView('profile')} className="w-full min-h-[48px] rounded-xl bg-emerald-700 disabled:opacity-40 text-white font-bold flex items-center justify-center gap-2" data-testid="btn-create-profile"><FileText size={16} aria-hidden /> {label('Create profile', 'پروفائل بنائیں')}</button>
            </div>
          )}
          {view === 'profile' && (
            <div className="space-y-4 dk-rise">
              <div className="rounded-xl border border-border bg-[#fdfbf7] dark:bg-card p-4"><ProfileSheet p={p} shopName={settings.shopName} shopType={settings.shopType} at={generatedAt} demo={demoMode} /></div>
              <p className="text-xs text-muted-foreground">{label('Not submitted to Zindigi or any lender. Future integration would send only this summary after your consent.', 'زندگی یا کسی قرض دینے والے کو جمع نہیں کرایا گیا')}</p>
              <button onClick={print} className="w-full min-h-[48px] rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold flex items-center justify-center gap-2" data-testid="btn-print-profile"><Printer size={16} aria-hidden /> {label('Print / save PDF', 'پرنٹ / PDF محفوظ کریں')}</button>
            </div>
          )}
        </div>
        {view === 'profile' && createPortal(
          <div id="dk-print-root"><ProfileSheet p={p} shopName={settings.shopName} shopType={settings.shopType} at={generatedAt} demo={demoMode} print /></div>,
          document.body,
        )}
      </DialogContent>
    </Dialog>
  );
}

function Gauge({ score }: { score: number }) {
  const r = 80, c = Math.PI * r, off = c * (1 - score / 100);
  const color = score < 40 ? '#b45309' : score < 70 ? '#d97706' : '#047857';
  return (
    <svg viewBox="0 0 200 116" className="w-full max-w-[240px] mx-auto" role="img" aria-label={`Score ${score} of 100`}>
      <path d="M20 100 A80 80 0 0 1 180 100" fill="none" stroke="hsl(var(--muted))" strokeWidth="16" strokeLinecap="round" />
      <path d="M20 100 A80 80 0 0 1 180 100" fill="none" stroke={color} strokeWidth="16" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off} style={{ transition: 'stroke-dashoffset 900ms cubic-bezier(.2,.7,.2,1)' }} />
      <text x="100" y="92" textAnchor="middle" className="fill-foreground" style={{ fontSize: 40, fontWeight: 900 }}>{score}</text>
      <text x="100" y="112" textAnchor="middle" className="fill-muted-foreground" style={{ fontSize: 10 }}>/ 100</text>
    </svg>
  );
}

function ScoreView({ p, onApply }: { p: CreditProfile; onApply: () => void }) {
  const { label } = usePreferences();
  return (
    <div className="space-y-5">
      <div className="text-center dk-rise">
        <Gauge score={p.score} />
        <div className="inline-block mt-1 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-900 dark:text-amber-200 text-sm font-bold" data-testid="text-credit-band">{p.band}</div>
        <div className="flex justify-center gap-3 mt-3 text-[11px] text-muted-foreground">
          <span>0–39 {label('Starter', 'بنیادی')}</span><span>40–69 {label('Growing', 'ترقی پذیر')}</span><span>70+ {label('Trusted', 'قابلِ اعتماد')}</span>
        </div>
      </div>
      {!p.enoughData && (
        <div className="rounded-xl border border-dashed border-amber-400 bg-amber-50 dark:bg-amber-900/10 p-4 text-sm" data-testid="credit-empty">
          <b>{label('Not enough data yet', 'ابھی ریکارڈ کم ہے')}</b>
          <p className="text-muted-foreground mt-1">{label(`Needs at least 5 orders across 2 months. You have ${p.totalOrders} orders in ${p.monthsActive} month(s).`, `کم از کم 5 آرڈر اور 2 مہینے درکار۔ آپ کے ${p.totalOrders} آرڈر، ${p.monthsActive} مہینے`)}</p>
        </div>
      )}
      <section>
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">{label('Six factors', 'چھ عوامل')}</h3>
        <ul className="space-y-3">
          {p.factors.map((f) => (
            <li key={f.key} className="rounded-xl border border-border p-3 bg-card">
              <div className="flex justify-between text-sm gap-2"><span className="font-semibold">{f.label}</span><span className="font-mono font-bold shrink-0">{Math.round(f.score)}<span className="text-muted-foreground font-normal text-xs"> · {f.weight}%</span></span></div>
              <div className="h-2 rounded-full bg-muted mt-2 overflow-hidden" role="progressbar" aria-valuenow={Math.round(f.score)} aria-valuemin={0} aria-valuemax={100} aria-label={f.label}>
                <div className="h-full bg-emerald-600 rounded-full origin-left transition-transform duration-700" style={{ transform: `scaleX(${f.score / 100})` }} />
              </div>
              <p className="text-[11px] text-muted-foreground mt-1.5">{label('Tip', 'مشورہ')}: {f.tip}</p>
              {f.key === 'delivery' && <p className="text-[11px] text-muted-foreground mt-1">{label(`Based on ${p.observedDeliveries} deliveries with a recorded date`, `${p.observedDeliveries} ریکارڈ شدہ ترسیل پر مبنی`)}</p>}
            </li>
          ))}
        </ul>
      </section>
      <section className="rounded-2xl bg-emerald-900 text-white p-4">
        <div className="text-xs text-emerald-200">{label('Illustrative loan estimate', 'اندازاً قرض')}</div>
        <div className="text-3xl font-black mt-1" data-testid="text-loan-estimate">{p.enoughData ? pkr(p.eligibleLoan) : '—'}</div>
        <p className="text-[11px] text-emerald-200 mt-1">{label('Avg monthly revenue', 'اوسط ماہانہ آمدن')} {pkr(p.averageMonthlyRevenue)} · 1.5 × revenue × score%, capped at Rs 300,000</p>
        <p className="text-[11px] text-amber-200 mt-2 flex gap-1.5"><Info size={13} className="shrink-0 mt-0.5" aria-hidden />{label('Not a loan offer or bank decision. Lenders use their own checks.', 'یہ قرض کی پیشکش یا بینک کا فیصلہ نہیں')}</p>
        <button onClick={onApply} disabled={!p.enoughData} className="mt-3 w-full min-h-[48px] rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-emerald-950 font-black flex items-center justify-center gap-2" data-testid="btn-apply-zindigi">
          <ShieldCheck size={18} aria-hidden /> {label('Apply via Zindigi', 'زندگی کے ذریعے درخواست')}
        </button>
      </section>
    </div>
  );
}

function ProfileSheet({ p, shopName, shopType, at, demo, print }: { p: CreditProfile; shopName: string; shopType?: Parameters<typeof shopTypeLabel>[0]; at: Date; demo: boolean; print?: boolean }) {
  const data = p.monthly.map((m) => ({ ...m, label: monthLabel(m.month) }));
  const max = Math.max(1, ...data.map((d) => d.revenue));
  return (
    <article className={print ? 'text-[12pt] text-black p-2' : 'text-sm'} style={print ? { fontFamily: 'Georgia, serif' } : undefined}>
      <header className="border-b-2 border-emerald-800 pb-2 mb-3">
        <div className="text-[10px] uppercase tracking-[0.2em] text-emerald-800">Darzi Khata · Business profile / کاروباری پروفائل</div>
        <h2 className="text-2xl font-black text-emerald-950 dark:text-foreground">{shopName}</h2>
        <div className="text-xs">{shopTypeLabel(shopType)} · Generated {at.toLocaleDateString('en-PK')}</div>
        {demo && <div className="mt-1 text-xs font-bold text-red-700">DEMO DATA — not a real business record</div>}
      </header>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs mb-4">
        <dt>Score / اسکور</dt><dd className="font-bold">{p.score} ({p.band})</dd>
        <dt>Months active / مہینے</dt><dd className="font-bold">{p.monthsActive}</dd>
        <dt>Orders / آرڈر</dt><dd className="font-bold">{p.totalOrders}</dd>
        <dt>On-time delivery / بروقت</dt><dd className="font-bold">{p.onTimePercent.toFixed(1)}%</dd>
        <dt>Collection rate / وصولی</dt><dd className="font-bold">{p.collectionPercent.toFixed(1)}%</dd>
        <dt>Avg monthly revenue / اوسط آمدن</dt><dd className="font-bold">{pkr(p.averageMonthlyRevenue)}</dd>
      </dl>
      <h3 className="text-xs font-bold mb-2">Monthly revenue, last {data.length} months (PKR) / ماہانہ آمدن</h3>
      {print ? (
        <table className="w-full text-xs border-collapse" aria-label="Monthly revenue">
          <tbody>{data.map((d) => (
            <tr key={d.month}><td className="py-1 pr-2 w-16">{d.label}</td><td className="py-1"><div style={{ width: `${(d.revenue / max) * 100}%`, height: 10, background: '#065f46', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }} /></td><td className="py-1 pl-2 text-right w-24">{pkr(d.revenue)}</td><td className="pl-2 w-16 text-right">{d.orders} ord</td></tr>
          ))}</tbody>
        </table>
      ) : (
        <div className="h-44" role="img" aria-label={`Monthly revenue: ${data.map((d) => `${d.label} ${pkr(d.revenue)}`).join(', ')}`}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ left: -10, right: 4, top: 4, bottom: 0 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
              <Tooltip formatter={(v: number) => pkr(v)} />
              <Bar dataKey="revenue" name="Revenue PKR" fill="hsl(160 84% 25%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      <footer className="mt-4 pt-2 border-t text-[10px] leading-snug">
        Self-reported records from the Darzi Khata app, computed on device. Excludes customer names, phone numbers and measurements. Illustrative score, not a credit-bureau rating. Not submitted to any institution.
      </footer>
    </article>
  );
}
