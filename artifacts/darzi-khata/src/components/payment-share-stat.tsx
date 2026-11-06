import { money, tl, getCurrentLang } from '../lib/i18n';
import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { ChartContainer } from './ui/chart';
import { paymentShare } from '../lib/payments';
import type { Order } from '../types/order';

export function PaymentShareStat({ orders }: { orders: Order[] }) {
  const share = useMemo(() => paymentShare(orders, new Date()), [orders]);
  const month = new Date().toLocaleDateString(getCurrentLang() === 'ur' ? 'ur-PK' : 'en-PK', { month: 'long', year: 'numeric' });
  return (
    <section className="rounded-lg border border-border bg-card p-3 mb-4" aria-label={tl('m_digital_vs_cash_this_month')}>
      <div className="flex items-start justify-between gap-3 text-sm">
        <div><h2 className="font-bold">{tl('j_digital_vs_cash')}</h2><p className="text-muted-foreground mt-1">{month} · PKR · {tl('j_by_payment_date')}</p></div>
        <b className="text-primary  shrink-0">{share.digitalPercent.toFixed(1)}% {tl('m_digital')}</b>
      </div>
      {share.total > 0 ? (
        <ChartContainer className="h-8 w-full aspect-auto" config={{ digital: { label: tl('m_digital'), color: 'hsl(var(--primary))' }, cash: { label: tl('m_cash'), color: 'hsl(var(--accent))' } }}>
          <BarChart accessibilityLayer layout="vertical" data={[{ name: month, digital: share.digital, cash: share.cash }]} margin={{ top: 0, bottom: 0, left: 0, right: 0 }}>
            <XAxis type="number" hide domain={[0, share.total]} /><YAxis type="category" dataKey="name" hide />
            <Tooltip formatter={(value: number) => `PKR ${value.toLocaleString()}`} />
            <Bar dataKey="digital" name={tl('m_digital')} stackId="payment" fill="hsl(var(--primary))" barSize={10} />
            <Bar dataKey="cash" name={tl('m_cash')} stackId="payment" fill="hsl(var(--accent))" barSize={10} />
          </BarChart>
        </ChartContainer>
      ) : <p className="text-sm text-muted-foreground py-2">{tl('j_no_payments_this_month')}</p>}
      <div className="flex flex-wrap justify-between gap-1 text-xs text-muted-foreground">
        <span>{tl('j_digital', { amount: money(share.digital) })}</span>
        <span>{tl('j_cash', { amount: money(share.cash) })} · {share.total ? (100 - share.digitalPercent).toFixed(1) : '0.0'}%</span>
      </div>
    </section>
  );
}
