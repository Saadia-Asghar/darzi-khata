import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { ChartContainer } from './ui/chart';
import { paymentShare } from '../lib/payments';
import type { Order } from '../types/order';

export function PaymentShareStat({ orders }: { orders: Order[] }) {
  const share = useMemo(() => paymentShare(orders, new Date()), [orders]);
  const month = new Date().toLocaleDateString('en-PK', { month: 'long', year: 'numeric' });
  return (
    <section className="rounded-xl border border-border bg-card p-3 mb-4" aria-label="Digital vs cash this month / اس ماہ ادائیگی">
      <div className="flex items-start justify-between gap-3 text-xs">
        <div><h2 className="font-bold">Digital vs Cash / ڈیجیٹل اور نقد</h2><p className="text-muted-foreground mt-1">{month} · PKR · by payment date / ادائیگی کی تاریخ</p></div>
        <b className="text-emerald-700 dark:text-emerald-400 shrink-0">{share.digitalPercent.toFixed(1)}% digital</b>
      </div>
      {share.total > 0 ? (
        <ChartContainer className="h-8 w-full aspect-auto" config={{ digital: { label: 'Digital / ڈیجیٹل', color: '#047857' }, cash: { label: 'Cash / نقد', color: '#d97706' } }}>
          <BarChart accessibilityLayer layout="vertical" data={[{ name: month, digital: share.digital, cash: share.cash }]} margin={{ top: 0, bottom: 0, left: 0, right: 0 }}>
            <XAxis type="number" hide domain={[0, share.total]} /><YAxis type="category" dataKey="name" hide />
            <Tooltip formatter={(value: number) => `PKR ${value.toLocaleString()}`} />
            <Bar dataKey="digital" name="Digital / ڈیجیٹل" stackId="payment" fill="#047857" barSize={10} />
            <Bar dataKey="cash" name="Cash / نقد" stackId="payment" fill="#d97706" barSize={10} />
          </BarChart>
        </ChartContainer>
      ) : <p className="text-xs text-muted-foreground py-2">No payments this month / اس ماہ ادائیگی درج نہیں</p>}
      <div className="flex flex-wrap justify-between gap-1 text-[11px] text-muted-foreground">
        <span>Digital / ڈیجیٹل: Rs {share.digital.toLocaleString()}</span>
        <span>Cash / نقد: Rs {share.cash.toLocaleString()} · {share.total ? (100 - share.digitalPercent).toFixed(1) : '0.0'}%</span>
      </div>
    </section>
  );
}
