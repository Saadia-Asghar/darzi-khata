import { useState } from 'react';
import { Order, OrderStatus } from '../types/order';
import { Phone, ReceiptText, MessageCircle, Edit, Trash2, CalendarClock, AlertCircle, User, Wallet } from 'lucide-react';
import { PaymentUpdateDialog } from './payment-update-dialog';

interface OrderCardProps {
  order: Order;
  onEdit: (order: Order) => void;
  onDelete: (id: string) => void;
  onViewReceipt: (order: Order) => void;
  onStatusChange: (id: string, status: OrderStatus) => void;
  onCustomerClick: (phone: string) => void;
  onUpdatePayment: (id: string, newAdvance: number) => void;
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

export function OrderCard({ order, onEdit, onDelete, onViewReceipt, onStatusChange, onCustomerClick, onUpdatePayment }: OrderCardProps) {
  const [paymentOpen, setPaymentOpen] = useState(false);
  const baqi = order.totalAmount - order.advanceAmount;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const delivery = new Date(order.deliveryDate);
  delivery.setHours(0, 0, 0, 0);
  const diffTime = delivery.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  let deliveryText = '';
  let isOverdue = false;
  
  if (diffDays === 0) deliveryText = 'Aaj (Today)';
  else if (diffDays === 1) deliveryText = 'Kal (Tomorrow)';
  else if (diffDays < 0) {
    deliveryText = `Overdue: ${Math.abs(diffDays)} din`;
    isOverdue = true;
  } else {
    deliveryText = `${diffDays} din baqi`;
  }

  return (
    <>
      <div
        className={`bg-card border border-card-border rounded-xl p-4 shadow-sm flex flex-col gap-3 relative overflow-hidden${isOverdue && order.status !== 'delivered' ? ' border-l-4 border-l-red-500' : ''}`}
        data-testid={`card-order-${order.id}`}
      >
        {order.urgent && (
          <div className="absolute top-0 right-0 bg-red-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg flex items-center gap-1">
            <AlertCircle size={10} /> URGENT
          </div>
        )}
        
        <div className="flex justify-between items-start pt-1">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <button
                onClick={() => onCustomerClick(order.phone)}
                className="text-lg font-bold text-foreground text-left hover:text-emerald-700 dark:hover:text-emerald-400 hover:underline transition-all"
                data-testid={`btn-customer-${order.id}`}
              >
                {order.customerName}
              </button>
              {order.serialNumber && (
                <span className="text-[10px] font-mono bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800 px-1.5 py-0.5 rounded">
                  {order.serialNumber}
                </span>
              )}
            </div>
            <div className="flex items-center text-sm text-muted-foreground mt-0.5 gap-1">
              <Phone size={14} />
              <a href={`tel:${order.phone}`} className="hover:text-primary" data-testid={`link-phone-${order.id}`}>{order.phone}</a>
            </div>
            {order.karigar && (
              <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground">
                <User size={12} />
                <span>{order.karigar}</span>
              </div>
            )}
          </div>
          
          <select 
            className={`text-xs font-semibold px-2.5 py-1.5 rounded-full border outline-none appearance-none cursor-pointer ${statusColors[order.status]}`}
            value={order.status}
            onChange={(e) => onStatusChange(order.id, e.target.value as OrderStatus)}
            data-testid={`select-status-${order.id}`}
          >
            <option value="pending">Pending ({statusUrdu.pending})</option>
            <option value="stitching">Stitching ({statusUrdu.stitching})</option>
            <option value="ready">Ready ({statusUrdu.ready})</option>
            <option value="delivered">Delivered ({statusUrdu.delivered})</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-1">
          <div className="flex flex-col gap-1">
            <div className="text-sm font-medium text-foreground">{order.suitCount} Jora — {order.fabric}</div>
            <div className={`text-xs flex items-center gap-1.5 ${isOverdue && order.status !== 'delivered' ? 'text-red-600 font-semibold' : 'text-muted-foreground'}`}>
              <CalendarClock size={14} />
              {deliveryText}
            </div>
          </div>
          
          <div className="flex flex-col items-end justify-center">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Baqi (Balance)</div>
            {baqi > 0 ? (
              <div className="text-lg font-bold text-red-600">Rs. {baqi.toLocaleString()}</div>
            ) : (
              <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded border border-emerald-100 dark:border-emerald-800">Paid / Ada</div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 mt-2 pt-3 border-t border-border">
          <button 
            onClick={() => onViewReceipt(order)}
            className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-300 py-2 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
            data-testid={`btn-receipt-${order.id}`}
          >
            <ReceiptText size={14} /> Parchi
          </button>
          <a 
            href={`https://wa.me/${order.phone.replace(/^0/, '92')}`}
            target="_blank" rel="noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium bg-[#E7F6EC] text-[#128C7E] py-2 rounded-lg hover:bg-[#D1F0DA] transition-colors"
            data-testid={`btn-wa-${order.id}`}
          >
            <MessageCircle size={14} /> WhatsApp
          </a>
          {baqi > 0 && (
            <button
              onClick={() => setPaymentOpen(true)}
              className="p-2 text-amber-600 hover:text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/40 rounded-lg transition-colors"
              aria-label="Update Payment"
              title="Advance Ada Karein"
              data-testid={`btn-payment-${order.id}`}
            >
              <Wallet size={16} />
            </button>
          )}
          <button 
            onClick={() => onEdit(order)}
            className="p-2 text-muted-foreground hover:text-emerald-700 dark:hover:text-emerald-400 bg-muted hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
            aria-label="Edit"
            data-testid={`btn-edit-${order.id}`}
          >
            <Edit size={16} />
          </button>
          <button 
            onClick={() => {
              if (window.confirm('Kya aap waqai is order ko delete karna chahte hain?')) {
                onDelete(order.id);
              }
            }}
            className="p-2 text-muted-foreground hover:text-red-600 bg-muted hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            aria-label="Delete"
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
