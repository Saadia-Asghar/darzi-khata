import * as Dialog from '@radix-ui/react-dialog';
import { X, CalendarClock, MessageCircle, ReceiptText, Phone, AlertCircle } from 'lucide-react';
import { Order } from '../types/order';

interface DueTodayModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orders: Order[];
  onViewReceipt: (order: Order) => void;
}

export function DueTodayModal({ open, onOpenChange, orders, onViewReceipt }: DueTodayModalProps) {
  
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
      return encodeURIComponent(`Assalam o Alaikum ${order.customerName} bhai,\nAapka ${order.suitCount} suit (${order.fabric}) ready hai.\nBaqi rakam: Rs. ${baqi}\nShukriya! - Al-Madina Tailors`);
    };

    return (
      <div key={order.id} className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm relative">
        {order.urgent && <div className="absolute top-2 right-2 text-red-500"><AlertCircle size={16} /></div>}
        
        <div className="flex justify-between items-start mb-2 pr-6">
          <div>
            <h4 className="font-bold text-gray-900 leading-tight">{order.customerName}</h4>
            <a href={`tel:${order.phone}`} className="flex items-center text-xs text-gray-500 mt-0.5 gap-1 hover:text-emerald-600">
              <Phone size={12} /> {order.phone}
            </a>
          </div>
          <div className="text-right flex flex-col items-end">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Baqi</span>
            <span className={`text-sm font-bold ${baqi > 0 ? 'text-red-600' : 'text-emerald-600'}`}>Rs. {baqi}</span>
          </div>
        </div>
        
        <div className="text-xs font-medium text-gray-700 bg-gray-50 px-2 py-1.5 rounded-lg mb-3 inline-block">
          {order.suitCount} Jora — {order.fabric}
        </div>
        
        <div className="flex gap-2">
          <a 
            href={`https://wa.me/${order.phone.replace(/^0/, '92')}?text=${generateReminderMessage()}`}
            target="_blank" rel="noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 bg-[#E7F6EC] text-[#128C7E] py-2 rounded-lg text-xs font-bold hover:bg-[#D1F0DA] transition-colors"
          >
            <MessageCircle size={14} /> WhatsApp
          </a>
          <button 
            onClick={() => onViewReceipt(order)}
            className="flex-1 flex items-center justify-center gap-1.5 bg-gray-100 text-gray-700 py-2 rounded-lg text-xs font-bold hover:bg-gray-200 transition-colors"
          >
            <ReceiptText size={14} /> Parchi
          </button>
        </div>
      </div>
    );
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed inset-x-0 bottom-0 z-50 mt-24 h-[85dvh] flex flex-col rounded-t-[20px] bg-slate-50 border-t overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom shadow-2xl outline-none max-w-md mx-auto sm:h-[80vh] sm:bottom-auto sm:top-[50%] sm:-translate-y-1/2 sm:rounded-[20px]">
          
          <div className="px-5 py-4 border-b flex justify-between items-center bg-white shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
                <CalendarClock size={20} />
              </div>
              <div>
                <Dialog.Title className="text-lg font-bold text-gray-900">Aaj Ki Deliveries</Dialog.Title>
                <Dialog.Description className="text-gray-500 text-xs mt-0.5">Today & Tomorrow</Dialog.Description>
              </div>
            </div>
            <Dialog.Close asChild>
              <button className="h-8 w-8 inline-flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-gray-500" aria-label="Close">
                <X size={20} />
              </button>
            </Dialog.Close>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            
            {overdueOrders.length > 0 && (
              <section>
                <h3 className="text-xs font-bold text-red-600 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <AlertCircle size={14} /> Overdue ({overdueOrders.length})
                </h3>
                <div className="space-y-3">
                  {overdueOrders.map(renderCompactCard)}
                </div>
              </section>
            )}

            <section>
              <h3 className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-3 bg-emerald-100 inline-block px-3 py-1 rounded-full">
                Aaj / Today ({todayOrders.length})
              </h3>
              {todayOrders.length === 0 ? (
                <div className="text-center py-6 bg-white border border-dashed border-gray-200 rounded-xl">
                  <p className="text-sm font-bold text-gray-400">Aaj koi delivery nahi!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {todayOrders.map(renderCompactCard)}
                </div>
              )}
            </section>

            <section>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 bg-gray-200 inline-block px-3 py-1 rounded-full">
                Kal / Tomorrow ({tomorrowOrders.length})
              </h3>
              {tomorrowOrders.length === 0 ? (
                <div className="text-center py-4 bg-transparent border border-dashed border-gray-200 rounded-xl">
                  <p className="text-sm font-bold text-gray-400">Kal koi delivery nahi</p>
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