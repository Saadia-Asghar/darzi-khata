import { usePreferences } from '../hooks/use-preferences';
import * as Dialog from '@radix-ui/react-dialog';
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
        <Dialog.Overlay className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-background p-0 shadow-2xl outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 overflow-hidden max-h-[85vh] flex flex-col">
          
          <div className="px-5 py-4 border-b flex justify-between items-start bg-card shrink-0">
            <div>
              <Dialog.Title className="text-xl font-bold text-foreground">{customerName}</Dialog.Title>
              <div className="flex items-center text-emerald-700 text-sm font-mono mt-1 gap-1.5 font-semibold">
                <Phone size={14} /> {phone}
              </div>
            </div>
            <Dialog.Close asChild>
              <button className="h-11 w-11 inline-flex items-center justify-center rounded-full bg-muted hover:bg-accent transition-colors text-muted-foreground" aria-label={label('Close', 'بند کریں')}>
                <X size={20} />
              </button>
            </Dialog.Close>
          </div>

          <div className="grid grid-cols-2 bg-emerald-800 text-white p-4 shrink-0">
            <div>
              <div className="text-[10px] text-emerald-200 uppercase tracking-wider font-semibold">{label('Total orders', 'کل آرڈر')}</div>
              <div className="text-2xl font-bold">{customerOrders.length}</div>
            </div>
            <div className="text-end">
              <div className="text-[10px] text-emerald-200 uppercase tracking-wider font-semibold">{label('Total business', 'کل کاروبار')}</div>
              <div className="text-xl font-bold">Rs. {totalSpent.toLocaleString()}</div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">{label('Order history', 'آرڈر ریکارڈ')}</h3>
            
            {customerOrders.map(order => {
              const baqi = order.totalAmount - order.advanceAmount;
              return (
                <div key={order.id} className="bg-card border border-border rounded-xl p-4 shadow-sm relative overflow-hidden">
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-sm font-bold text-foreground">{new Date(order.createdAt).toLocaleDateString()}</div>
                    <StatusBadge order={order} />
                  </div>
                  
                  <div className="text-sm text-muted-foreground mb-3">
                    <span className="flex items-center gap-2"><FabricThumb id={order.fabricPhotoId} size={36} /><span>{order.items?.length ? order.items.map((i) => `${label(garment(i.garmentType).en, garment(i.garmentType).ur)} x${i.quantity}`).join(', ') : label(`${order.suitCount} suits`, `${order.suitCount} جوڑے`)} — {order.fabric}</span></span>
                  </div>
                  
                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-muted-foreground font-bold uppercase">{label('Balance', 'باقی')}</span>
                      <span className={`text-sm font-bold ${baqi > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                        {baqi > 0 ? `Rs ${baqi}` : label('Paid', 'ادا')}
                      </span>
                    </div>
                    
                    <button 
                      onClick={() => {
                        onCopyMeasurements(order);
                        onClose();
                      }}
                      className="flex items-center gap-1.5 text-xs font-bold bg-[#d97706] text-white px-3 min-h-[44px] rounded-lg hover:bg-amber-600 transition-colors shadow-sm"
                    >
                      <Copy size={14} aria-hidden /> {label('Copy measurements', 'ناپ کاپی کریں')}
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