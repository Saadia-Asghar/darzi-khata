import { usePreferences } from '../hooks/use-preferences';
import * as Dialog from './page-dialog';
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
        <Dialog.Overlay className="fixed inset-0 bg-foreground/60 z-50  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed inset-x-0 bottom-0 z-50 mt-24 h-[90dvh] flex flex-col rounded-t-lg bg-background border-t overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom  outline-none max-w-md mx-auto sm:h-[85vh] sm:bottom-auto sm:top-[50%] sm:-translate-y-1/2 sm:rounded-t-lg">
          
          <div className="px-5 py-4 border-b flex justify-between items-center bg-card shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-accent/10 text-warning rounded-full flex items-center justify-center">
                <TrendingUp size={20} />
              </div>
              <div>
                <Dialog.Title className="text-lg font-bold text-foreground">{label('monthly_accounts')}</Dialog.Title>
                <Dialog.Description className="text-muted-foreground text-sm mt-0.5">{label('earnings_and_collection')}</Dialog.Description>
              </div>
            </div>
            <Dialog.Close asChild>
              <button className="h-11 w-11 inline-flex items-center justify-center rounded-full bg-muted hover:bg-accent transition-colors text-muted-foreground" aria-label={label('close')}>
                <X size={20} />
              </button>
            </Dialog.Close>
          </div>

          <div className="dk-wide-grid flex-1 overflow-y-auto p-4 space-y-6">
            
            {/* Section 1: This Month */}
            <section className="bg-primary text-primary-foreground rounded-lg p-5  relative overflow-hidden">
              <div className="absolute top-0 end-0 p-4 opacity-10"><TrendingUp size={80} /></div>
              
              <h3 className="text-sm text-primary-foreground font-bold   mb-4">{label('t_this_month_s_earnings')}</h3>
              
              <div className="grid grid-cols-2 gap-4 mb-5">
                <div>
                  <div className="text-xs text-primary-foreground   mb-1">{label('total_stitching')}</div>
                  <div className="text-2xl font-bold font-mono">Rs {thisMonthTotal.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-xs text-primary-foreground   mb-1">{label('collected_2')}</div>
                  <div className="text-2xl font-bold font-mono text-warning">Rs {thisMonthCollected.toLocaleString()}</div>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-sm font-bold text-primary-foreground">
                  <span>{label('collection_progress')}</span>
                  <span>{Math.round(progressPercent)}%</span>
                </div>
                <div className="h-2 w-full bg-primary rounded-full overflow-hidden">
                  <div className="h-full bg-accent rounded-full" style={{ width: `${progressPercent}%` }} />
                </div>
              </div>
            </section>

            {/* Section 2: By Status */}
            <section>
              <h3 className="text-sm font-bold text-muted-foreground   mb-3 px-1">{label('t_this_month_s_orders')}</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-card border border-border rounded-lg p-3  flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-muted flex items-center justify-center text-muted-foreground"><Clock size={16} /></div>
                  <div>
                    <div className="text-xl font-bold text-foreground leading-none">{statusCounts.pending}</div>
                    <div className="text-xs font-bold text-muted-foreground  mt-1">{label('pending')}</div>
                  </div>
                </div>
                <div className="bg-card border border-border rounded-lg p-3  flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-info-soft flex items-center justify-center text-info"><Scissors size={16} /></div>
                  <div>
                    <div className="text-xl font-bold text-info  leading-none">{statusCounts.stitching}</div>
                    <div className="text-xs font-bold text-info  mt-1">{label('stitching_2')}</div>
                  </div>
                </div>
                <div className="bg-card border border-border rounded-lg p-3  flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-primary-soft flex items-center justify-center text-primary"><CheckCircle size={16} /></div>
                  <div>
                    <div className="text-xl font-bold text-primary  leading-none">{statusCounts.ready}</div>
                    <div className="text-xs font-bold text-primary  mt-1">{label('ready')}</div>
                  </div>
                </div>
                <div className="bg-card border border-border rounded-lg p-3  flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-muted flex items-center justify-center text-muted-foreground"><Package size={16} /></div>
                  <div>
                    <div className="text-xl font-bold text-foreground  leading-none">{statusCounts.delivered}</div>
                    <div className="text-xs font-bold text-muted-foreground  mt-1">{label('delivered')}</div>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 3: Last 6 Months Table */}
            <section className="bg-card rounded-lg  border border-border overflow-hidden">
              <h3 className="text-sm font-bold text-foreground   p-4 border-b bg-muted">{label('last_6_months')}</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground  bg-card border-b">
                    <tr>
                      <th className="px-4 py-2">{label('month_2')}</th>
                      <th className="px-4 py-2 text-center">{label('orders_2')}</th>
                      <th className="px-4 py-2 text-right">{label('stitching')}</th>
                      <th className="px-4 py-2 text-end">{label('collected_2')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {last6Months.map((m, i) => (
                      <tr key={i} className="border-b last:border-0 hover:bg-muted">
                        <td className="px-4 py-3 font-bold text-foreground">{m.name}</td>
                        <td className="px-4 py-3 text-center text-muted-foreground">{m.count}</td>
                        <td className="px-4 py-3 text-right font-mono text-foreground">{m.total.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right font-mono text-primary">{m.collected.toLocaleString()}</td>
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