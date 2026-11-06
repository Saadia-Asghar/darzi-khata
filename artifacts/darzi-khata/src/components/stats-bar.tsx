import { Order } from '../types/order';
import { usePreferences } from '../hooks/use-preferences';
import { balance } from '../lib/payments';
import { money } from '../lib/i18n';
import { isOverdue, startOfDay } from './status-meta';

/** One calm summary strip: three columns, thin dividers. Red only when something is overdue. */
export function StatsBar({ orders, onDueTodayClick }: { orders: Order[]; onDueTodayClick: () => void }) {
  const { label, one } = usePreferences();
  const active = orders.filter((o) => o.status !== 'delivered');
  const tomorrow = startOfDay(new Date()); tomorrow.setDate(tomorrow.getDate() + 1);
  const dueSoon = active.filter((o) => startOfDay(o.deliveryDate).getTime() <= tomorrow.getTime());
  const anyOverdue = active.some((o) => isOverdue(o));
  const totalBaqi = active.reduce((s, o) => s + balance(o), 0);
  const cell = 'flex flex-col items-center justify-center gap-0.5 px-2 py-3 min-h-[72px] text-center';
  return (
    <div className="grid grid-cols-3 divide-x divide-border rtl:divide-x-reverse bg-card border border-border rounded-lg mb-4" data-testid="stats-strip">
      <div className={cell} data-testid="stat-active">
        <span className="num text-xl font-semibold text-foreground">{active.length}</span>
        <span className="text-sm text-muted-foreground">{one('summary_active')}</span>
      </div>
      <button onClick={onDueTodayClick} className={`${cell} hover:bg-muted`} aria-label={`${dueSoon.length} ${label('summary_due')}. ${label('open_due_list')}`} data-testid="stat-due">
        <span className={`num text-xl font-semibold ${anyOverdue ? 'text-danger' : 'text-foreground'}`}>{dueSoon.length}</span>
        <span className="text-sm text-muted-foreground">{one('summary_due')}</span>
      </button>
      <div className={cell} data-testid="stat-baqi">
        <span dir="ltr" className="num text-lg font-semibold text-foreground whitespace-nowrap">{money(totalBaqi)}</span>
        <span className="text-sm text-muted-foreground">{one('summary_baqi')}</span>
      </div>
    </div>
  );
}
