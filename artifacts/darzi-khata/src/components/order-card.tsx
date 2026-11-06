import { useState } from 'react';
import { Order, OrderStatus } from '../types/order';
import { Phone, ReceiptText, MessageCircle, Edit, Trash2, CalendarClock, AlertCircle, User, Wallet } from 'lucide-react';
import { PaymentUpdateDialog } from './payment-update-dialog';
import { ReminderButtons } from './reminder-buttons';
import { normalizePakistaniPhone } from '../lib/reminders';
import { StatusBadge, STATUS_META } from './status-meta';
import { FabricThumb } from './fabric-photo';
import { usePreferences } from '../hooks/use-preferences';
import { garment } from '../lib/garments';

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

const statusColors: Record<OrderStatus, string> = {
  pending: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600',
  stitching: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700',
  ready: 'bg-green-50 text-emerald-700 border-green-200 dark:bg-green-900/30 dark:text-emerald-300 dark:border-green-700',
  delivered: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-600',
};

const statusUrdu: Record<OrderStatus, string> = {
  pending: 'زیرِ التوا',
  stitching: 'سلائی جاری',
  ready: 'تیار',
  delivered: 'دے دیا',
};

export function OrderCard({ order, onEdit, onDelete, onViewReceipt, onStatusChange, onCustomerClick, onUpdatePayment, onChat }: OrderCardProps) {
  const [paymentOpen, setPaymentOpen] = useState(false);
  const { label } = usePreferences();
  const itemSummary = order.items?.length ? order.items.map((i) => `${label(garment(i.garmentType).en, garment(i.garmentType).ur)} x${i.quantity}`).join(', ') : `${order.suitCount} ${label('suits', 'جوڑے')}`;
  const baqi = order.totalAmount - order.advanceAmount;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const delivery = new Date(order.deliveryDate);
  delivery.setHours(0, 0, 0, 0);
  const diffTime = delivery.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  let deliveryText = '';
  let isOverdue = false;
  
  if (diffDays === 0) deliveryText = label('Today', 'آج');
  else if (diffDays === 1) deliveryText = label('Tomorrow', 'کل');
  else if (diffDays < 0) {
    deliveryText = label(`Overdue ${Math.abs(diffDays)} days`, `${Math.abs(diffDays)} دن دیر`);
    isOverdue = true;
  } else {
    deliveryText = label(`${diffDays} days left`, `${diffDays} دن باقی`);
  }

  return (
    <>
      <div
        className={`bg-card border border-card-border rounded-xl p-4 shadow-sm flex flex-col gap-3 relative overflow-hidden${isOverdue && order.status !== 'delivered' ? ' border-s-4 border-s-red-600' : ''}`}
        data-testid={`card-order-${order.id}`}
      >
        {order.urgent && (
          <div className="absolute top-0 end-0 bg-red-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg flex items-center gap-1">
            <AlertCircle size={10} aria-hidden /> {label('URGENT', 'ہنگامی')}
          </div>
        )}
        
        <div className="flex flex-col gap-3 pt-1 min-w-0">
          <div className="flex flex-col min-w-0">
            <div className="flex flex-wrap items-center gap-2 min-w-0">
              <button
                onClick={() => onCustomerClick(order.phone)}
                className="min-h-[44px] min-w-0 break-words text-lg font-bold text-foreground text-start hover:text-emerald-700 dark:hover:text-emerald-400 hover:underline transition-all"
                data-testid={`btn-customer-${order.id}`}
              >
                {order.customerName}
              </button>
              {order.serialNumber && (
                <span dir="ltr" className="whitespace-nowrap text-[10px] font-mono bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800 px-1.5 py-0.5 rounded">
                  {order.serialNumber}
                </span>
              )}
            </div>
            <div className="flex items-center text-sm text-muted-foreground mt-0.5 gap-1">
              <Phone size={14} />
              <a dir="ltr" href={`tel:${order.phone}`} className="hover:text-primary" data-testid={`link-phone-${order.id}`}>{order.phone}</a>
            </div>
            {order.karigar && (
              <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground">
                <User size={12} />
                <span>{order.karigar}</span>
              </div>
            )}
          </div>
          
          <div className="flex flex-wrap items-center justify-between gap-2 min-w-0 w-full">
          <StatusBadge order={order} />
          <select
            aria-label={label('Change status', 'حالت بدلیں')}
            className={`min-w-0 w-full sm:w-auto text-xs font-semibold min-h-[44px] px-2.5 rounded-lg border outline-none cursor-pointer ${statusColors[order.status]}`}
            value={order.status}
            onChange={(e) => onStatusChange(order.id, e.target.value as OrderStatus)}
            data-testid={`select-status-${order.id}`}
          >
            {(['pending', 'stitching', 'ready', 'delivered'] as OrderStatus[]).map((st) => (
              <option key={st} value={st}>{label(STATUS_META[st].en, statusUrdu[st])}</option>
            ))}
          </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1 min-w-0">
          <div className="flex flex-col gap-1 min-w-0">
            <div className="flex items-start gap-2 min-w-0">
              <FabricThumb id={order.fabricPhotoId} size={44} />
              <div className="text-sm font-medium text-foreground min-w-0 flex-1 break-words">{itemSummary}<span className="block text-xs text-muted-foreground break-words">{order.fabric}</span></div>
            </div>
            <div className={`text-xs flex items-center gap-1.5 ${isOverdue && order.status !== 'delivered' ? 'text-red-600 font-semibold' : 'text-muted-foreground'}`}>
              <CalendarClock size={14} />
              {deliveryText}
            </div>
          </div>
          
          <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">{label('Balance', 'باقی')}</div>
            {baqi > 0 ? (
              <div dir="ltr" className="text-lg font-bold text-red-600 dark:text-red-400 whitespace-nowrap">Rs {baqi.toLocaleString()}</div>
            ) : (
              <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded border border-emerald-100 dark:border-emerald-800">{label('Paid', 'ادا')}</div>
            )}
          </div>
        </div>

        {order.status !== 'pending' || order.totalAmount > order.advanceAmount ? (
          <ReminderButtons order={order} />
        ) : null}

        {/* Action Buttons */}
        <div className="grid grid-cols-4 items-center gap-2 mt-2 pt-3 border-t border-border">
          <button 
            onClick={() => onViewReceipt(order)}
            className="col-span-2 flex items-center justify-center gap-1.5 text-xs font-medium bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-300 min-h-[44px] py-2 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
            data-testid={`btn-receipt-${order.id}`}
          >
            <ReceiptText size={14} aria-hidden /> {label('Receipt', 'پرچی')}
          </button>
          <a 
            href={`https://wa.me/${normalizePakistaniPhone(order.phone)}`}
            target="_blank" rel="noreferrer"
            className="col-span-2 flex items-center justify-center gap-1.5 text-xs font-medium bg-[#E7F6EC] text-[#128C7E] min-h-[44px] py-2 rounded-lg hover:bg-[#D1F0DA] transition-colors"
            data-testid={`btn-wa-${order.id}`}
          >
            <MessageCircle size={14} /> WhatsApp
          </a>
          {onChat && (
            <button
              onClick={() => onChat(order)}
              className="relative min-h-[44px] min-w-[44px] flex items-center justify-center p-2 text-muted-foreground hover:text-emerald-700 dark:hover:text-emerald-400 bg-muted hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
              aria-label={label('Karigar chat', 'کاریگر سے بات')}
              title="Karigar se baat karein"
              data-testid={`btn-chat-${order.id}`}
            >
              <MessageCircle size={16} />
              {(order.comments?.length ?? 0) > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {order.comments!.length}
                </span>
              )}
            </button>
          )}
          {baqi > 0 && (
            <button
              onClick={() => setPaymentOpen(true)}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 text-amber-600 hover:text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/40 rounded-lg transition-colors"
              aria-label={label('Receive payment', 'رقم وصول کریں')}
              title="Advance Ada Karein"
              data-testid={`btn-payment-${order.id}`}
            >
              <Wallet size={16} />
            </button>
          )}
          <button 
            onClick={() => onEdit(order)}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 text-muted-foreground hover:text-emerald-700 dark:hover:text-emerald-400 bg-muted hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
            aria-label={label('Edit order', 'آرڈر بدلیں')}
            data-testid={`btn-edit-${order.id}`}
          >
            <Edit size={16} />
          </button>
          <button 
            onClick={() => onDelete(order.id)}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 text-muted-foreground hover:text-red-600 bg-muted hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            aria-label={label('Delete order', 'آرڈر حذف کریں')}
            data-testid={`btn-delete-${order.id}`}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <PaymentUpdateDialog
        order={order}
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
        onUpdatePayment={onUpdatePayment}
      />
    </>
  );
}
