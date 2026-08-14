import { useState, useMemo, useEffect } from 'react';
import { useOrders } from '../hooks/use-orders';
import { useAuth } from '../hooks/use-auth';
import { OrderCard } from '../components/order-card';
import { StatsBar } from '../components/stats-bar';
import { OrderForm } from '../components/order-form';
import { ReceiptModal } from '../components/receipt-modal';
import { SettingsModal } from '../components/settings-modal';
import { EarningsModal } from '../components/earnings-modal';
import { DueTodayModal } from '../components/due-today-modal';
import { CustomerHistoryModal } from '../components/customer-history-modal';
import { CustomerDirectoryModal } from '../components/customer-directory-modal';
import { WorkSheetModal } from '../components/work-sheet-modal';
import { Order, OrderStatus } from '../types/order';
import {
  Scissors, Search, Plus, AlertCircle, Hourglass,
  Settings, BarChart2, ClipboardList, LogOut, Users,
} from 'lucide-react';

type FilterTab = 'All' | 'Urgent' | 'Due Soon' | 'Ready' | 'Delivered';

export default function Dashboard() {
  const { orders, isLoaded, addOrder, updateOrder, deleteOrder, updateOrderStatus, setAllOrders } = useOrders();
  const { logout } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterTab>('All');
  const [karigarFilter, setKarigarFilter] = useState<string>('');

  const [formOpen, setFormOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | undefined>();
  const [prefilledData, setPrefilledData] = useState<Partial<Order> | undefined>();

  const [receiptOpen, setReceiptOpen] = useState(false);
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [earningsOpen, setEarningsOpen] = useState(false);
  const [dueTodayOpen, setDueTodayOpen] = useState(false);
  const [workSheetOpen, setWorkSheetOpen] = useState(false);
  const [directoryOpen, setDirectoryOpen] = useState(false);
  const [customerHistoryPhone, setCustomerHistoryPhone] = useState<string | null>(null);

  // Apply dark mode from saved settings on load
  useEffect(() => {
    try {
      const stored = localStorage.getItem('darzi-khata-settings');
      if (stored) {
        const s = JSON.parse(stored);
        document.documentElement.classList.toggle('dark', !!s.darkMode);
      }
    } catch { /* ignore */ }
  }, []);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Unique karigars present in active orders for filter pills
  const activeKarigars = useMemo(() => {
    const set = new Set<string>();
    orders.forEach((o) => { if (o.karigar) set.add(o.karigar); });
    return Array.from(set).sort();
  }, [orders]);

  const { filteredOrders, overdueOrders } = useMemo(() => {
    let result = orders;

    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(
        (o) =>
          o.customerName.toLowerCase().includes(lower) ||
          o.phone.includes(searchTerm) ||
          (o.serialNumber || '').toLowerCase().includes(lower)
      );
    }

    if (karigarFilter) {
      result = result.filter((o) => o.karigar === karigarFilter);
    }

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    switch (activeFilter) {
      case 'Urgent':
        result = result.filter((o) => o.urgent);
        break;
      case 'Due Soon':
        result = result.filter((o) => {
          const d = new Date(o.deliveryDate);
          d.setHours(0, 0, 0, 0);
          return d <= tomorrow && o.status !== 'delivered';
        });
        break;
      case 'Ready':
        result = result.filter((o) => o.status === 'ready');
        break;
      case 'Delivered':
        result = result.filter((o) => o.status === 'delivered');
        break;
      default:
        break;
    }

    const sorted = [...result].sort((a, b) => {
      if (a.status === 'delivered' && b.status !== 'delivered') return 1;
      if (a.status !== 'delivered' && b.status === 'delivered') return -1;
      return new Date(a.deliveryDate).getTime() - new Date(b.deliveryDate).getTime();
    });

    const overdue =
      activeFilter === 'All'
        ? sorted.filter((o) => {
            const d = new Date(o.deliveryDate);
            d.setHours(0, 0, 0, 0);
            return d < today && o.status !== 'delivered';
          })
        : [];

    return { filteredOrders: sorted, overdueOrders: overdue };
  }, [orders, searchTerm, activeFilter, karigarFilter]);

  const handleCreateOrder = (data: Omit<Order, 'id' | 'createdAt' | 'serialNumber'>) => addOrder(data);
  const handleUpdateOrder = (data: Omit<Order, 'id' | 'createdAt' | 'serialNumber'>) => {
    if (editingOrder) updateOrder(editingOrder.id, data);
  };
  const handleUpdatePayment = (id: string, newAdvance: number) => updateOrder(id, { advanceAmount: newAdvance });

  const handleLogout = () => {
    if (window.confirm('Logout karna chahte hain? Session band ho jayega.')) logout();
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Scissors size={40} className="mx-auto text-emerald-700 mb-3 animate-spin" />
          <p className="font-bold text-foreground">Darzi Khata Loading...</p>
        </div>
      </div>
    );
  }

  const nonOverdueFiltered =
    activeFilter === 'All'
      ? filteredOrders.filter((o) => {
          const d = new Date(o.deliveryDate);
          d.setHours(0, 0, 0, 0);
          return !(d < today && o.status !== 'delivered');
        })
      : filteredOrders;

  return (
    <div className="min-h-[100dvh] bg-background pb-24 font-sans text-foreground selection:bg-emerald-200 dark:selection:bg-emerald-900">

      {/* Header */}
      <header className="bg-emerald-800 text-white px-4 py-3 shadow-md sticky top-0 z-20 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-black tracking-tight flex items-center gap-2">
            <Scissors className="rotate-90" size={20} color="#d97706" />
            DARZI KHATA
          </h1>
          <h2 className="font-urdu text-emerald-200 text-base -mt-1">درزی کھاتہ</h2>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={() => setDirectoryOpen(true)} className="p-2 bg-emerald-700 hover:bg-emerald-600 rounded-full transition-colors" title="Customer Directory">
            <Users size={18} />
          </button>
          <button onClick={() => setWorkSheetOpen(true)} className="p-2 bg-emerald-700 hover:bg-emerald-600 rounded-full transition-colors" title="Work Sheet">
            <ClipboardList size={18} />
          </button>
          <button onClick={() => setEarningsOpen(true)} className="p-2 bg-emerald-700 hover:bg-emerald-600 rounded-full transition-colors" title="Earnings">
            <BarChart2 size={18} />
          </button>
          <button onClick={() => setSettingsOpen(true)} className="p-2 bg-emerald-700 hover:bg-emerald-600 rounded-full transition-colors" title="Settings">
            <Settings size={18} />
          </button>
          <button onClick={handleLogout} className="p-2 bg-emerald-700 hover:bg-red-700 rounded-full transition-colors" title="Logout">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <main className="p-4 max-w-2xl mx-auto">

        {/* Stats Bar */}
        <StatsBar orders={orders} onDueTodayClick={() => setDueTodayOpen(true)} />

        {/* Search */}
        <div className="relative mb-3">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="text-muted-foreground" size={17} />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-3 border border-border rounded-xl bg-card placeholder-muted-foreground text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all shadow-sm text-sm font-medium"
            placeholder="Naam, phone, ya serial number (DK-001)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            data-testid="input-search"
          />
        </div>

        {/* Status Filter Pills */}
        <div className="flex overflow-x-auto gap-2 mb-3 pb-1 no-scrollbar" style={{ scrollbarWidth: 'none' }}>
          {(['All', 'Urgent', 'Due Soon', 'Ready', 'Delivered'] as FilterTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveFilter(tab)}
              className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-bold border transition-colors shrink-0 ${
                activeFilter === tab
                  ? 'bg-emerald-800 text-white border-emerald-800'
                  : 'bg-card text-muted-foreground border-border hover:bg-muted'
              }`}
              data-testid={`tab-${tab}`}
            >
              {tab === 'Urgent' && <AlertCircle size={12} className="inline mr-1 -mt-0.5" />}
              {tab === 'Due Soon' && <Hourglass size={12} className="inline mr-1 -mt-0.5" />}
              {tab}
            </button>
          ))}
        </div>

        {/* Karigar Filter Pills */}
        {activeKarigars.length > 0 && (
          <div className="flex overflow-x-auto gap-2 mb-4 pb-1 no-scrollbar" style={{ scrollbarWidth: 'none' }}>
            <button
              onClick={() => setKarigarFilter('')}
              className={`whitespace-nowrap px-3 py-1 rounded-full text-xs font-semibold border transition-colors shrink-0 ${
                karigarFilter === ''
                  ? 'bg-amber-600 text-white border-amber-600'
                  : 'bg-card text-muted-foreground border-border hover:bg-muted'
              }`}
            >
              Sab Karigar
            </button>
            {activeKarigars.map((k) => (
              <button
                key={k}
                onClick={() => setKarigarFilter(karigarFilter === k ? '' : k)}
                className={`whitespace-nowrap px-3 py-1 rounded-full text-xs font-semibold border transition-colors shrink-0 ${
                  karigarFilter === k
                    ? 'bg-amber-600 text-white border-amber-600'
                    : 'bg-card text-muted-foreground border-border hover:bg-muted'
                }`}
              >
                {k}
              </button>
            ))}
          </div>
        )}

        {/* Overdue Section */}
        {activeFilter === 'All' && overdueOrders.length > 0 && (
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex-1 h-px bg-red-200 dark:bg-red-800" />
              <span className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider flex items-center gap-1">
                <AlertCircle size={11} /> Overdue / Deri ({overdueOrders.length})
              </span>
              <div className="flex-1 h-px bg-red-200 dark:bg-red-800" />
            </div>
            <div className="space-y-3">
              {overdueOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onEdit={(o) => { setEditingOrder(o); setFormOpen(true); }}
                  onDelete={deleteOrder}
                  onViewReceipt={(o) => { setReceiptOrder(o); setReceiptOpen(true); }}
                  onStatusChange={updateOrderStatus}
                  onCustomerClick={(phone) => setCustomerHistoryPhone(phone)}
                  onUpdatePayment={handleUpdatePayment}
                />
              ))}
            </div>
            {nonOverdueFiltered.some((o) => o.status !== 'delivered') && (
              <div className="flex items-center gap-2 mt-5 mb-3">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Active Orders</span>
                <div className="flex-1 h-px bg-border" />
              </div>
            )}
          </div>
        )}

        {/* Main Orders */}
        <div className="space-y-3">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-xl border border-dashed border-border">
              <Scissors className="mx-auto text-muted mb-3" size={40} />
              <p className="text-muted-foreground font-medium">Koi order nahi mila</p>
              <p className="text-xs text-muted-foreground mt-1">No orders match the current filter</p>
            </div>
          ) : (
            nonOverdueFiltered.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onEdit={(o) => { setEditingOrder(o); setFormOpen(true); }}
                onDelete={deleteOrder}
                onViewReceipt={(o) => { setReceiptOrder(o); setReceiptOpen(true); }}
                onStatusChange={updateOrderStatus}
                onCustomerClick={(phone) => setCustomerHistoryPhone(phone)}
                onUpdatePayment={handleUpdatePayment}
              />
            ))
          )}
        </div>

      </main>

      {/* FAB */}
      <button
        onClick={() => { setEditingOrder(undefined); setPrefilledData(undefined); setFormOpen(true); }}
        className="fixed bottom-6 right-6 h-16 w-16 bg-[#d97706] hover:bg-amber-600 text-white rounded-full shadow-lg shadow-amber-600/40 flex items-center justify-center active:scale-95 transition-transform z-30"
        aria-label="New Order"
        data-testid="btn-new-order"
      >
        <Plus size={32} />
      </button>

      {/* Modals */}
      <OrderForm
        open={formOpen}
        onOpenChange={setFormOpen}
        order={editingOrder}
        prefill={prefilledData}
        onSave={editingOrder ? handleUpdateOrder : handleCreateOrder}
      />
      <ReceiptModal open={receiptOpen} onOpenChange={setReceiptOpen} order={receiptOrder} />
      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} orders={orders} setAllOrders={setAllOrders} />
      <EarningsModal open={earningsOpen} onOpenChange={setEarningsOpen} orders={orders} />
      <DueTodayModal
        open={dueTodayOpen}
        onOpenChange={setDueTodayOpen}
        orders={orders}
        onViewReceipt={(o) => { setReceiptOrder(o); setReceiptOpen(true); }}
      />
      <WorkSheetModal open={workSheetOpen} onOpenChange={setWorkSheetOpen} orders={orders} />
      <CustomerDirectoryModal
        open={directoryOpen}
        onOpenChange={setDirectoryOpen}
        orders={orders}
        onSelectCustomer={(phone) => setCustomerHistoryPhone(phone)}
      />
      <CustomerHistoryModal
        phone={customerHistoryPhone}
        onClose={() => setCustomerHistoryPhone(null)}
        orders={orders}
        onCopyMeasurements={(o) => {
          setEditingOrder(undefined);
          setPrefilledData({
            measurements: o.measurements,
            collarType: o.collarType,
            damanType: o.damanType,
            pockets: o.pockets,
            cuffType: o.cuffType,
            specialNotes: o.specialNotes,
          });
          setFormOpen(true);
        }}
      />
    </div>
  );
}
