import { CalendarClock, ClipboardList, Wallet } from 'lucide-react';
import { Order } from '../types/order';
import { usePreferences } from '../hooks/use-preferences';

interface StatsBarProps {
  orders: Order[];
  onDueTodayClick: () => void;
}

export function StatsBar({ orders, onDueTodayClick }: StatsBarProps) {
  const { label } = usePreferences();
  const activeOrders = orders.filter((o) => o.status !== 'delivered');
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
  const deliveriesSoon = activeOrders.filter((o) => {
    const d = new Date(o.deliveryDate); d.setHours(0, 0, 0, 0);
    return d.getTime() <= tomorrow.getTime();
  });
  const totalBaqi = activeOrders.reduce((sum, o) => sum + Math.max(0, o.totalAmount - o.advanceAmount), 0);

  return (
    <div className="grid grid-cols-3 gap-2.5 mb-5">
      <div className="bg-emerald-800 dark:bg-emerald-900 text-white rounded-xl p-3 border border-emerald-700" data-testid="stat-active">
        <ClipboardList size={15} className="text-emerald-200" aria-hidden />
        <div className="text-2xl font-bold mt-1">{activeOrders.length}</div>
        <div className="text-[11px] text-emerald-100 font-semibold leading-tight">{label('Active orders', 'جاری آرڈر')}</div>
      </div>
      <button onClick={onDueTodayClick} className="bg-card border border-border rounded-xl p-3 relative text-start active:scale-95 transition-transform motion-reduce:transition-none hover:bg-muted min-h-[44px]" aria-label={label(`${deliveriesSoon.length} due by tomorrow, open list`, `${deliveriesSoon.length} کل تک، فہرست کھولیں`)} data-testid="stat-due">
        {deliveriesSoon.length > 0 && <span className="absolute top-2 end-2 h-2.5 w-2.5 rounded-full bg-red-600" aria-hidden />}
        <CalendarClock size={15} className={deliveriesSoon.length > 0 ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'} aria-hidden />
        <div className={`text-2xl font-bold mt-1 ${deliveriesSoon.length > 0 ? 'text-red-600 dark:text-red-400' : 'text-foreground'}`}>{deliveriesSoon.length}</div>
        <div className="text-[11px] text-muted-foreground font-semibold leading-tight">{label('Due by tomorrow', 'کل تک ڈیلیوری')}</div>
      </button>
      <div className="bg-amber-500 dark:bg-amber-600 text-amber-950 rounded-xl p-3" data-testid="stat-baqi">
        <Wallet size={15} aria-hidden />
        <div className="text-base sm:text-lg font-bold mt-1 break-all leading-tight" dir="ltr">Rs {totalBaqi.toLocaleString()}</div>
        <div className="text-[11px] font-semibold leading-tight">{label('Total balance', 'کل باقی')}</div>
      </div>
    </div>
  );
}
