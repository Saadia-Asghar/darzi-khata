import { useState, type MouseEvent, type KeyboardEvent } from 'react';
import { Order, OrderStatus } from '../types/order';
import { ReceiptText, MessageCircle, Pencil, Trash2, Wallet, MoreHorizontal, MessagesSquare, Phone } from 'lucide-react';
import { PaymentUpdateDialog } from './payment-update-dialog';
import { normalizePakistaniPhone } from '../lib/reminders';
import { usePreferences } from '../hooks/use-preferences';
import { garment } from '../lib/garments';
import { balance } from '../lib/payments';
import { deliveryWords, money, shortDate, fabricName } from '../lib/i18n';
import { StatusMenu } from './status-menu';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface OrderCardProps {
  order: Order;
  onEdit: (order: Order) => void;
  onDelete: (id: string) => void;
  onViewReceipt: (order: Order) => void;
  onStatusChange: (id: string, status: OrderStatus) => void;
  onCustomerClick: (phone: string) => void;
  onUpdatePayment?: (id: string, newAdvance: number) => void;
  onChat?: (order: Order) => void;
  /** Tapping the card body (not a control) opens the full order details. */
  onOpen?: (order: Order) => void;
  selected?: boolean;
}

/** Clicks on real controls inside the card must not also open the details. */
const fromControl = (e: MouseEvent | KeyboardEvent) =>
  !!(e.target as HTMLElement).closest('button, a, input, [role="menuitem"]') && e.target !== e.currentTarget;

function useOrderBits(order: Order) {
  const { label, one, lang } = usePreferences();
  const baqi = balance(order);
  const garments = order.items?.length
    ? order.items.map((i) => `${i.quantity} ${one(garment(i.garmentType).tk)}`).join(', ')
    : `${order.suitCount} ${one('suits_unit')}`;
  const when = deliveryWords(order.deliveryDate);
  const late = when.late && order.status !== 'delivered';
  const whenText = order.status === 'delivered'
    ? `${label('status_delivered')} · ${shortDate(order.deliveredAt ?? order.deliveryDate, lang)}`
    : late ? label(when.tk, when.vars) : `${label(when.tk, when.vars)} · ${shortDate(order.deliveryDate, lang)}`;
  const fabric = order.fabric ? fabricName(order.fabric, lang) : '';
  return { label, one, baqi, garments, late, whenText, fabric };
}

function OverflowMenu({ order, onEdit, onDelete, onChat }: Pick<OrderCardProps, 'order' | 'onEdit' | 'onDelete' | 'onChat'>) {
  const { label } = usePreferences();
  const comments = order.comments?.length ?? 0;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className="min-h-[32px] h-8 min-w-[36px] px-2 inline-flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted" aria-label={label('action_more_actions')} data-testid={`btn-overflow-${order.id}`}>
          <MoreHorizontal size={18} aria-hidden />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[220px] rounded-lg p-1">
        <DropdownMenuItem asChild className="min-h-[44px] gap-3 text-base">
          <a href={`tel:${order.phone}`} data-testid={`link-phone-${order.id}`}><Phone size={18} aria-hidden /> {label('call')} <span dir="ltr" className="num text-sm text-muted-foreground ms-auto">{order.phone}</span></a>
        </DropdownMenuItem>
        {onChat && <DropdownMenuItem onSelect={() => onChat(order)} className="min-h-[44px] gap-3 text-base" data-testid={`btn-chat-${order.id}`}><MessagesSquare size={18} aria-hidden /> {label('order_notes_count', { n: comments })}</DropdownMenuItem>}
        <DropdownMenuItem onSelect={() => onEdit(order)} className="min-h-[44px] gap-3 text-base" data-testid={`btn-edit-${order.id}`}><Pencil size={18} aria-hidden /> {label('action_edit')}</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => onDelete(order.id)} className="min-h-[44px] gap-3 text-base text-danger focus:text-danger" data-testid={`btn-delete-${order.id}`}><Trash2 size={18} aria-hidden /> {label('action_delete')}</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const act = 'min-h-[32px] h-8 px-2 inline-flex items-center justify-center gap-1 rounded-md text-xs font-medium text-foreground hover:bg-muted whitespace-nowrap';

