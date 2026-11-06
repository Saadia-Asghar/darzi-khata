import { tl } from '../lib/i18n';
import { usePreferences } from '../hooks/use-preferences';
import * as Dialog from './page-dialog';
import { X, CalendarClock, MessageCircle, ReceiptText, Phone, AlertCircle } from 'lucide-react';
import { Order } from '../types/order';
import { ReminderButtons } from './reminder-buttons';
import { StatusBadge } from './status-meta';
import { useSettings } from '../hooks/use-settings';
import { normalizePakistaniPhone, reminderText } from '../lib/reminders';

interface DueTodayModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orders: Order[];
  onViewReceipt: (order: Order) => void;
}

export function DueTodayModal({ open, onOpenChange, orders, onViewReceipt }: DueTodayModalProps) {
  const { settings } = useSettings();
  const { label } = usePreferences();
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const activeOrders = orders.filter(o => o.status !== 'delivered');

  const todayOrders = activeOrders.filter(o => {
    const dDate = new Date(o.deliveryDate);
    dDate.setHours(0, 0, 0, 0);
    return dDate.getTime() === today.getTime();
  });

  const tomorrowOrders = activeOrders.filter(o => {
    const dDate = new Date(o.deliveryDate);
    dDate.setHours(0, 0, 0, 0);
    return dDate.getTime() === tomorrow.getTime();
  });

  const overdueOrders = activeOrders.filter(o => {
    const dDate = new Date(o.deliveryDate);
    dDate.setHours(0, 0, 0, 0);
    return dDate.getTime() < today.getTime();
  });

  const renderCompactCard = (order: Order) => {
    const baqi = order.totalAmount - order.advanceAmount;
    
    const generateReminderMessage = () => {
      const isTomorrow = new Date(order.deliveryDate).toDateString() === tomorrow.toDateString();
      return encodeURIComponent(order.status === 'ready'
        ? reminderText(order, 'ready', settings)
        : isTomorrow ? reminderText(order, 'tomorrow', settings)
        : tl('m_assalam_o_alaikum_customername_order_ser', { customerName: order.customerName, serialNumber: order.serialNumber || '', toLocaleDateString: new Date(order.deliveryDate).toLocaleDateString(), baqi, shopName: settings.shopName }));
    };

    return (
      <div key={order.id} className="bg-card border border-border rounded-lg p-3  relative">
        {order.urgent && <div className="absolute top-2 end-2 text-danger"><AlertCircle size={16} aria-label={label('urgent')} /></div>}
        
        <div className="flex justify-between items-start mb-2 pe-6">
          <div>
            <h4 className="font-bold text-foreground leading-tight flex items-center gap-1.5"><StatusBadge order={order} compact />{order.customerName}</h4>
            <a href={`tel:${order.phone}`} className="flex items-center text-sm text-muted-foreground mt-0.5 gap-1 hover:text-primary">
              <Phone size={12} /> {order.phone}
            </a>
          </div>
          <div className="text-end flex flex-col items-end">
            <span className="text-xs text-muted-foreground font-bold  ">{label('balance_2')}</span>
            <span className={`text-sm font-bold ${baqi > 0 ? 'text-danger' : 'text-primary'}`}>Rs {baqi}</span>
          </div>
        </div>
        
        <div className="text-sm font-medium text-foreground bg-muted px-2 py-1.5 rounded-lg mb-3 inline-block">
          {label('t_n_suits', { suitCount: order.suitCount })} · {order.fabric}
        </div>
        
 <div className="mb-2"><ReminderButtons order={order} compact /></div>
        <div className="flex gap-2">
          <a 
            href={`https://wa.me/${normalizePakistaniPhone(order.phone)}?text=${generateReminderMessage()}`}
            target="_blank" rel="noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 bg-success-soft text-success min-h-[44px] rounded-lg text-sm font-bold hover:bg-success-soft transition-colors"
          >
            <MessageCircle size={14} /> WhatsApp
          </a>
          <button 
            onClick={() => onViewReceipt(order)}
            className="flex-1 flex items-center justify-center gap-1.5 bg-muted text-foreground min-h-[44px] rounded-lg text-sm font-bold hover:bg-accent transition-colors"
          >
            <ReceiptText size={14} aria-hidden /> {label('receipt')}
          </button>
        </div>
      </div>
    );
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-foreground/60 z-50  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed inset-x-0 bottom-0 z-50 mt-24 h-[85dvh] flex flex-col rounded-t-lg bg-background border-t overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom  outline-none max-w-md mx-auto sm:h-[80vh] sm:bottom-auto sm:top-[50%] sm:-translate-y-1/2 sm:rounded-[20px]">
          
          <div className="px-5 py-4 border-b flex justify-between items-center bg-card shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-danger-soft text-danger rounded-full flex items-center justify-center">
                <CalendarClock size={20} />
              </div>
              <div>
                <Dialog.Title className="text-lg font-bold text-foreground">{label('deliveries_due')}</Dialog.Title>
                <Dialog.Description className="text-muted-foreground text-sm mt-0.5">{label('overdue_today_and_tomorrow')}</Dialog.Description>
              </div>
            </div>
            <Dialog.Close asChild>
              <button className="h-11 w-11 inline-flex items-center justify-center rounded-full bg-muted hover:bg-accent transition-colors text-muted-foreground" aria-label={label('close')}>
                <X size={20} />
              </button>
            </Dialog.Close>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            
            {overdueOrders.length > 0 && (
              <section>
                <h3 className="text-sm font-bold text-danger   mb-3 flex items-center gap-2">
                  <AlertCircle size={14} aria-hidden /> {label('overdue')} ({overdueOrders.length})
                </h3>
                <div className="space-y-3">
                  {overdueOrders.map(renderCompactCard)}
                </div>
              </section>
            )}

            <section>
              <h3 className="text-sm font-bold text-primary   mb-3 bg-primary-soft inline-block px-3 py-1 rounded-full">
                {label('today')} ({todayOrders.length})
              </h3>
              {todayOrders.length === 0 ? (
                <div className="text-center py-6 bg-card border border-dashed border-border rounded-lg">
                  <p className="text-sm font-bold text-muted-foreground">{label('no_deliveries_today')}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {todayOrders.map(renderCompactCard)}
                </div>
              )}
            </section>

            <section>
              <h3 className="text-sm font-bold text-muted-foreground   mb-3 bg-muted inline-block px-3 py-1 rounded-full">
                {label('tomorrow')} ({tomorrowOrders.length})
              </h3>
              {tomorrowOrders.length === 0 ? (
                <div className="text-center py-4 bg-transparent border border-dashed border-border rounded-lg">
                  <p className="text-sm font-bold text-muted-foreground">{label('no_deliveries_tomorrow')}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {tomorrowOrders.map(renderCompactCard)}
                </div>
              )}
            </section>

          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}