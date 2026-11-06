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

export const METHOD_META: Record<PaymentMethod, { en: string; ur: string; icon: typeof Wallet }> = {
  cash: { en: 'Cash', ur: 'نقد', icon: Banknote },
  zindigi: { en: 'Zindigi', ur: 'زندگی', icon: Smartphone },
  raast: { en: 'Raast', ur: 'راست', icon: Zap },
  bank: { en: 'Bank', ur: 'بینک', icon: Landmark },
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
    if (!Number.isFinite(amt) || amt <= 0) return setError('Enter an amount above zero / صفر سے زیادہ رقم لکھیں');
    if (amt > due) return setError(`Cannot exceed balance Rs ${due.toLocaleString()} / بقایا سے زیادہ نہیں`);
    if (!d || d > todayStr()) return setError('Date cannot be in the future / مستقبل کی تاریخ نہیں');
    try {
      const [y, mo, da] = d.split('-').map(Number);
      const when = d === todayStr() ? new Date() : new Date(y, mo - 1, da, 12);
      recordPayment(order.id, amt, m, when.toISOString(), demo);
      toast({
        title: demo ? 'Demo payment recorded / ڈیمو ادائیگی' : 'Payment recorded / ادائیگی درج',
        description: demo
          ? 'Simulation only. No money moved, no bank or Zindigi was contacted. / صرف نمونہ، کوئی رقم منتقل نہیں ہوئی'
          : `Rs ${amt.toLocaleString()} via ${METHOD_META[m].en}. Balance Rs ${(due - amt).toLocaleString()}`,
      });
      onOpenChange(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save / محفوظ نہ ہو سکا');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm w-[calc(100%-1.5rem)] p-0 overflow-hidden rounded-2xl gap-0 max-h-[90dvh] flex flex-col">
        <DialogHeader className="px-5 py-4 bg-emerald-800 text-white text-left space-y-0.5">
          <DialogTitle className="flex items-center gap-2 text-base"><Wallet size={16} /> Receive payment</DialogTitle>
          <DialogDescription className="text-emerald-200 text-xs"><span className="font-urdu">رقم وصول کریں</span> · {order.customerName} {order.serialNumber ? `· ${order.serialNumber}` : ''}</DialogDescription>
        </DialogHeader>
        <div className="p-5 space-y-4 overflow-y-auto">
          <div className="grid grid-cols-3 gap-2 text-center">
            <Stat label="Total / کل" value={order.totalAmount} />
            <Stat label="Collected / وصول" value={order.advanceAmount} tone="emerald" />
            <Stat label="Balance / بقایا" value={due} tone="red" />
          </div>

          <div>
            <label htmlFor="pay-amount" className="block text-sm font-bold mb-1.5">Amount received now <span className="font-urdu font-normal text-muted-foreground">ابھی وصول رقم</span></label>
            <div className="flex gap-2">
              <input id="pay-amount" type="number" inputMode="numeric" min={1} max={due} value={amount}
                onChange={(e) => { setAmount(e.target.value); setError(''); }} placeholder="0"
                className="flex-1 min-w-0 h-12 bg-muted border border-input rounded-xl px-4 text-xl font-bold font-mono outline-none focus:ring-2 focus:ring-emerald-500" data-testid="input-payment-amount" />
              <button type="button" onClick={() => { setAmount(String(due)); setError(''); }} className="h-12 px-3 rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 text-xs font-bold" data-testid="btn-pay-full">Full / پورا</button>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">Adds to what is already collected. / پہلے سے وصول رقم میں جمع ہوگی</p>
          </div>

          <fieldset>
            <legend className="text-sm font-bold mb-1.5">Method <span className="font-urdu font-normal text-muted-foreground">طریقہ</span></legend>
            <div className="grid grid-cols-4 gap-1.5">
              {(Object.keys(METHOD_META) as PaymentMethod[]).map((m) => {
                const Icon = METHOD_META[m].icon; const on = method === m;
                return (
                  <button key={m} type="button" aria-pressed={on} onClick={() => setMethod(m)}
                    className={`min-h-[56px] rounded-xl border flex flex-col items-center justify-center gap-0.5 text-[11px] font-bold transition ${on ? 'bg-emerald-800 text-white border-emerald-800' : 'bg-card border-border text-foreground hover:bg-muted'}`} data-testid={`btn-method-${m}`}>
                    <Icon size={16} />{METHOD_META[m].en}<span className="font-urdu font-normal text-[10px] leading-none">{METHOD_META[m].ur}</span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div>
            <label htmlFor="pay-date" className="block text-sm font-bold mb-1.5">Date <span className="font-urdu font-normal text-muted-foreground">تاریخ</span></label>
            <input id="pay-date" type="date" max={todayStr()} value={date} onChange={(e) => { setDate(e.target.value); setError(''); }}
              className="w-full h-11 bg-muted border border-input rounded-xl px-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500" data-testid="input-payment-date" />
          </div>

          {error && <p role="alert" className="text-sm font-semibold text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">{error}</p>}

          <div className="flex gap-2">
            <button type="button" onClick={() => onOpenChange(false)} className="flex-1 min-h-[48px] rounded-xl border border-border font-bold hover:bg-muted">Cancel / منسوخ</button>
            <button type="button" onClick={() => save(n, method, date, false)} className="flex-[1.4] min-h-[48px] bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold active:scale-[0.98] transition" data-testid="btn-confirm-payment">Save / محفوظ</button>
          </div>

          {demoMode && due > 0 && (
            <button type="button" onClick={() => save(due, 'zindigi', todayStr(), true)}
              className="w-full min-h-[48px] rounded-xl border-2 border-dashed border-amber-400 bg-amber-50 dark:bg-amber-900/20 text-amber-900 dark:text-amber-200 text-sm font-bold flex items-center justify-center gap-2" data-testid="btn-demo-zindigi-paid">
              <FlaskConical size={16} /> Simulate Zindigi paid (demo) / ڈیمو
            </button>
          )}

          <section aria-label="Payment history / ادائیگی کی تاریخ">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Ledger / کھاتہ</h4>
            {history.length === 0 ? (
              <p className="text-xs text-muted-foreground border border-dashed border-border rounded-lg p-3 text-center">No payments yet / ابھی کوئی ادائیگی نہیں</p>
            ) : (
              <ol className="divide-y divide-border border border-border rounded-xl overflow-hidden">
                {[...history].reverse().map((p) => (
                  <li key={p.id} className="flex items-center justify-between px-3 py-2 text-sm bg-card">
                    <span className="flex flex-col">
                      <span className="font-semibold">{METHOD_META[p.method] ? `${METHOD_META[p.method].en} / ${METHOD_META[p.method].ur}` : p.method} {p.demo && <span className="ml-1 text-[10px] bg-amber-100 text-amber-800 px-1.5 rounded">DEMO / ڈیمو</span>}</span>
                      <span className="text-[11px] text-muted-foreground">{new Date(p.date).toLocaleDateString()}</span>
                    </span>
                    <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">Rs {p.amount.toLocaleString()}</span>
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
  const c = tone === 'emerald' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300' : tone === 'red' ? 'bg-red-50 dark:bg-red-900/20 text-red-600' : 'bg-muted text-foreground';
  return (
    <div className={`rounded-lg p-2 ${c}`}>
      <div className="text-[10px] font-semibold leading-tight">{label}</div>
      <div className="font-bold text-sm font-mono">Rs {value.toLocaleString()}</div>
    </div>
  );
}
