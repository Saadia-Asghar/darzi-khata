import { useMemo, useState } from 'react';
import { Wallet, ArrowDownLeft, FlaskConical } from 'lucide-react';
import type { Order } from '../types/order';
import { usePreferences } from '../hooks/use-preferences';
import { balance, paymentHistory } from '../lib/payments';
import { PaymentShareStat } from './payment-share-stat';
import { PaymentUpdateDialog, METHOD_META } from './payment-update-dialog';
import { StatusBadge } from './status-meta';
import { rs, formatPhone } from './format';

export function PaymentsPanel({ orders, onViewReceipt }: { orders: Order[]; onViewReceipt: (o: Order) => void }) {
  const { label, urduFirst } = usePreferences();
  const [view, setView] = useState<'due' | 'ledger'>('due');
  const [payingId, setPayingId] = useState<string | null>(null);
  const paying = orders.find((o) => o.id === payingId) ?? null;
  const dues = useMemo(() => orders.filter((o) => balance(o) > 0).sort((a, b) => +new Date(a.deliveryDate) - +new Date(b.deliveryDate)), [orders]);
  const totalDue = dues.reduce((s, o) => s + balance(o), 0);
  const ledger = useMemo(() => orders.flatMap((o) => paymentHistory(o).map((p) => ({ p, o }))).sort((a, b) => +new Date(b.p.date) - +new Date(a.p.date)), [orders]);
  const collected = ledger.reduce((s, x) => s + x.p.amount, 0);

  return (
    <section className="dk-rise" aria-label={label('Payments', 'ادائیگی')}>
      <h2 className={`text-xl font-black mb-3 ${urduFirst ? 'font-urdu leading-loose' : ''}`}>{label('Payments', 'ادائیگی')}</h2>
      <div className="grid grid-cols-2 gap-2.5 mb-3">
        <div className="rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 p-3"><div className="text-[11px] font-bold text-red-700 dark:text-red-300">{label('Still to collect', 'وصول باقی')}</div><div className="text-xl font-black font-mono text-red-700 dark:text-red-300" dir="ltr" data-testid="text-total-due">{rs(totalDue)}</div><div className="text-[11px] text-muted-foreground">{dues.length} {label('orders', 'آرڈر')}</div></div>
        <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 p-3"><div className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300">{label('Collected', 'وصول شدہ')}</div><div className="text-xl font-black font-mono text-emerald-800 dark:text-emerald-300" dir="ltr">{rs(collected)}</div><div className="text-[11px] text-muted-foreground">{ledger.length} {label('entries', 'اندراج')}</div></div>
      </div>
      <PaymentShareStat orders={orders} />
      <div className="grid grid-cols-2 gap-1 p-1 bg-muted rounded-xl mb-3" role="tablist">
        {(['due', 'ledger'] as const).map((v) => (
          <button key={v} role="tab" aria-selected={view === v} onClick={() => setView(v)} className={`min-h-[44px] rounded-lg text-sm font-bold ${view === v ? 'bg-card shadow-sm' : 'text-muted-foreground'}`} data-testid={`tab-pay-${v}`}>
            {v === 'due' ? label('Due balances', 'باقی رقم') : label('Payment ledger', 'ادائیگی کھاتہ')}
          </button>
        ))}
      </div>
      {view === 'due' ? (
        dues.length === 0 ? <Empty text={label('Nothing pending. Every order is paid.', 'کوئی رقم باقی نہیں')} /> : (
          <ul className="space-y-2">
            {dues.map((o) => (
              <li key={o.id} className="bg-card border border-card-border rounded-xl p-3 flex items-center gap-3" data-testid={`row-due-${o.id}`}>
                <StatusBadge order={o} compact />
                <button onClick={() => onViewReceipt(o)} className="flex-1 min-w-0 text-start min-h-[44px]">
                  <div className="font-bold truncate">{o.customerName} <span className="text-[10px] font-mono text-muted-foreground">{o.serialNumber}</span></div>
                  <div className="text-xs text-muted-foreground" dir="ltr">{formatPhone(o.phone)} · {new Date(o.deliveryDate).toLocaleDateString()}</div>
                </button>
                <div className="text-end shrink-0">
                  <div className="font-black font-mono text-red-600" dir="ltr">{rs(balance(o))}</div>
                  <button onClick={() => setPayingId(o.id)} className="mt-1 min-h-[44px] px-3 rounded-lg bg-amber-500 text-emerald-950 text-xs font-bold inline-flex items-center gap-1" data-testid={`btn-receive-${o.id}`}><Wallet size={13} aria-hidden /> {label('Receive', 'وصول')}</button>
                </div>
              </li>
            ))}
          </ul>
        )
      ) : ledger.length === 0 ? <Empty text={label('No payments recorded yet.', 'ابھی کوئی ادائیگی درج نہیں')} /> : (
        <ul className="bg-card border border-card-border rounded-xl divide-y divide-border">
          {ledger.map(({ p, o }) => {
            const m = METHOD_META[p.method];
            const Icon = m.icon;
            return (
              <li key={`${o.id}-${p.id}`} className="flex items-center gap-3 p-3">
                <span className="h-10 w-10 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0"><Icon size={17} aria-hidden /></span>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm truncate">{o.customerName}</div>
                  <div className="text-[11px] text-muted-foreground">{label(m.en, m.ur)} · {new Date(p.date).toLocaleDateString()} {p.demo && <FlaskConical size={10} className="inline" aria-label="demo" />}</div>
                </div>
                <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300 inline-flex items-center gap-0.5" dir="ltr"><ArrowDownLeft size={13} aria-hidden />{rs(p.amount)}</span>
              </li>
            );
          })}
        </ul>
      )}
      {paying && <PaymentUpdateDialog order={paying} open={!!paying} onOpenChange={(v) => { if (!v) setPayingId(null); }} />}
    </section>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="text-center py-10 bg-card rounded-xl border border-dashed border-border"><Wallet className="mx-auto text-muted-foreground mb-2" size={30} aria-hidden /><p className="text-sm text-muted-foreground">{text}</p></div>;
}
