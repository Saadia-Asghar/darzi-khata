import { useMemo } from 'react';
import { Printer, Pencil, MessageSquare, Phone, ClipboardList, CalendarClock, AlertTriangle, HandCoins } from 'lucide-react';
import type { Order } from '../types/order';
import { usePreferences } from '../hooks/use-preferences';
import { useSettings } from '../hooks/use-settings';
import { GARMENTS, garment } from '../lib/garments';
import { balance } from '../lib/payments';
import { shortDate, money } from '../lib/i18n';
import { isOverdue, startOfDay } from './status-meta';
import { StatusBadge } from './status-meta';
import { formatPhone, rs } from './format';

/**
 * Desktop right pane for the Orders screen: order facts plus an on-screen
 * parchi preview. Printing still goes through the existing receipt flow.
 */
export function OrderDetailPane({ order, shopFallback, onPrint, onEdit, onChat, onCustomer }: {
  order: Order | null; shopFallback: string;
  onPrint: (o: Order) => void; onEdit: (o: Order) => void; onChat: (o: Order) => void; onCustomer: (key: string) => void;
}) {
  const { label, lang } = usePreferences();
  const { settings } = useSettings();
  if (!order) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-card p-4 text-center" data-testid="order-detail-empty">
        <ClipboardList size={24} aria-hidden className="mx-auto text-muted-foreground mb-1" />
        <p className="text-sm text-muted-foreground">{label('dk_select_order')}</p>
      </div>
    );
  }
  const items = order.items?.length ? order.items : [{ id: 'legacy', garmentType: 'gents' as const, quantity: order.suitCount, unitPrice: order.suitCount ? order.totalAmount / order.suitCount : order.totalAmount, measurements: (order.measurements ?? {}) as unknown as Record<string, number> }];
  const gName = (t: string) => { const g = GARMENTS.find((x) => x.value === t); return g ? label(g.tk) : t; };
  const shopName = (lang === 'ur' && settings.shopNameUrdu) || settings.shopName || shopFallback;
  const due = balance(order);
  return (
    <section className="space-y-3 dk-rise" key={order.id} aria-label={label('dk_parchi_preview')} data-testid="order-detail-pane">
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <button type="button" onClick={() => onCustomer(order.customerId ?? order.phone)} className="min-h-0 text-lg font-semibold truncate max-w-full text-start hover:underline" data-testid="detail-customer">{order.customerName}</button>
            <p className="text-sm text-muted-foreground flex items-center gap-1.5"><Phone size={14} aria-hidden /><span dir="ltr" className="num">{formatPhone(order.phone)}</span></p>
          </div>
          <StatusBadge order={order} />
        </div>
        <div className="grid grid-cols-3 gap-2 mt-4">
          <button type="button" onClick={() => onPrint(order)} className="min-h-[44px] rounded-md bg-primary text-primary-foreground text-sm font-semibold inline-flex items-center justify-center gap-1.5" data-testid="detail-print"><Printer size={18} aria-hidden /> {label('receipt')}</button>
          <button type="button" onClick={() => onEdit(order)} className="min-h-[44px] rounded-md border border-border text-sm font-medium inline-flex items-center justify-center gap-1.5 hover:bg-muted" data-testid="detail-edit"><Pencil size={18} aria-hidden /> {label('edit')}</button>
          <button type="button" onClick={() => onChat(order)} className="min-h-[44px] rounded-md border border-border text-sm font-medium inline-flex items-center justify-center gap-1.5 hover:bg-muted" data-testid="detail-chat"><MessageSquare size={18} aria-hidden /> {label('chat')}</button>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-4" data-testid="detail-measurements">
        <h3 className="text-sm font-semibold text-muted-foreground mb-2">{label('dk_measurements')}</h3>
        {items.some((it) => Object.keys(it.measurements ?? {}).length) ? items.map((it) => {
          const fields = garment(it.garmentType).fields;
          const entries = fields.filter((f) => it.measurements?.[f.key] != null && it.measurements[f.key] !== 0);
          if (!entries.length) return null;
          return (
            <div key={it.id} className="mb-2 last:mb-0">
              {items.length > 1 && <p className="text-sm font-medium mb-1">{gName(it.garmentType)}</p>}
              <dl className="grid grid-cols-3 gap-x-3 gap-y-1 text-sm">
                {entries.map((f) => (
                  <div key={f.key} className="flex justify-between gap-1 min-w-0 border-b border-border/60 py-0.5">
                    <dt className="truncate text-muted-foreground">{label(f.tk)}</dt><dd dir="ltr" className="num font-semibold">{it.measurements[f.key]}</dd>
                  </div>
                ))}
              </dl>
            </div>
          );
        }) : <p className="text-sm text-muted-foreground">{label('dk_no_measurements')}</p>}
      </div>

      <div className="rounded-lg border border-border bg-card p-4" data-testid="detail-payments">
        <h3 className="text-sm font-semibold text-muted-foreground mb-2">{label('dk_payments')}</h3>
        {order.payments?.length ? (
          <ul className="divide-y divide-border text-sm">
            {order.payments.map((p) => (
              <li key={p.id} className="flex items-center justify-between py-1.5"><span>{shortDate(p.date, lang)}</span><span dir="ltr" className="num font-semibold">{rs(p.amount)}</span></li>
            ))}
          </ul>
        ) : <p className="text-sm text-muted-foreground">{label('dk_no_payments')}</p>}
      </div>

      <figure className="rounded-lg border border-border bg-card" data-testid="parchi-preview">
        <figcaption className="px-4 py-2 border-b border-border text-sm font-medium text-muted-foreground">{label('dk_parchi_preview')}</figcaption>
        <div className="m-4 rounded-md border border-dashed border-border bg-background p-4 text-sm">
          <div className="text-center border-b border-dashed border-border pb-3">
            <p className="text-base font-semibold">{shopName}</p>
            {settings.address && <p className="text-muted-foreground">{settings.address}</p>}
            {settings.phone && !settings.hideShopPhone && <p dir="ltr" className="num text-muted-foreground">{settings.phone}</p>}
          </div>
          <dl className="grid grid-cols-2 gap-x-3 gap-y-1 py-3 border-b border-dashed border-border">
            <dt className="text-muted-foreground">DK</dt><dd className="num text-end font-semibold" dir="ltr">{order.serialNumber || '-'}</dd>
            <dt className="text-muted-foreground">{label('order_date')}</dt><dd className="text-end">{shortDate(order.orderDate, lang)}</dd>
            <dt className="text-muted-foreground">{label('delivery_date')}</dt><dd className="text-end font-semibold">{shortDate(order.deliveryDate, lang)}</dd>
          </dl>
          <table className="w-full my-3">
            <thead><tr className="text-muted-foreground"><th className="text-start font-medium">{label('dk_items')}</th><th className="text-end font-medium w-10">#</th><th className="text-end font-medium">{label('total')}</th></tr></thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.id}><td className="py-0.5">{gName(it.garmentType)}</td><td className="num text-end">{it.quantity}</td><td dir="ltr" className="num text-end">{rs(it.quantity * it.unitPrice)}</td></tr>
              ))}
            </tbody>
          </table>
          <dl className="grid grid-cols-2 gap-y-1 border-t border-dashed border-border pt-3">
            <dt>{label('total')}</dt><dd dir="ltr" className="num text-end font-semibold">{rs(order.totalAmount)}</dd>
            <dt>{label('dk_advance')}</dt><dd dir="ltr" className="num text-end">{rs(order.advanceAmount)}</dd>
            <dt className="font-semibold">{label('baqi')}</dt><dd dir="ltr" className={`num text-end text-base font-semibold ${due > 0 ? 'text-danger' : 'text-success'}`}>{rs(due)}</dd>
          </dl>
          {settings.thankYouMessage && <p className="text-center text-muted-foreground mt-3">{settings.thankYouMessage}</p>}
        </div>
        <div className="px-4 pb-4">
          <button type="button" onClick={() => onPrint(order)} className="w-full min-h-[44px] rounded-md border border-primary text-primary text-sm font-semibold inline-flex items-center justify-center gap-2 hover:bg-primary-soft" data-testid="detail-open-print"><Printer size={18} aria-hidden /> {label('dk_open_print')}</button>
        </div>
      </figure>
    </section>
  );
}

