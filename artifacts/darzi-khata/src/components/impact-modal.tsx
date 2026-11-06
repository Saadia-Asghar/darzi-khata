import { usePreferences } from '../hooks/use-preferences';
import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Order } from '../types/order';
import { computeCreditScore } from '../lib/credit-score';
import { paymentShare } from '../lib/payments';
import { useSettings } from '../hooks/use-settings';
import { useDemoMode } from '../hooks/use-demo-mode';
import { pkr, shopTypeLabel } from './shop-type';

interface Props { open: boolean; onOpenChange: (o: boolean) => void; orders: Order[] }

export function ImpactModal({ open, onOpenChange, orders }: Props) {
  const { label } = usePreferences();
  const { settings } = useSettings();
  const { demoMode } = useDemoMode();
  const p = useMemo(() => computeCreditScore(orders), [orders]);
  const months = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
      const s = paymentShare(orders, d);
      return { label: d.toLocaleDateString('en-PK', { month: 'short', year: '2-digit' }), cash: s.cash, digital: s.digital, total: s.total, pct: s.digitalPercent };
    });
  }, [orders]);
  const all = useMemo(() => paymentShare(orders), [orders]);
  const range = `${months[0].label} – ${months[5].label}`;

  const metrics = [
    { en: 'Orders recorded', ur: 'درج آرڈر', v: p.totalOrders.toLocaleString() },
    { en: 'Customers served', ur: 'گاہک', v: p.customers.toLocaleString() },
    { en: 'Karigars engaged', ur: 'کاریگر', v: p.karigars.toLocaleString() },
    { en: 'Revenue recorded', ur: 'کل آمدن', v: pkr(p.totalRevenue) },
    { en: 'Collected', ur: 'وصول', v: pkr(p.collected) },
    { en: 'Digital share (all time)', ur: 'ڈیجیٹل حصہ', v: `${all.digitalPercent.toFixed(1)}%` },
    { en: 'On-time delivery', ur: 'بروقت ترسیل', v: p.observedDeliveries ? `${p.onTimePercent.toFixed(1)}%` : label('No dated deliveries', 'تاریخ موجود نہیں') },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg w-[calc(100%-1rem)] p-0 overflow-hidden rounded-2xl gap-0 max-h-[92dvh] flex flex-col">
        <div className="bg-amber-500 text-emerald-950 px-5 py-4 shrink-0">
          <DialogTitle className="text-lg font-black">{label('Financial inclusion impact', 'مالی شمولیت کا اثر')}</DialogTitle>
          <DialogDescription className="text-emerald-900 text-xs">{shopTypeLabel(settings.shopType)}{demoMode && ` · ${label('Demo data', 'ڈیمو ڈیٹا')}`}</DialogDescription>
        </div>
        <div className="overflow-y-auto p-5 space-y-5">
          <div className="grid grid-cols-2 gap-2">
            {metrics.map((m, i) => (
              <div key={m.en} className="rounded-xl border border-border bg-card p-3 dk-rise" style={{ animationDelay: `${i * 50}ms` }} data-testid={`metric-${i}`}>
                <div className="text-[11px] text-muted-foreground leading-tight">{label(m.en, m.ur)}</div>
                <div className="text-lg font-black mt-0.5 font-mono">{m.v}</div>
              </div>
            ))}
          </div>
          {settings.shopType === 'women-home-tailor' && (
            <p className="text-xs rounded-lg bg-emerald-50 dark:bg-emerald-900/20 p-3">{label('Woman-led home business: each recorded order adds to a documented income history.', 'خاتون کا گھریلو کاروبار: ہر آرڈر آمدن کا ریکارڈ بناتا ہے')}</p>
          )}
          <section>
            <h3 className="text-sm font-bold">{label('Digital vs cash collections', 'ڈیجیٹل بمقابلہ نقد')}</h3>
            <p className="text-[11px] text-muted-foreground mb-2">{label('By payment date', 'ادائیگی کی تاریخ')} · {range} · PKR</p>
            {all.total === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">{label('No payments recorded yet.', 'ابھی کوئی ادائیگی درج نہیں')}</div>
            ) : (
              <div className="h-52" role="img" aria-label={`Monthly collections ${range}: ${months.map((m) => `${m.label} cash ${pkr(m.cash)}, digital ${pkr(m.digital)}`).join('; ')}`}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={months} margin={{ left: -10, right: 4, top: 4 }}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
                    <Tooltip formatter={(v: number) => pkr(v)} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="cash" stackId="a" name={label('Cash', 'نقد')} fill="hsl(38 80% 55%)" />
                    <Bar dataKey="digital" stackId="a" name={label('Digital', 'ڈیجیٹل')} fill="hsl(160 84% 25%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
            <table className="w-full text-xs mt-3">
              <thead><tr className="text-muted-foreground text-start"><th className="py-1 font-semibold">{label('Month', 'ماہ')}</th><th className="text-end font-semibold">{label('Cash', 'نقد')}</th><th className="text-end font-semibold">{label('Digital', 'ڈیجیٹل')}</th><th className="text-end font-semibold">{label('Digital %', 'شرح')}</th></tr></thead>
              <tbody>{months.map((m) => (
                <tr key={m.label} className="border-t border-border"><td className="py-1.5">{m.label}</td><td className="text-right font-mono">{pkr(m.cash)}</td><td className="text-right font-mono">{pkr(m.digital)}</td><td className="text-right font-mono font-bold">{m.total ? `${m.pct.toFixed(1)}%` : '—'}</td></tr>
              ))}</tbody>
            </table>
          </section>
          <p className="text-[11px] text-muted-foreground">{label('Computed on this phone from your own records. Older orders without a payment ledger count as cash.', 'آپ کے ریکارڈ سے اسی فون پر حساب۔ پرانے آرڈر نقد شمار')}</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
