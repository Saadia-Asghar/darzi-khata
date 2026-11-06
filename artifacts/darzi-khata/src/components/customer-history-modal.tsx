import { usePreferences } from '../hooks/use-preferences';
import * as Dialog from './page-dialog';
import { X, Scissors, Phone, Copy, ArrowRight } from 'lucide-react';
import { Order } from '../types/order';
import { StatusBadge } from './status-meta';
import { FabricThumb } from './fabric-photo';
import { garment } from '../lib/garments';

interface CustomerHistoryModalProps {
  phone: string | null;
  onClose: () => void;
  orders: Order[];
  onCopyMeasurements: (order: Order) => void;
}

export function CustomerHistoryModal({ phone, onClose, orders, onCopyMeasurements }: CustomerHistoryModalProps) {
  const { label } = usePreferences();
  if (!phone) return null;

  // Find all orders for this phone, sorted newest first
  const customerOrders = orders
    .filter(o => o.phone === phone)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  if (customerOrders.length === 0) return null;

  const customerName = customerOrders[0].customerName;
  const totalSpent = customerOrders.reduce((sum, o) => sum + o.totalAmount, 0);


  return (
    <Dialog.Root open={!!phone} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-foreground/60 z-50  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg bg-background p-0  outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 overflow-hidden max-h-[85vh] flex flex-col">
          
          <div className="px-5 py-4 border-b flex justify-between items-start bg-card shrink-0">
            <div>
              <Dialog.Title className="text-xl font-bold text-foreground">{customerName}</Dialog.Title>
              <div className="flex items-center text-primary text-sm font-mono mt-1 gap-1.5 font-semibold">
                <Phone size={14} /> {phone}
              </div>
            </div>
            <Dialog.Close asChild>
              <button className="h-11 w-11 inline-flex items-center justify-center rounded-full bg-muted hover:bg-accent transition-colors text-muted-foreground" aria-label={label('close')}>
                <X size={20} />
              </button>
            </Dialog.Close>
          </div>

          <div className="grid grid-cols-2 bg-card text-foreground border-border p-4 shrink-0">
            <div>
              <div className="text-xs text-muted-foreground   font-semibold">{label('total_orders')}</div>
              <div className="text-2xl font-bold">{customerOrders.length}</div>
            </div>
            <div className="text-end">
              <div className="text-xs text-muted-foreground   font-semibold">{label('total_business')}</div>
              <div className="text-xl font-bold">Rs. {totalSpent.toLocaleString()}</div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <h3 className="text-sm font-bold text-muted-foreground   mb-2">{label('order_history')}</h3>
            
            {customerOrders.map(order => {
              const baqi = order.totalAmount - order.advanceAmount;
              return (
                <div key={order.id} className="bg-card border border-border rounded-lg p-4  relative overflow-hidden">
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-sm font-bold text-foreground">{new Date(order.createdAt).toLocaleDateString()}</div>
                    <StatusBadge order={order} />
                  </div>
                  
                  <div className="text-sm text-muted-foreground mb-3">
                    <span className="flex items-center gap-2"><FabricThumb id={order.fabricPhotoId} size={36} /><span>{order.items?.length ? order.items.map((i) => `${label(garment(i.garmentType).tk)} x${i.quantity}`).join(', ') : label('t_n_suits', { suitCount: order.suitCount })} · {order.fabric}</span></span>
                  </div>
                  
                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground font-bold ">{label('balance_2')}</span>
                      <span className={`text-sm font-bold ${baqi > 0 ? 'text-danger' : 'text-primary'}`}>
                        {baqi > 0 ? `Rs ${baqi}` : label('paid')}
                      </span>
                    </div>
                    
                    <button 
                      onClick={() => {
                        onCopyMeasurements(order);
                      }}
                      className="flex items-center gap-1.5 text-sm font-bold bg-accent text-accent-foreground px-3 min-h-[44px] rounded-lg hover:bg-accent transition-colors "
                    >
                      <Copy size={14} aria-hidden /> {label('copy_measurements')}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}