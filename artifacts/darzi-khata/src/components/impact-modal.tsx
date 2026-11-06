import { entry } from '../lib/i18n';
import { usePreferences } from '../hooks/use-preferences';
import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from './page-dialog';
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
    { ...entry('d_orders_recorded'), v: p.totalOrders.toLocaleString() },
    { ...entry('d_customers_served'), v: p.customers.toLocaleString() },
    { ...entry('d_karigars_engaged'), v: p.karigars.toLocaleString() },
    { ...entry('d_revenue_recorded'), v: pkr(p.totalRevenue) },
    { ...entry('d_collected'), v: pkr(p.collected) },
    { ...entry('d_digital_share_all_time'), v: `${all.digitalPercent.toFixed(1)}%` },
    { ...entry('d_on_time_delivery'), v: p.observedDeliveries ? `${p.onTimePercent.toFixed(1)}%` : label('no_dated_deliveries') },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg w-[calc(100%-1rem)] p-0 overflow-hidden rounded-lg gap-0 max-h-[92dvh] flex flex-col">
        <div className="bg-accent text-primary px-5 py-4 shrink-0">
          <DialogTitle className="text-lg font-bold">{label('financial_inclusion_impact')}</DialogTitle>
          <DialogDescription className="text-primary text-sm">{shopTypeLabel(settings.shopType)}{demoMode && ` · ${label('demo_data')}`}</DialogDescription>
        </div>
        <div className="overflow-y-auto p-5 space-y-5">
          <div className="grid grid-cols-2 gap-2">
            {metrics.map((m, i) => (
              <div key={m.en} className="rounded-lg border border-border bg-card p-3 dk-rise" style={{ animationDelay: `${i * 50}ms` }} data-testid={`metric-${i}`}>
                <div className="text-xs text-muted-foreground leading-tight">{label(m.tk)}</div>
                <div className="text-lg font-bold mt-0.5 font-mono">{m.v}</div>
              </div>
            ))}
          </div>
          {settings.shopType === 'women-home-tailor' && (
            <p className="text-sm rounded-lg bg-primary-soft  p-3">{label('woman_led_home_business_each_recorded_or')}</p>
          )}
          <section>
            <h3 className="text-sm font-bold">{label('digital_vs_cash_collections')}</h3>
            <p className="text-xs text-muted-foreground mb-2">{label('by_payment_date')} · {range} · PKR</p>
            {all.total === 0 ? (
              <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">{label('no_payments_recorded_yet')}</div>
            ) : (
              <div className="h-52" role="img" aria-label={`Monthly collections ${range}: ${months.map((m) => `${m.label} cash ${pkr(m.cash)}, digital ${pkr(m.digital)}`).join('; ')}`}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={months} margin={{ left: -10, right: 4, top: 4 }}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
                    <Tooltip formatter={(v: number) => pkr(v)} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="cash" stackId="a" name={label('cash')} fill="hsl(38 80% 55%)" />
                    <Bar dataKey="digital" stackId="a" name={label('digital')} fill="hsl(160 84% 25%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
            <table className="w-full text-sm mt-3">
              <thead><tr className="text-muted-foreground text-start"><th className="py-1 font-semibold">{label('month')}</th><th className="text-end font-semibold">{label('cash')}</th><th className="text-end font-semibold">{label('digital')}</th><th className="text-end font-semibold">{label('digital_2')}</th></tr></thead>
              <tbody>{months.map((m) => (
                <tr key={m.label} className="border-t border-border"><td className="py-1.5">{m.label}</td><td className="text-right font-mono">{pkr(m.cash)}</td><td className="text-right font-mono">{pkr(m.digital)}</td><td className="text-right font-mono font-bold">{m.total ? `${m.pct.toFixed(1)}%` : '—'}</td></tr>
              ))}</tbody>
            </table>
          </section>
          <p className="text-xs text-muted-foreground">{label('computed_on_this_phone_from_your_own_rec')}</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
