import { useState } from 'react';
import { Order, OrderStatus } from '../types/order';
import { ReceiptText, MessageCircle, Pencil, Trash2, Wallet, MoreHorizontal, MessagesSquare, Phone } from 'lucide-react';
import { PaymentUpdateDialog } from './payment-update-dialog';
import { normalizePakistaniPhone } from '../lib/reminders';
import { FabricThumb } from './fabric-photo';
import { usePreferences } from '../hooks/use-preferences';
import { garment } from '../lib/garments';
import { balance } from '../lib/payments';
import { deliveryWords, money, shortDate } from '../lib/i18n';
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
}

export function OrderCard({ order, onEdit, onDelete, onViewReceipt, onStatusChange, onCustomerClick, onUpdatePayment, onChat }: OrderCardProps) {
  const [paymentOpen, setPaymentOpen] = useState(false);
  const { label, one, lang } = usePreferences();
  const baqi = balance(order);
  const garments = order.items?.length
    ? order.items.map((i) => `${i.quantity} ${one(garment(i.garmentType).tk)}`).join(', ')
    : `${order.suitCount} ${one('suits_unit')}`;
  const when = deliveryWords(order.deliveryDate);
  const late = when.late && order.status !== 'delivered';
  const comments = order.comments?.length ?? 0;

  return (
    <article className="bg-card border border-border rounded-lg p-4 flex flex-col gap-3" data-testid={`card-order-${order.id}`} aria-label={`${order.customerName} ${order.serialNumber ?? ''}`}>
      <div className="flex items-start gap-3 min-w-0">
        <FabricThumb id={order.fabricPhotoId} size={44} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 min-w-0">
            <button onClick={() => onCustomerClick(order.phone)} className="min-h-[32px] min-w-0 text-lg font-semibold text-foreground text-start [overflow-wrap:anywhere] hover:underline underline-offset-4" data-testid={`btn-customer-${order.id}`}>
              {order.customerName}
            </button>
            {order.serialNumber && <span dir="ltr" className="num text-sm text-muted-foreground whitespace-nowrap">{order.serialNumber}</span>}
            {order.urgent && <span className="inline-flex items-center rounded-md bg-danger-soft text-danger border border-danger/30 px-1.5 text-sm font-medium" data-testid={`chip-urgent-${order.id}`}>{label('urgent_chip')}</span>}
          </div>
          <p className="text-base text-foreground mt-0.5 [overflow-wrap:anywhere]">{garments}{order.fabric ? ` · ${order.fabric}` : ''}</p>
          <p className={`text-sm mt-0.5 ${late ? 'text-danger font-semibold' : 'text-muted-foreground'}`} data-testid={`delivery-${order.id}`}>
            {order.status === 'delivered'
              ? `${label('status_delivered')} · ${shortDate(order.deliveredAt ?? order.deliveryDate, lang)}`
              : `${label(when.tk, when.vars)} · ${shortDate(order.deliveryDate, lang)}`}
          </p>
          {order.karigar && <p className="text-sm text-muted-foreground mt-0.5">{order.karigar}</p>}
        </div>
        <div className="shrink-0 text-end">
          {baqi > 0 ? (
            <>
              <div dir="ltr" className="num text-lg font-semibold text-danger whitespace-nowrap" data-testid={`baqi-${order.id}`}>{money(baqi)}</div>
              <div className="text-sm text-muted-foreground">{one('baqi')}</div>
            </>
          ) : (
            <span className="inline-flex items-center rounded-md bg-success-soft text-success border border-success/30 px-2 py-0.5 text-sm font-medium" data-testid={`chip-paid-${order.id}`}>{label('paid_chip')}</span>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        <StatusMenu order={order} onChange={onStatusChange} />
        <div className="flex items-center gap-1">
          <a href={`tel:${order.phone}`} className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted" aria-label={`${label('call')} ${order.phone}`} data-testid={`link-phone-${order.id}`}><Phone size={20} aria-hidden /></a>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" className="relative min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted" aria-label={label('action_more_actions')} data-testid={`btn-overflow-${order.id}`}>
                <MoreHorizontal size={20} aria-hidden />
                {comments > 0 && <span className="num absolute top-1 end-1 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-xs leading-[18px] text-center">{comments}</span>}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[220px] rounded-lg p-1">
              <DropdownMenuItem onSelect={() => onEdit(order)} className="min-h-[48px] gap-3 text-base" data-testid={`btn-edit-${order.id}`}><Pencil size={18} aria-hidden /> {label('action_edit')}</DropdownMenuItem>
              {onChat && <DropdownMenuItem onSelect={() => onChat(order)} className="min-h-[48px] gap-3 text-base" data-testid={`btn-chat-${order.id}`}><MessagesSquare size={18} aria-hidden /> {label('action_chat')}{comments > 0 ? ` (${comments})` : ''}</DropdownMenuItem>}
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => onDelete(order.id)} className="min-h-[48px] gap-3 text-base text-danger focus:text-danger" data-testid={`btn-delete-${order.id}`}><Trash2 size={18} aria-hidden /> {label('action_delete')}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border">
        <button onClick={() => onViewReceipt(order)} className="min-h-[48px] rounded-md border border-border bg-card text-sm font-medium inline-flex flex-col items-center justify-center gap-0.5 hover:bg-muted" data-testid={`btn-receipt-${order.id}`}>
          <ReceiptText size={20} aria-hidden /><span>{one('action_parchi')}</span>
        </button>
        <a href={`https://wa.me/${normalizePakistaniPhone(order.phone)}`} target="_blank" rel="noreferrer" className="min-h-[48px] rounded-md border border-border bg-card text-sm font-medium inline-flex flex-col items-center justify-center gap-0.5 hover:bg-muted" data-testid={`btn-wa-${order.id}`}>
          <MessageCircle size={20} aria-hidden className="text-success" /><span>{one('action_whatsapp')}</span>
        </a>
        <button onClick={() => setPaymentOpen(true)} disabled={baqi <= 0} className="min-h-[48px] rounded-md border border-border bg-card text-sm font-medium inline-flex flex-col items-center justify-center gap-0.5 hover:bg-muted disabled:opacity-50" data-testid={`btn-payment-${order.id}`}>
          <Wallet size={20} aria-hidden /><span>{one('action_payment')}</span>
        </button>
      </div>

      <PaymentUpdateDialog order={order} open={paymentOpen} onOpenChange={setPaymentOpen} onUpdatePayment={onUpdatePayment} />
    </article>
  );
}
