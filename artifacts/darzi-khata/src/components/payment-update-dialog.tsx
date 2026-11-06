import { entry, tl, type DictKey } from '../lib/i18n';
import { haptic } from '../lib/haptics';
import { useEffect, useState } from 'react';
import { Wallet, Banknote, Smartphone, Landmark, Zap, FlaskConical } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Order, PaymentMethod } from '../types/order';
import { useOrders } from '../hooks/use-orders';
import { useDemoMode } from '../hooks/use-demo-mode';
import { balance, paymentHistory } from '../lib/payments';

interface PaymentUpdateDialogProps {
  order: Order;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Legacy compatibility prop. Saving now goes through the synchronized useOrders().recordPayment. */
  onUpdatePayment?: (id: string, newAdvance: number) => void;
}

export const METHOD_META: Record<PaymentMethod, { tk: DictKey; en: string; ur: string; icon: typeof Wallet }> = {
  cash: { ...entry('d_cash'), icon: Banknote },
  zindigi: { ...entry('d_zindigi'), icon: Smartphone },
  raast: { ...entry('d_raast'), icon: Zap },
  bank: { ...entry('d_bank'), icon: Landmark },
};

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export function PaymentUpdateDialog({ order, open, onOpenChange }: PaymentUpdateDialogProps) {
  const { toast } = useToast();
  const { recordPayment } = useOrders();
  const { demoMode } = useDemoMode();
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [date, setDate] = useState(todayStr());
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) { setAmount(''); setMethod('cash'); setDate(todayStr()); setError(''); }
  }, [open]);

  const due = balance(order);
  const history = paymentHistory(order);
  const n = Number(amount);

  const save = (amt: number, m: PaymentMethod, d: string, demo: boolean) => {
    if (!Number.isFinite(amt) || amt <= 0) return setError(tl('m_enter_an_amount_above_zero'));
    if (amt > due) return setError(tl('m_cannot_exceed_balance_rs_due', { due: due.toLocaleString() }));
    if (!d || d > todayStr()) return setError(tl('m_date_cannot_be_in_the_future'));
    try {
      const [y, mo, da] = d.split('-').map(Number);
      const when = d === todayStr() ? new Date() : new Date(y, mo - 1, da, 12);
      recordPayment(order.id, amt, m, when.toISOString(), demo);
      haptic();
      toast({
        title: demo ? tl('m_demo_payment_recorded') : tl('m_payment_recorded'),
        description: demo
          ? tl('m_simulation_only_no_money_moved_no_bank_o')
          : `Rs ${amt.toLocaleString()} via ${METHOD_META[m].en}. Balance Rs ${(due - amt).toLocaleString()}`,
      });
      onOpenChange(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : tl('m_could_not_save'));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm w-[calc(100%-1.5rem)] p-0 overflow-hidden rounded-lg gap-0 max-h-[90dvh] flex flex-col">
        <DialogHeader className="px-5 py-4 bg-primary text-primary-foreground text-left space-y-0.5">
          <DialogTitle className="flex items-center gap-2 text-base"><Wallet size={16} aria-hidden /> {tl('pay_receive_title')}</DialogTitle>
          <DialogDescription className="text-primary-foreground text-sm">{order.customerName} {order.serialNumber ? `· ${order.serialNumber}` : ''}</DialogDescription>
        </DialogHeader>
        <div className="p-5 space-y-4 overflow-y-auto">
          <div className="grid grid-cols-3 gap-2 text-center">
            <Stat label={tl('m_total')} value={order.totalAmount} />
            <Stat label={tl('m_collected')} value={order.advanceAmount} tone="emerald" />
            <Stat label={tl('m_balance')} value={due} tone="red" />
          </div>

          <div>
            <label htmlFor="pay-amount" className="block text-sm font-bold mb-1.5">{tl('j_amount_received_now')}</label>
            <div className="flex gap-2">
              <input id="pay-amount" type="number" inputMode="numeric" min={1} max={due} value={amount}
                onChange={(e) => { setAmount(e.target.value); setError(''); }} placeholder="0"
                className="flex-1 min-w-0 h-12 bg-muted border border-input rounded-lg px-4 text-xl font-bold font-mono outline-none focus:ring-2 focus:ring-ring" data-testid="input-payment-amount" />
              <button type="button" onClick={() => { setAmount(String(due)); setError(''); }} className="h-12 px-3 rounded-lg border border-border bg-warning-soft  text-warning  text-sm font-bold" data-testid="btn-pay-full">{tl('j_full')}</button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{tl('j_adds_to_what_is_already_collected')}</p>
          </div>

          <fieldset>
            <legend className="text-sm font-bold mb-1.5">{tl('j_method')}</legend>
            <div className="grid grid-cols-4 gap-1.5">
              {(Object.keys(METHOD_META) as PaymentMethod[]).map((m) => {
                const Icon = METHOD_META[m].icon; const on = method === m;
                return (
                  <button key={m} type="button" aria-pressed={on} onClick={() => setMethod(m)}
                    className={`min-h-[56px] rounded-lg border flex flex-col items-center justify-center gap-0.5 text-xs font-bold transition ${on ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border text-foreground hover:bg-muted'}`} data-testid={`btn-method-${m}`}>
                    <Icon size={16} />{METHOD_META[m].en}<span className="font-urdu font-normal text-xs" lang="ur" dir="rtl">{METHOD_META[m].ur}</span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div>
            <label htmlFor="pay-date" className="block text-sm font-bold mb-1.5">{tl('j_date')}</label>
            <input id="pay-date" type="date" max={todayStr()} value={date} onChange={(e) => { setDate(e.target.value); setError(''); }}
              className="w-full h-11 bg-muted border border-input rounded-lg px-3 text-sm outline-none focus:ring-2 focus:ring-ring" data-testid="input-payment-date" />
          </div>

          {error && <p role="alert" className="text-sm font-semibold text-danger bg-danger-soft  rounded-lg px-3 py-2">{error}</p>}

          <div className="flex gap-2">
            <button type="button" onClick={() => onOpenChange(false)} className="flex-1 min-h-[48px] rounded-lg border border-border font-bold hover:bg-muted">{tl('j_cancel')}</button>
            <button type="button" onClick={() => save(n, method, date, false)} className="flex-[1.4] min-h-[48px] bg-primary hover:bg-primary text-primary-foreground rounded-lg font-bold active:scale-[0.98] transition" data-testid="btn-confirm-payment">{tl('j_save')}</button>
          </div>

          {demoMode && due > 0 && (
            <button type="button" onClick={() => save(due, 'zindigi', todayStr(), true)}
              className="w-full min-h-[48px] rounded-lg border-2 border-dashed border-warning bg-warning-soft  text-accent-foreground  text-sm font-bold flex items-center justify-center gap-2" data-testid="btn-demo-zindigi-paid">
              <FlaskConical size={16} /> Simulate Zindigi paid (demo) / ڈیمو
            </button>
          )}

          <section aria-label={tl('m_payment_history')}>
            <h4 className="text-sm font-bold   text-muted-foreground mb-2">{tl('j_ledger')}</h4>
            {history.length === 0 ? (
              <p className="text-sm text-muted-foreground border border-dashed border-border rounded-lg p-3 text-center">{tl('j_no_payments_yet')}</p>
            ) : (
              <ol className="divide-y divide-border border border-border rounded-lg overflow-hidden">
                {[...history].reverse().map((p) => (
                  <li key={p.id} className="flex items-center justify-between px-3 py-2 text-sm bg-card">
                    <span className="flex flex-col">
                      <span className="font-semibold">{METHOD_META[p.method] ? `${METHOD_META[p.method].en} / ${METHOD_META[p.method].ur}` : p.method} {p.demo && <span className="ml-1 text-xs bg-warning-soft text-warning px-1.5 rounded">{tl('j_demo')}</span>}</span>
                      <span className="text-xs text-muted-foreground">{new Date(p.date).toLocaleDateString()}</span>
                    </span>
                    <span className="font-mono font-bold text-primary ">Rs {p.amount.toLocaleString()}</span>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: 'emerald' | 'red' }) {
  const c = tone === 'emerald' ? 'bg-primary-soft  text-primary ' : tone === 'red' ? 'bg-danger-soft  text-danger' : 'bg-muted text-foreground';
  return (
    <div className={`rounded-lg p-2 ${c}`}>
      <div className="text-xs font-semibold leading-tight">{label}</div>
      <div className="font-bold text-sm font-mono">Rs {value.toLocaleString()}</div>
    </div>
  );
}
