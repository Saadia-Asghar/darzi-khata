import * as Dialog from '@radix-ui/react-dialog';
import { X, Users, Phone, TrendingUp, Package } from 'lucide-react';
import { Order } from '../types/order';
import { useMemo, useState } from 'react';

interface CustomerDirectoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orders: Order[];
  onSelectCustomer: (phone: string) => void;
}

interface CustomerSummary {
  customerName: string;
  phone: string;
  totalOrders: number;
  totalSpent: number;
  totalBaqi: number;
  lastOrderDate: string;
  statusBreakdown: Record<string, number>;
}

export function CustomerDirectoryModal({ open, onOpenChange, orders, onSelectCustomer }: CustomerDirectoryModalProps) {
  const [search, setSearch] = useState('');

  const customers = useMemo<CustomerSummary[]>(() => {
    const map = new Map<string, CustomerSummary>();
    for (const o of orders) {
      const key = o.phone;
      if (!map.has(key)) {
        map.set(key, {
          customerName: o.customerName,
          phone: o.phone,
          totalOrders: 0,
          totalSpent: 0,
          totalBaqi: 0,
          lastOrderDate: o.orderDate,
          statusBreakdown: {},
        });
      }
      const c = map.get(key)!;
      c.totalOrders += 1;
      c.totalSpent += o.totalAmount;
      c.totalBaqi += (o.totalAmount - o.advanceAmount);
      c.statusBreakdown[o.status] = (c.statusBreakdown[o.status] || 0) + 1;
      if (new Date(o.orderDate) > new Date(c.lastOrderDate)) {
        c.lastOrderDate = o.orderDate;
        c.customerName = o.customerName; // use most recent name
      }
    }
    return Array.from(map.values()).sort((a, b) => b.totalOrders - a.totalOrders);
  }, [orders]);

  const filtered = useMemo(() => {
    if (!search.trim()) return customers;
    const q = search.toLowerCase();
    return customers.filter(
      (c) => c.customerName.toLowerCase().includes(q) || c.phone.includes(q)
    );
  }, [customers, search]);

  const totalCustomers = customers.length;
  const totalRevenue = customers.reduce((s, c) => s + c.totalSpent, 0);
  const totalOutstanding = customers.reduce((s, c) => s + c.totalBaqi, 0);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-background p-0 shadow-2xl outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 overflow-hidden max-h-[90vh] flex flex-col">

          {/* Header */}
          <div className="px-5 py-4 border-b bg-emerald-800 text-white shrink-0 flex justify-between items-center">
            <div>
              <Dialog.Title className="text-lg font-bold flex items-center gap-2">
                <Users size={18} /> Customer Directory
              </Dialog.Title>
              <Dialog.Description className="text-emerald-200 text-xs font-urdu">گاہکوں کی فہرست</Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-emerald-700 text-white" aria-label="Close">
                <X size={20} />
              </button>
            </Dialog.Close>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-0 border-b border-border shrink-0">
            <div className="p-3 text-center border-r border-border">
              <div className="text-2xl font-black text-foreground">{totalCustomers}</div>
              <div className="text-[10px] text-muted-foreground uppercase font-semibold">Gahak</div>
            </div>
            <div className="p-3 text-center border-r border-border">
              <div className="text-lg font-black text-emerald-700">Rs.{(totalRevenue / 1000).toFixed(1)}k</div>
              <div className="text-[10px] text-muted-foreground uppercase font-semibold">Total Silai</div>
            </div>
            <div className="p-3 text-center">
              <div className="text-lg font-black text-red-600">Rs.{(totalOutstanding / 1000).toFixed(1)}k</div>
              <div className="text-[10px] text-muted-foreground uppercase font-semibold">Baqi</div>
            </div>
          </div>

          {/* Search */}
          <div className="px-4 py-3 border-b border-border shrink-0">
            <input
              type="text"
              placeholder="Naam ya phone se dhundein..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 dark:focus:ring-emerald-900 text-foreground placeholder:text-muted-foreground"
            />
          </div>

          {/* Customer List */}
          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <Users size={36} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">Koi gahak nahi mila</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filtered.map((c) => (
                  <button
                    key={c.phone}
                    onClick={() => {
                      onSelectCustomer(c.phone);
                      onOpenChange(false);
                    }}
                    className="w-full text-left px-4 py-4 hover:bg-muted transition-colors active:bg-muted/80"
                    data-testid={`customer-${c.phone}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-foreground text-base truncate">{c.customerName}</div>
                        <div className="flex items-center gap-1 text-muted-foreground text-sm mt-0.5">
                          <Phone size={12} />
                          <span className="font-mono">{c.phone}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Package size={11} /> {c.totalOrders} order{c.totalOrders !== 1 ? 's' : ''}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-400 font-semibold">
                            <TrendingUp size={11} /> Rs.{c.totalSpent.toLocaleString()}
                          </span>
                          {c.totalBaqi > 0 && (
                            <span className="text-xs text-red-600 font-bold">
                              Baqi: Rs.{c.totalBaqi.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="text-[10px] text-muted-foreground">Aakhri order</div>
                        <div className="text-xs font-semibold text-foreground">
                          {new Date(c.lastOrderDate).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: '2-digit' })}
                        </div>
                        {c.statusBreakdown['ready'] > 0 && (
                          <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-1.5 py-0.5 rounded-full font-bold mt-1 inline-block">
                            {c.statusBreakdown['ready']} Ready
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
