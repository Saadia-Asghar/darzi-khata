import { usePreferences } from '../hooks/use-preferences';
import * as Dialog from '@radix-ui/react-dialog';
import { X, TrendingUp, Scissors, CheckCircle, Clock, Package } from 'lucide-react';
import { Order } from '../types/order';

interface EarningsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orders: Order[];
}

export function EarningsModal({ open, onOpenChange, orders }: EarningsModalProps) {
  const { label } = usePreferences();
  
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Helper to check if order is in current month
  const isThisMonth = (dateString: string) => {
    const d = new Date(dateString);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  };

  // Section 1: This Month
  const thisMonthOrders = orders.filter(o => isThisMonth(o.createdAt));
  const thisMonthTotal = thisMonthOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const thisMonthCollected = thisMonthOrders.reduce((sum, o) => sum + o.advanceAmount, 0);
  const thisMonthBaqi = thisMonthTotal - thisMonthCollected;
  const progressPercent = thisMonthTotal > 0 ? (thisMonthCollected / thisMonthTotal) * 100 : 0;

  // Section 2: By Status (This Month)
  const statusCounts = {
    pending: thisMonthOrders.filter(o => o.status === 'pending').length,
    stitching: thisMonthOrders.filter(o => o.status === 'stitching').length,
    ready: thisMonthOrders.filter(o => o.status === 'ready').length,
    delivered: thisMonthOrders.filter(o => o.status === 'delivered').length,
  };

  // Section 3: Last 6 Months Table
  const last6Months = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const m = d.getMonth();
    const y = d.getFullYear();
    const monthName = d.toLocaleString('en-US', { month: 'short', year: '2-digit' });
    
    const mOrders = orders.filter(o => {
      const od = new Date(o.createdAt);
      return od.getMonth() === m && od.getFullYear() === y;
    });
    
    const mTotal = mOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const mCollected = mOrders.reduce((sum, o) => sum + o.advanceAmount, 0);
    const mBaqi = mTotal - mCollected;
    
    return { name: monthName, count: mOrders.length, total: mTotal, collected: mCollected, baqi: mBaqi };
  });

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed inset-x-0 bottom-0 z-50 mt-24 h-[90dvh] flex flex-col rounded-t-[20px] bg-background border-t overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom shadow-2xl outline-none max-w-md mx-auto sm:h-[85vh] sm:bottom-auto sm:top-[50%] sm:-translate-y-1/2 sm:rounded-[20px]">
          
          <div className="px-5 py-4 border-b flex justify-between items-center bg-card shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#d97706]/10 text-[#d97706] rounded-full flex items-center justify-center">
                <TrendingUp size={20} />
              </div>
              <div>
                <Dialog.Title className="text-lg font-bold text-foreground">{label('Monthly accounts', 'ماہانہ حساب')}</Dialog.Title>
                <Dialog.Description className="text-muted-foreground text-xs mt-0.5">{label('Earnings and collection', 'آمدنی اور وصولی')}</Dialog.Description>
              </div>
            </div>
            <Dialog.Close asChild>
              <button className="h-11 w-11 inline-flex items-center justify-center rounded-full bg-muted hover:bg-accent transition-colors text-muted-foreground" aria-label={label('Close', 'بند کریں')}>
                <X size={20} />
              </button>
            </Dialog.Close>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            
            {/* Section 1: This Month */}
            <section className="bg-emerald-800 text-white rounded-2xl p-5 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 end-0 p-4 opacity-10"><TrendingUp size={80} /></div>
              
              <h3 className="text-xs text-emerald-200 font-bold uppercase tracking-widest mb-4">{label("This month's earnings", 'اس مہینے کی آمدنی')}</h3>
              
              <div className="grid grid-cols-2 gap-4 mb-5">
                <div>
                  <div className="text-[10px] text-emerald-300 uppercase tracking-wider mb-1">{label('Total stitching', 'کل سلائی')}</div>
                  <div className="text-2xl font-bold font-mono">Rs {thisMonthTotal.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-[10px] text-emerald-300 uppercase tracking-wider mb-1">{label('Collected', 'وصول')}</div>
                  <div className="text-2xl font-bold font-mono text-[#d97706]">Rs {thisMonthCollected.toLocaleString()}</div>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-emerald-100">
                  <span>{label('Collection progress', 'وصولی')}</span>
                  <span>{Math.round(progressPercent)}%</span>
                </div>
                <div className="h-2 w-full bg-emerald-950 rounded-full overflow-hidden">
                  <div className="h-full bg-[#d97706] rounded-full" style={{ width: `${progressPercent}%` }} />
                </div>
              </div>
            </section>

            {/* Section 2: By Status */}
            <section>
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 px-1">{label("This month's orders", 'اس مہینے کے آرڈر')}</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-card border border-border rounded-xl p-3 shadow-sm flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-muted flex items-center justify-center text-muted-foreground"><Clock size={16} /></div>
                  <div>
                    <div className="text-xl font-bold text-foreground leading-none">{statusCounts.pending}</div>
                    <div className="text-[10px] font-bold text-muted-foreground uppercase mt-1">{label('Pending', 'زیرِ التوا')}</div>
                  </div>
                </div>
                <div className="bg-card border border-blue-100 rounded-xl p-3 shadow-sm flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-blue-50 flex items-center justify-center text-blue-600"><Scissors size={16} /></div>
                  <div>
                    <div className="text-xl font-bold text-blue-900 dark:text-blue-200 leading-none">{statusCounts.stitching}</div>
                    <div className="text-[10px] font-bold text-blue-600 uppercase mt-1">{label('Stitching', 'سلائی جاری')}</div>
                  </div>
                </div>
                <div className="bg-card border border-emerald-100 rounded-xl p-3 shadow-sm flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-emerald-50 flex items-center justify-center text-emerald-600"><CheckCircle size={16} /></div>
                  <div>
                    <div className="text-xl font-bold text-emerald-900 dark:text-emerald-200 leading-none">{statusCounts.ready}</div>
                    <div className="text-[10px] font-bold text-emerald-600 uppercase mt-1">{label('Ready', 'تیار')}</div>
                  </div>
                </div>
                <div className="bg-card border border-slate-200 rounded-xl p-3 shadow-sm flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-slate-600"><Package size={16} /></div>
                  <div>
                    <div className="text-xl font-bold text-slate-900 dark:text-slate-200 leading-none">{statusCounts.delivered}</div>
                    <div className="text-[10px] font-bold text-slate-600 uppercase mt-1">{label('Delivered', 'دے دیا')}</div>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 3: Last 6 Months Table */}
            <section className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider p-4 border-b bg-muted">{label('Last 6 months', 'پچھلے 6 مہینے')}</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-[10px] text-muted-foreground uppercase bg-card border-b">
                    <tr>
                      <th className="px-4 py-2">{label('Month', 'مہینہ')}</th>
                      <th className="px-4 py-2 text-center">{label('Orders', 'آرڈر')}</th>
                      <th className="px-4 py-2 text-right">{label('Stitching', 'سلائی')}</th>
                      <th className="px-4 py-2 text-end">{label('Collected', 'وصول')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {last6Months.map((m, i) => (
                      <tr key={i} className="border-b last:border-0 hover:bg-muted">
                        <td className="px-4 py-3 font-bold text-foreground">{m.name}</td>
                        <td className="px-4 py-3 text-center text-muted-foreground">{m.count}</td>
                        <td className="px-4 py-3 text-right font-mono text-foreground">{m.total.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right font-mono text-emerald-600">{m.collected.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
            
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}