/** Compact phone/tablet card: three rows, about 120px tall. */
export function OrderCard({ order, onEdit, onDelete, onViewReceipt, onStatusChange, onCustomerClick, onChat, onOpen, selected }: OrderCardProps) {
  const [paymentOpen, setPaymentOpen] = useState(false);
  const { label, one, baqi, garments, late, whenText, fabric } = useOrderBits(order);
  return (<>
    <article
      className={`bg-card border rounded-lg p-3 flex flex-col gap-1.5 ${onOpen ? 'cursor-pointer' : ''} ${selected ? 'border-primary' : 'border-border'}`}
      data-testid={`card-order-${order.id}`} aria-label={`${order.customerName} ${order.serialNumber ?? ''}`}
      onClick={(e) => { if (onOpen && !fromControl(e)) onOpen(order); }}>
      <div className="flex items-center gap-2 min-w-0 h-7">
        <button type="button" onClick={() => onCustomerClick(order.customerId ?? order.phone)} className="min-h-[28px] min-w-0 truncate text-base font-semibold text-start hover:underline underline-offset-4" data-testid={`btn-customer-${order.id}`}>
          {order.customerName}
        </button>
        {order.serialNumber && <span dir="ltr" className="num text-xs text-muted-foreground whitespace-nowrap shrink-0">{order.serialNumber}</span>}
        {order.urgent && <span className="shrink-0 rounded-md bg-danger-soft text-danger border border-danger/30 px-1 text-xs font-medium" data-testid={`chip-urgent-${order.id}`}>{label('urgent_chip')}</span>}
        <span className="ms-auto shrink-0"><StatusMenu order={order} onChange={onStatusChange} compact /></span>
      </div>

      <div className="flex items-center gap-2 min-w-0 text-sm leading-5">
        <p className="flex-1 min-w-0 truncate text-sm" data-testid={`delivery-${order.id}`}>
          <span>{garments}{fabric ? ` · ${fabric}` : ''}</span>
          <span className={late ? 'text-danger font-semibold' : 'text-muted-foreground'}> · {whenText}</span>
          {order.karigar && <span className="text-muted-foreground"> · {order.karigar}</span>}
        </p>
        {baqi > 0
          ? <span dir="ltr" className="num shrink-0 text-sm font-semibold text-danger whitespace-nowrap" data-testid={`baqi-${order.id}`}>{money(baqi)}</span>
          : <span className="shrink-0 rounded-md bg-success-soft text-success px-1.5 text-xs font-medium" data-testid={`chip-paid-${order.id}`}>{label('paid_chip')}</span>}
      </div>

      <div className="flex items-center gap-1 -mx-1 border-t border-border pt-1.5">
        <button type="button" onClick={() => onViewReceipt(order)} className={act} data-testid={`btn-receipt-${order.id}`}><ReceiptText size={16} aria-hidden /><span>{one('action_parchi')}</span></button>
        <a href={`https://wa.me/${normalizePakistaniPhone(order.phone)}`} target="_blank" rel="noreferrer" className={act} data-testid={`btn-wa-${order.id}`}><MessageCircle size={16} aria-hidden className="text-success" /><span>{one('action_whatsapp')}</span></a>
        {baqi > 0 && <button type="button" onClick={() => setPaymentOpen(true)} className={act} data-testid={`btn-payment-${order.id}`}><Wallet size={16} aria-hidden /><span>{one('action_payment')}</span></button>}
        <span className="ms-auto"><OverflowMenu order={order} onEdit={onEdit} onDelete={onDelete} onChat={onChat} /></span>
      </div>
    </article>
    <PaymentUpdateDialog order={order} open={paymentOpen} onOpenChange={setPaymentOpen} />
  </>);
}

