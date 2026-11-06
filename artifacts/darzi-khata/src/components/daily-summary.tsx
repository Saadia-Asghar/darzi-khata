import { useMemo } from 'react';
import { ChevronRight } from 'lucide-react';
import type { Order } from '../types/order';
import { usePreferences } from '../hooks/use-preferences';
import { balance } from '../lib/payments';
import { money } from '../lib/i18n';
import { isOverdue, startOfDay } from './status-meta';

/** One-line "Today" summary: "3 deliveries · Rs 4,500 to collect". Tap opens the due list. */
export function DailySummary({ orders, onOpenDue }: { orders: Order[]; onOpenDue: () => void }) {
  const { label, one } = usePreferences();
  const s = useMemo(() => {
    const t = startOfDay(new Date()).getTime();
    const today = orders.filter((o) => o.status !== 'delivered' && startOfDay(o.deliveryDate).getTime() === t);
    const readyDue = orders.filter((o) => o.status === 'ready' && balance(o) > 0 && startOfDay(o.deliveryDate).getTime() <= t);
    const ids = new Set([...today, ...readyDue].map((o) => o.id));
    const collect = orders.filter((o) => ids.has(o.id)).reduce((sum, o) => sum + balance(o), 0);
    return { deliveries: today.length, collect, overdue: orders.filter((o) => isOverdue(o)).length };
  }, [orders]);
  return (
    <button onClick={onOpenDue} className="w-full text-start mb-3 rounded-lg border border-border bg-card px-4 min-h-[56px] flex items-center gap-3 hover:bg-muted" data-testid="card-daily-summary">
      <span className="text-sm font-medium text-muted-foreground shrink-0">{one('today_summary_title')}</span>
      <span className="flex-1 min-w-0 text-base font-medium" data-testid="text-daily-summary">
        {label('t_n_deliveries_n_to_collect', { deliveries: s.deliveries, collect: money(s.collect) })}
        {s.overdue > 0 && <span className="block text-sm font-semibold text-danger">{label('t_n_overdue', { overdue: s.overdue })}</span>}
      </span>
      <ChevronRight size={20} aria-hidden className="text-muted-foreground rtl:rotate-180 shrink-0" />
    </button>
  );
}
