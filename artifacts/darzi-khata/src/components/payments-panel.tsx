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
  const { label } = usePreferences();
  const [view, setView] = useState<'due' | 'ledger'>('due');
  const [payingId, setPayingId] = useState<string | null>(null);
  const paying = orders.find((o) => o.id === payingId) ?? null;
  const dues = useMemo(() => orders.filter((o) => balance(o) > 0).sort((a, b) => +new Date(a.deliveryDate) - +new Date(b.deliveryDate)), [orders]);
  const totalDue = dues.reduce((s, o) => s + balance(o), 0);
  const ledger = useMemo(() => orders.flatMap((o) => paymentHistory(o).map((p) => ({ p, o }))).sort((a, b) => +new Date(b.p.date) - +new Date(a.p.date)), [orders]);
  const collected = ledger.reduce((s, x) => s + x.p.amount, 0);

  return (
    <section className="dk-rise" aria-label={label('payments')}>
      <h2 className={`text-xl font-bold mb-3 `}>{label('payments')}</h2>
      <div className="grid grid-cols-2 gap-2.5 mb-3">
        <div className="rounded-lg bg-danger-soft  border border-border  p-3"><div className="text-xs font-bold text-danger ">{label('still_to_collect')}</div><div className="text-xl font-bold font-mono text-danger " dir="ltr" data-testid="text-total-due">{rs(totalDue)}</div><div className="text-xs text-muted-foreground">{dues.length} {label('orders')}</div></div>
        <div className="rounded-lg bg-primary-soft  border border-border  p-3"><div className="text-xs font-bold text-primary ">{label('collected')}</div><div className="text-xl font-bold font-mono text-primary " dir="ltr">{rs(collected)}</div><div className="text-xs text-muted-foreground">{ledger.length} {label('entries')}</div></div>
      </div>
      <PaymentShareStat orders={orders} />
      <div className="grid grid-cols-2 gap-1 p-1 bg-muted rounded-lg mb-3" role="tablist">
        {(['due', 'ledger'] as const).map((v) => (
          <button key={v} role="tab" aria-selected={view === v} onClick={() => setView(v)} className={`min-h-[44px] rounded-lg text-sm font-bold ${view === v ? 'bg-card ' : 'text-muted-foreground'}`} data-testid={`tab-pay-${v}`}>
            {v === 'due' ? label('due_balances') : label('payment_ledger')}
          </button>
        ))}
      </div>
      {view === 'due' ? (
        dues.length === 0 ? <Empty text={label('nothing_pending_every_order_is_paid')} /> : (
          <ul className="space-y-2">
            {dues.map((o) => (
              <li key={o.id} className="bg-card border border-card-border rounded-lg p-3 flex items-center gap-3" data-testid={`row-due-${o.id}`}>
                <StatusBadge order={o} compact />
                <button onClick={() => onViewReceipt(o)} className="flex-1 min-w-0 text-start min-h-[44px]">
                  <div className="font-bold truncate">{o.customerName} <span className="text-xs font-mono text-muted-foreground">{o.serialNumber}</span></div>
                  <div className="text-sm text-muted-foreground" dir="ltr">{formatPhone(o.phone)} · {new Date(o.deliveryDate).toLocaleDateString()}</div>
                </button>
                <div className="text-end shrink-0">
                  <div className="font-bold font-mono text-danger" dir="ltr">{rs(balance(o))}</div>
                  <button onClick={() => setPayingId(o.id)} className="mt-1 min-h-[44px] px-3 rounded-lg bg-accent text-accent-foreground text-sm font-bold inline-flex items-center gap-1" data-testid={`btn-receive-${o.id}`}><Wallet size={13} aria-hidden /> {label('receive')}</button>
                </div>
              </li>
            ))}
          </ul>
        )
      ) : ledger.length === 0 ? <Empty text={label('no_payments_recorded_yet')} /> : (
        <ul className="bg-card border border-card-border rounded-lg divide-y divide-border">
          {ledger.map(({ p, o }) => {
            const m = METHOD_META[p.method];
            const Icon = m.icon;
            return (
              <li key={`${o.id}-${p.id}`} className="flex items-center gap-3 p-3">
                <span className="h-10 w-10 rounded-full bg-primary-soft  text-primary  flex items-center justify-center shrink-0"><Icon size={17} aria-hidden /></span>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm truncate">{o.customerName}</div>
                  <div className="text-xs text-muted-foreground">{label(m.tk)} · {new Date(p.date).toLocaleDateString()} {p.demo && <FlaskConical size={10} className="inline" aria-label="demo" />}</div>
                </div>
                <span className="font-mono font-bold text-primary  inline-flex items-center gap-0.5" dir="ltr"><ArrowDownLeft size={13} aria-hidden />{rs(p.amount)}</span>
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
  return <div className="text-center py-10 bg-card rounded-lg border border-dashed border-border"><Wallet className="mx-auto text-muted-foreground mb-2" size={30} aria-hidden /><p className="text-sm text-muted-foreground">{text}</p></div>;
}
