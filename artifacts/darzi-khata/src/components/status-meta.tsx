import { Clock, Scissors, CheckCircle2, PackageCheck, AlertTriangle, type LucideIcon } from 'lucide-react';
import type { Order, OrderStatus } from '../types/order';
import { usePreferences } from '../hooks/use-preferences';

export const STATUS_META: Record<OrderStatus | 'overdue', { en: string; ur: string; icon: LucideIcon; cls: string }> = {
  pending: { en: 'Pending', ur: 'زیرِ التوا', icon: Clock, cls: 'bg-stone-100 text-stone-700 border-stone-300 dark:bg-stone-800 dark:text-stone-200 dark:border-stone-600' },
  stitching: { en: 'Stitching', ur: 'سلائی جاری', icon: Scissors, cls: 'bg-sky-50 text-sky-800 border-sky-300 dark:bg-sky-950 dark:text-sky-200 dark:border-sky-700' },
  ready: { en: 'Ready', ur: 'تیار', icon: CheckCircle2, cls: 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-700' },
  delivered: { en: 'Delivered', ur: 'دے دیا', icon: PackageCheck, cls: 'bg-slate-700 text-slate-50 border-slate-700 dark:bg-slate-200 dark:text-slate-900 dark:border-slate-200' },
  overdue: { en: 'Overdue', ur: 'دیر', icon: AlertTriangle, cls: 'bg-red-600 text-white border-red-600' },
};

export function startOfDay(d: Date | string) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; }
export function isOverdue(o: Pick<Order, 'deliveryDate' | 'status'>, now = new Date()) {
  return o.status !== 'delivered' && startOfDay(o.deliveryDate) < startOfDay(now);
}
export function visualStatus(o: Pick<Order, 'deliveryDate' | 'status'>): OrderStatus | 'overdue' {
  return isOverdue(o) ? 'overdue' : o.status;
}

/** Icon + colour status pill, readable without text. */
export function StatusBadge({ order, status, compact = false }: { order?: Pick<Order, 'deliveryDate' | 'status'>; status?: OrderStatus | 'overdue'; compact?: boolean }) {
  const { label } = usePreferences();
  const key = status ?? (order ? visualStatus(order) : 'pending');
  const m = STATUS_META[key];
  const Icon = m.icon;
  const text = label(m.en, m.ur);
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border font-bold ${compact ? 'h-6 w-6 justify-center' : 'px-2 py-0.5 text-[11px]'} ${m.cls}`} title={text} aria-label={compact ? text : undefined} data-testid={`status-${key}`}>
      <Icon size={compact ? 13 : 12} aria-hidden />
      {!compact && <span>{text}</span>}
    </span>
  );
}
