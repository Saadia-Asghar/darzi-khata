import { Printer, Pencil, MessageSquare, Phone, ClipboardList } from 'lucide-react';
import type { Order } from '../types/order';
import { usePreferences } from '../hooks/use-preferences';
import { useSettings } from '../hooks/use-settings';
import { GARMENTS } from '../lib/garments';
import { balance } from '../lib/payments';
import { shortDate } from '../lib/i18n';
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
      <div className="rounded-lg border border-dashed border-border bg-card p-8 text-center" data-testid="order-detail-empty">
        <ClipboardList size={28} aria-hidden className="mx-auto text-muted-foreground mb-2" />
        <p className="text-base text-muted-foreground">{label('dk_select_order')}</p>
      </div>
    );
  }
  const items = order.items?.length ? order.items : [{ id: 'legacy', garmentType: 'gents' as const, quantity: order.suitCount, unitPrice: order.suitCount ? order.totalAmount / order.suitCount : order.totalAmount, measurements: {} }];
  const gName = (t: string) => { const g = GARMENTS.find((x) => x.value === t); return g ? label(g.tk) : t; };
  const shopName = (lang === 'ur' && settings.shopNameUrdu) || settings.shopName || shopFallback;
  const due = balance(order);
  return (
    <section className="space-y-4 dk-rise" key={order.id} aria-label={label('dk_parchi_preview')} data-testid="order-detail-pane">
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
