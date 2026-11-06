import { entry } from '../lib/i18n';
import { Clock, Scissors, CheckCircle2, PackageCheck, AlertTriangle, type LucideIcon } from 'lucide-react';
import type { Order, OrderStatus } from '../types/order';
import { usePreferences } from '../hooks/use-preferences';
import type { DictKey } from '../lib/i18n';

/** Status chips: Pending neutral, Stitching info, Ready success, Delivered muted dark, Overdue danger. */
export const STATUS_META: Record<OrderStatus | 'overdue', { en: string; ur: string; key: DictKey; icon: LucideIcon; cls: string }> = {
  pending: { ...entry('d_pending'), key: 'status_pending', icon: Clock, cls: 'bg-neutral-soft text-foreground border-border' },
  stitching: { ...entry('d_stitching'), key: 'status_stitching', icon: Scissors, cls: 'bg-info-soft text-info border-info/30' },
  ready: { ...entry('d_ready'), key: 'status_ready', icon: CheckCircle2, cls: 'bg-success-soft text-success border-success/30' },
  delivered: { ...entry('d_delivered'), key: 'status_delivered', icon: PackageCheck, cls: 'bg-delivered text-delivered-foreground border-delivered' },
  overdue: { ...entry('d_overdue'), key: 'status_overdue', icon: AlertTriangle, cls: 'bg-danger text-danger-foreground border-danger' },
};
export const STATUS_ORDER: OrderStatus[] = ['pending', 'stitching', 'ready', 'delivered'];

export function startOfDay(d: Date | string) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; }
export function isOverdue(o: Pick<Order, 'deliveryDate' | 'status'>, now = new Date()) {
  return o.status !== 'delivered' && startOfDay(o.deliveryDate) < startOfDay(now);
}
export function visualStatus(o: Pick<Order, 'deliveryDate' | 'status'>): OrderStatus {
  return o.status;
}

/** Icon + colour status chip, readable without colour. */
export function StatusBadge({ order, status, compact = false }: { order?: Pick<Order, 'deliveryDate' | 'status'>; status?: OrderStatus | 'overdue'; compact?: boolean }) {
  const { label } = usePreferences();
  const key = status ?? (order ? visualStatus(order) : 'pending');
  const m = STATUS_META[key];
  const Icon = m.icon;
  const text = label(m.key);
  return (
    <span className={`inline-flex items-center gap-1 rounded-md border font-medium ${compact ? 'h-7 w-7 justify-center' : 'px-2 py-0.5 text-sm'} ${m.cls}`} title={text} aria-label={compact ? text : undefined} data-testid={`status-${key}`}>
      <Icon size={compact ? 14 : 14} aria-hidden />
      {!compact && <span>{text}</span>}
    </span>
  );
}
