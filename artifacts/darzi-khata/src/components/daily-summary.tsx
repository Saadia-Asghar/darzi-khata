import { useMemo } from 'react';
import { CalendarCheck, Wallet, AlertTriangle } from 'lucide-react';
import type { Order } from '../types/order';
import { usePreferences } from '../hooks/use-preferences';
import { balance } from '../lib/payments';
import { isOverdue, startOfDay } from './status-meta';
import { rs } from './format';

export function DailySummary({ orders, onOpenDue }: { orders: Order[]; onOpenDue: () => void }) {
  const { label, urduFirst } = usePreferences();
  const s = useMemo(() => {
    const t = startOfDay(new Date()).getTime();
    const today = orders.filter((o) => o.status !== 'delivered' && startOfDay(o.deliveryDate).getTime() === t);
    const readyDue = orders.filter((o) => o.status === 'ready' && balance(o) > 0 && startOfDay(o.deliveryDate).getTime() <= t);
    const collectIds = new Set([...today, ...readyDue].map((o) => o.id));
    const collect = orders.filter((o) => collectIds.has(o.id)).reduce((sum, o) => sum + balance(o), 0);
    return { deliveries: today.length, collect, overdue: orders.filter((o) => isOverdue(o)).length };
  }, [orders]);
  return (
    <button onClick={onOpenDue} className="w-full text-start mb-4 rounded-2xl bg-emerald-900 text-white p-4 relative overflow-hidden active:scale-[0.99] transition-transform motion-reduce:transition-none" data-testid="card-daily-summary">
      <div className="dk-stitch absolute inset-x-4 top-2 opacity-70" aria-hidden />
      <div className="text-[11px] uppercase tracking-widest text-emerald-300 mt-1">{label('Today', 'آج')} · {new Date().toLocaleDateString(urduFirst ? 'ur-PK' : 'en-PK', { weekday: 'long', day: 'numeric', month: 'short' })}</div>
      <p className={`text-lg font-bold mt-1 ${urduFirst ? 'font-urdu leading-[2.2]' : ''}`} data-testid="text-daily-summary">
        {label(`${s.deliveries} deliveries, ${rs(s.collect)} to collect`, `${s.deliveries} ڈیلیوری، ${rs(s.collect)} وصول کرنا ہے`)}
      </p>
      <div className="flex flex-wrap gap-2 mt-3 text-xs font-bold">
        <span className="inline-flex items-center gap-1 bg-emerald-800 rounded-full px-2.5 py-1"><CalendarCheck size={13} aria-hidden /> {s.deliveries}</span>
        <span className="inline-flex items-center gap-1 bg-amber-500 text-emerald-950 rounded-full px-2.5 py-1"><Wallet size={13} aria-hidden /> {rs(s.collect)}</span>
        {s.overdue > 0 && <span className="inline-flex items-center gap-1 bg-red-600 rounded-full px-2.5 py-1"><AlertTriangle size={13} aria-hidden /> {label(`${s.overdue} overdue`, `${s.overdue} دیر`)}</span>}
      </div>
    </button>
  );
}