/** Desktop dense list row: DK, customer, garments, delivery, status, baqi, actions. */
export const ORDER_ROW_GRID = 'grid grid-cols-[72px_minmax(0,1.3fr)_minmax(0,1.4fr)_minmax(0,1fr)_auto_96px_auto] items-center gap-3';

export function OrderRow({ order, onEdit, onDelete, onViewReceipt, onStatusChange, onChat, onOpen, selected }: OrderCardProps) {
  const [paymentOpen, setPaymentOpen] = useState(false);
  const { label, one, baqi, garments, late, whenText, fabric } = useOrderBits(order);
  return (<>
    <div role="row" tabIndex={0} aria-selected={selected}
      className={`${ORDER_ROW_GRID} px-3 py-2 min-h-[52px] cursor-pointer text-sm ${selected ? 'bg-primary-soft' : 'hover:bg-muted/60'}`}
      data-testid={`card-order-${order.id}`} aria-label={`${order.customerName} ${order.serialNumber ?? ''}`}
      onClick={(e) => { if (onOpen && !fromControl(e)) onOpen(order); }}
      onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && e.target === e.currentTarget) { e.preventDefault(); onOpen?.(order); } }}>
      <span dir="ltr" className="num text-xs text-muted-foreground truncate">{order.serialNumber || '-'}</span>
      <span className="min-w-0 truncate font-semibold">{order.customerName}{order.urgent && <span className="ms-1.5 rounded-md bg-danger-soft text-danger px-1 text-xs font-medium">{label('urgent_chip')}</span>}</span>
      <span className="min-w-0 truncate">{garments}{fabric ? <span className="text-muted-foreground"> · {fabric}</span> : null}{order.karigar && <span className="text-muted-foreground"> · {order.karigar}</span>}</span>
      <span className={`min-w-0 truncate ${late ? 'text-danger font-semibold' : 'text-muted-foreground'}`} data-testid={`delivery-${order.id}`}>{whenText}</span>
      <StatusMenu order={order} onChange={onStatusChange} compact />
      <span className="text-end">
        {baqi > 0
          ? <span dir="ltr" className="num font-semibold text-danger whitespace-nowrap" data-testid={`baqi-${order.id}`}>{money(baqi)}</span>
          : <span className="rounded-md bg-success-soft text-success px-1.5 text-xs font-medium" data-testid={`chip-paid-${order.id}`}>{label('paid_chip')}</span>}
      </span>
      <span className="flex items-center">
        <button type="button" onClick={() => onViewReceipt(order)} className="min-h-[32px] h-8 w-8 inline-flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted" aria-label={one('action_parchi')} title={one('action_parchi')} data-testid={`btn-receipt-${order.id}`}><ReceiptText size={16} aria-hidden /></button>
        <a href={`https://wa.me/${normalizePakistaniPhone(order.phone)}`} target="_blank" rel="noreferrer" className="h-8 w-8 inline-flex items-center justify-center rounded-md text-success hover:bg-muted" aria-label={one('action_whatsapp')} title={one('action_whatsapp')} data-testid={`btn-wa-${order.id}`}><MessageCircle size={16} aria-hidden /></a>
        {baqi > 0
          ? <button type="button" onClick={() => setPaymentOpen(true)} className="min-h-[32px] h-8 w-8 inline-flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted" aria-label={one('action_payment')} title={one('action_payment')} data-testid={`btn-payment-${order.id}`}><Wallet size={16} aria-hidden /></button>
          : <span className="w-8" aria-hidden />}
        <OverflowMenu order={order} onEdit={onEdit} onDelete={onDelete} onChat={onChat} />
      </span>
    </div>
    <PaymentUpdateDialog order={order} open={paymentOpen} onOpenChange={setPaymentOpen} />
  </>);
}