/** Desktop right panel when no order is selected: today's work from real orders. */
export function TodayPanel({ orders, onSelect }: { orders: Order[]; onSelect: (o: Order) => void }) {
  const { label, lang } = usePreferences();
  const { dueToday, overdue, collect, collectTotal } = useMemo(() => {
    const today = startOfDay(new Date()).getTime();
    const active = orders.filter((o) => o.status !== 'delivered');
    const dueToday = active.filter((o) => startOfDay(o.deliveryDate).getTime() === today);
    const overdue = active.filter((o) => isOverdue(o));
    const collect = active.filter((o) => balance(o) > 0 && (o.status === 'ready' || startOfDay(o.deliveryDate).getTime() <= today))
      .sort((a, b) => balance(b) - balance(a));
    return { dueToday, overdue, collect, collectTotal: collect.reduce((s, o) => s + balance(o), 0) };
  }, [orders]);
  const block = (title: string, Icon: typeof CalendarClock, list: Order[], tone: string, id: string, extra?: string) => (
    <div className="rounded-lg border border-border bg-card" data-testid={`today-${id}`}>
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border">
        <Icon size={16} aria-hidden className={tone} />
        <h3 className="flex-1 text-sm font-semibold">{title}</h3>
        {extra && <span dir="ltr" className="num text-sm font-semibold text-danger">{extra}</span>}
        <span className="num text-sm text-muted-foreground">{list.length}</span>
      </div>
      {list.length === 0 ? <p className="px-4 py-2 text-sm text-muted-foreground">{label('dk_none_here')}</p> : (
        <ul className="divide-y divide-border">
          {list.slice(0, 5).map((o) => (
            <li key={o.id}>
              <button type="button" onClick={() => onSelect(o)} className="w-full min-h-[40px] px-4 py-1.5 flex items-center gap-2 text-sm text-start hover:bg-muted" data-testid={`today-${id}-${o.id}`}>
                <span className="flex-1 min-w-0 truncate font-medium">{o.customerName}</span>
                <span dir="ltr" className="num text-xs text-muted-foreground">{o.serialNumber}</span>
                <span className="text-xs text-muted-foreground">{shortDate(o.deliveryDate, lang)}</span>
                {balance(o) > 0 && <span dir="ltr" className="num text-danger font-semibold">{rs(balance(o))}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
  return (
    <section className="space-y-3 dk-rise" aria-label={label('dk_today_title')} data-testid="today-panel">
      <div>
        <h2 className="text-base font-semibold">{label('dk_today_title')} <span className="text-sm font-normal text-muted-foreground">{shortDate(new Date(), lang)}</span></h2>
        <p className="text-sm text-muted-foreground">{label('dk_today_hint')}</p>
      </div>
      {block(label('dk_due_today'), CalendarClock, dueToday, 'text-primary', 'due')}
      {block(label('dk_overdue'), AlertTriangle, overdue, 'text-danger', 'overdue')}
      {block(label('dk_to_collect'), HandCoins, collect, 'text-warning', 'collect', money(collectTotal))}
    </section>
  );
}
