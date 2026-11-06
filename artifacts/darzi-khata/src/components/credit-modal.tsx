import { tl } from '../lib/i18n';
import { usePreferences } from '../hooks/use-preferences';
import { useMemo, useState } from 'react';
import { printElement } from '../lib/print';
import { ShieldCheck, Info, Printer, ArrowLeft, Lock, FileText } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from './page-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Order } from '../types/order';
import { computeCreditScore, type CreditProfile } from '../lib/credit-score';
import { useSettings } from '../hooks/use-settings';
import { useDemoMode } from '../hooks/use-demo-mode';
import { shopTypeLabel, pkr, monthLabel } from './shop-type';

interface Props { open: boolean; onOpenChange: (o: boolean) => void; orders: Order[] }
type View = 'score' | 'consent' | 'profile';

export function CreditModal({ open, onOpenChange, orders }: Props) {
  const { label, lang } = usePreferences();
  const { settings } = useSettings();
  const p = useMemo(() => computeCreditScore(orders, new Date(), settings.expenses), [orders, lang, settings.expenses]);
  const { demoMode } = useDemoMode();
  const [view, setView] = useState<View>('score');
  const [agree, setAgree] = useState(false);
  const generatedAt = useMemo(() => new Date(), [view]); // eslint-disable-line react-hooks/exhaustive-deps

  const close = (o: boolean) => { onOpenChange(o); if (!o) { setView('score'); setAgree(false); } };
  const print = () => {
    void printElement(document.getElementById('credit-profile-sheet'), { paper: 'a4' });
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-w-lg w-[calc(100%-1rem)] p-0 overflow-hidden rounded-lg gap-0 max-h-[92dvh] flex flex-col">
        <div className="bg-card text-foreground border-border px-5 py-4 shrink-0">
          <div className="flex items-center gap-2">
            {view !== 'score' && <button onClick={() => setView(view === 'profile' ? 'consent' : 'score')} className="-ml-2 h-11 w-11 flex items-center justify-center rounded-full hover:bg-muted" aria-label={label('back_x')}><ArrowLeft size={18} className="rtl:rotate-180" aria-hidden /></button>}
            <div>
              <DialogTitle className="text-lg font-bold">{view === 'score' ? label('business_credit_score') : view === 'consent' ? label('share_consent') : label('business_profile')}</DialogTitle>
              <DialogDescription className="text-muted-foreground text-sm">{label('on_device_estimate')}{demoMode && ` · ${label('demo_data')}`}</DialogDescription>
            </div>
          </div>
        </div>
        <div className="overflow-y-auto p-5 space-y-5">
          {view === 'score' && <ScoreView p={p} onApply={() => setView('consent')} />}
          {view === 'consent' && (
            <div className="space-y-4 dk-rise">
              <p className="text-sm">{label('only_this_summary_goes_into_the_profile')}</p>
              <ul className="rounded-lg border border-border divide-y divide-border text-sm">
                {[
                  [label('shop_name_type'), `${settings.shopName} · ${shopTypeLabel(settings.shopType)}`],
                  [label('months_active'), String(p.monthsActive)],
                  [label('monthly_revenue_series'), label('t_n_months', { monthlyCount: p.monthly.length })],
                  [label('order_count'), String(p.totalOrders)],
                  [label('on_time_collection'), `${p.onTimePercent.toFixed(1)}% · ${p.collectionPercent.toFixed(1)}%`],
                  [label('score'), String(p.score)],
                ].map(([k, v]) => <li key={k} className="flex justify-between gap-3 px-3 py-2.5"><span className="text-muted-foreground">{k}</span><b className="text-end">{v}</b></li>)}
              </ul>
              <div className="rounded-lg bg-primary-soft  border border-border  p-3 text-sm flex gap-2">
                <Lock size={16} className="shrink-0 text-primary mt-0.5" />
                <span className="leading-relaxed">{label('never_included_customer_names_phone_numb')}</span>
              </div>
              <label className="flex items-start gap-3 min-h-[44px] cursor-pointer">
                <Checkbox checked={agree} onCheckedChange={(c) => setAgree(c === true)} className="mt-1 h-5 w-5" data-testid="checkbox-consent" />
                <span className="text-sm">{label('i_agree_to_create_this_business_profile')}</span>
              </label>
              <button disabled={!agree} onClick={() => setView('profile')} className="w-full min-h-[48px] rounded-lg bg-primary disabled:opacity-40 text-primary-foreground font-bold flex items-center justify-center gap-2" data-testid="btn-create-profile"><FileText size={16} aria-hidden /> {label('create_profile')}</button>
            </div>
          )}
          {view === 'profile' && (
            <div className="space-y-4 dk-rise">
              <div id="credit-profile-sheet" className="rounded-lg border border-border bg-card dark:bg-card p-4"><ProfileSheet p={p} shopName={settings.shopName} shopType={settings.shopType} at={generatedAt} demo={demoMode} /></div>
              <p className="text-sm text-muted-foreground">{label('not_submitted_to_zindigi_or_any_lender_f')}</p>
              <button onClick={print} className="w-full min-h-[48px] rounded-lg bg-accent hover:bg-warning text-accent-foreground font-bold flex items-center justify-center gap-2" data-testid="btn-print-profile"><Printer size={16} aria-hidden /> {label('print_save_pdf')}</button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Gauge({ score }: { score: number }) {
  const r = 80, c = Math.PI * r, off = c * (1 - score / 100);
  const color = score < 40 ? 'hsl(var(--warning))' : score < 70 ? 'hsl(var(--accent))' : 'hsl(var(--primary))';
  return (
    <svg viewBox="0 0 200 116" className="w-full max-w-[240px] mx-auto" role="img" aria-label={`Score ${score} of 100`}>
      <path d="M20 100 A80 80 0 0 1 180 100" fill="none" stroke="hsl(var(--muted))" strokeWidth="16" strokeLinecap="round" />
      <path d="M20 100 A80 80 0 0 1 180 100" fill="none" stroke={color} strokeWidth="16" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off} style={{ transition: 'stroke-dashoffset 200ms ease-out' }} />
      <text x="100" y="92" textAnchor="middle" className="fill-foreground" style={{ fontSize: 40, fontWeight: 700 }}>{score}</text>
      <text x="100" y="112" textAnchor="middle" className="fill-muted-foreground" style={{ fontSize: 12 }}>{tl('score_scale')}</text>
    </svg>
  );
}

function ScoreView({ p, onApply }: { p: CreditProfile; onApply: () => void }) {
  const { label } = usePreferences();
  return (
    <div className="space-y-5">
      <div className="text-center dk-rise">
        <Gauge score={p.score} />
        <div className="inline-block mt-1 px-3 py-1 rounded-full bg-warning-soft text-warning text-sm font-bold" data-testid="text-credit-band">{p.band}</div>
        <div className="flex justify-center gap-3 mt-3 text-xs text-muted-foreground">
          <span>0–39 {label('starter')}</span><span>40–69 {label('growing')}</span><span>70+ {label('trusted')}</span>
        </div>
      </div>
      {!p.enoughData && (
        <div className="rounded-lg border border-dashed border-warning bg-warning-soft  p-4 text-sm" data-testid="credit-empty">
          <b>{label('not_enough_data_yet')}</b>
          <p className="text-muted-foreground mt-1">{label('t_needs_at_least_5_orders_across_2_months_', { totalOrders: p.totalOrders, monthsActive: p.monthsActive })}</p>
        </div>
      )}
      <section>
        <h3 className="text-sm font-bold   text-muted-foreground mb-2">{label('six_factors')}</h3>
        <ul className="space-y-3">
          {p.factors.map((f) => (
            <li key={f.key} className="rounded-lg border border-border p-3 bg-card">
              <div className="flex flex-col sm:flex-row sm:justify-between text-base gap-2"><span className="font-semibold leading-loose">{f.label}</span><span className="font-mono font-bold shrink-0">{Math.round(f.score)}<span className="text-muted-foreground font-normal text-sm"> · {f.weight}%</span></span></div>
              <div className="h-2 rounded-full bg-muted mt-2 overflow-hidden" role="progressbar" aria-valuenow={Math.round(f.score)} aria-valuemin={0} aria-valuemax={100} aria-label={f.label}>
                <div className="h-full bg-primary rounded-full origin-left transition-transform duration-700" style={{ transform: `scaleX(${f.score / 100})` }} />
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">{label('tip')}: {f.tip}</p>
              {f.key === 'delivery' && <p className="text-xs text-muted-foreground mt-1">{label('t_based_on_n_deliveries_with_a_recorded_da', { observedDeliveries: p.observedDeliveries })}</p>}
            </li>
          ))}
        </ul>
      </section>
      <section className="rounded-lg bg-primary text-primary-foreground p-4">
        <div className="text-sm text-primary-foreground">{label('illustrative_loan_estimate')}</div>
        <div className="text-3xl font-bold mt-1" data-testid="text-loan-estimate">{p.enoughData ? pkr(p.eligibleLoan) : '—'}</div>
        <p className="text-xs text-primary-foreground mt-1">{label('avg_monthly_revenue')} {pkr(p.averageMonthlyRevenue)} · {label('loan_formula')}</p>
        <p className="text-sm text-primary-foreground mt-2 flex gap-1.5"><Info size={20} className="shrink-0 mt-0.5" aria-hidden />{label('not_a_loan_offer_or_bank_decision_lender')}</p>
        <button onClick={onApply} disabled={!p.enoughData} className="mt-3 w-full min-h-[48px] rounded-lg bg-accent hover:bg-accent disabled:opacity-40 text-accent-foreground font-bold flex items-center justify-center gap-2" data-testid="btn-apply-zindigi">
          <ShieldCheck size={18} aria-hidden /> {label('apply_via_zindigi')}
        </button>
      </section>
    </div>
  );
}

function ProfileSheet({ p, shopName, shopType, at, demo, print }: { p: CreditProfile; shopName: string; shopType?: Parameters<typeof shopTypeLabel>[0]; at: Date; demo: boolean; print?: boolean }) {
  const data = p.monthly.map((m) => ({ ...m, label: monthLabel(m.month) }));
  const max = Math.max(1, ...data.map((d) => d.revenue));
  return (
    <article className={print ? 'text-[12pt] text-foreground p-2' : 'text-sm'} style={print ? { fontFamily: 'Georgia, serif' } : undefined}>
      <header className="border-b-2 border-primary pb-2 mb-3">
        <div className="text-xs text-primary">{tl('j_darzi_khata_business_profile')}</div>
        <h2 className="text-2xl font-bold text-primary dark:text-foreground">{shopName}</h2>
        <div className="text-sm">{shopTypeLabel(shopType)} · Generated {at.toLocaleDateString('en-PK')}</div>
        {demo && <div className="mt-1 text-sm font-bold text-danger">{tl('credit_demo_flag')}</div>}
      </header>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm mb-4">
        <dt>{tl('j_score')}</dt><dd className="font-bold">{p.score} ({p.band})</dd>
        <dt>{tl('j_months_active')}</dt><dd className="font-bold">{p.monthsActive}</dd>
        <dt>{tl('j_orders')}</dt><dd className="font-bold">{p.totalOrders}</dd>
        <dt>{tl('j_on_time_delivery')}</dt><dd className="font-bold">{p.onTimePercent.toFixed(1)}%</dd>
        <dt>{tl('j_collection_rate')}</dt><dd className="font-bold">{p.collectionPercent.toFixed(1)}%</dd>
        <dt>{tl('j_avg_monthly_revenue')}</dt><dd className="font-bold">{pkr(p.averageMonthlyRevenue)}</dd>
      </dl>
      <h3 className="text-sm font-bold mb-2">{tl('credit_monthly_last_n', { count: data.length })}</h3>
      {print ? (
        <table className="w-full text-sm border-collapse" aria-label={tl('credit_monthly_revenue')}>
          <tbody>{data.map((d) => (
            <tr key={d.month}><td className="py-1 pr-2 w-16">{d.label}</td><td className="py-1"><div style={{ width: `${(d.revenue / max) * 100}%`, height: 10, background: 'hsl(var(--primary))', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }} /></td><td className="py-1 pl-2 text-right w-24">{pkr(d.revenue)}</td><td className="pl-2 w-16 text-right">{d.orders} ord</td></tr>
          ))}</tbody>
        </table>
      ) : (
        <div className="h-44" role="img" aria-label={`Monthly revenue: ${data.map((d) => `${d.label} ${pkr(d.revenue)}`).join(', ')}`}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ left: -10, right: 4, top: 4, bottom: 0 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
              <Tooltip formatter={(v: number) => pkr(v)} />
              <Bar dataKey="revenue" name="Revenue PKR" fill="hsl(160 84% 25%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      <footer className="mt-4 pt-2 border-t text-xs leading-snug">
        Self-reported records from the Darzi Khata app, computed on device. Excludes customer names, phone numbers and measurements. Illustrative score, not a credit-bureau rating. Not submitted to any institution.
      </footer>
    </article>
  );
}
