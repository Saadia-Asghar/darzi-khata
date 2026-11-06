import { useState, useMemo } from 'react';
import { useOrders } from '../hooks/use-orders';
import { useAuthContext } from '../context/auth-context';
import { OrderChatModal } from './order-chat-modal';
import { Order, OrderStatus } from '../types/order';
import { OrderComment } from '../types/order';
import {
  Scissors, MessageCircle, LogOut, CheckCircle2, Clock, AlertCircle,
  CalendarClock, User, Package, Search,
} from 'lucide-react';

const statusColors: Record<OrderStatus, string> = {
  pending: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300',
  stitching: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300',
  ready: 'bg-green-50 text-emerald-700 border-green-200 dark:bg-green-900/30 dark:text-emerald-300',
  delivered: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400',
};

const statusLabel: Record<OrderStatus, string> = {
  pending: 'Pending / زیرِ التوا',
  stitching: 'Sil raha hun ✂️',
  ready: 'Tayar ✅',
  delivered: 'De Diya ✓',
};

export function KarigarDashboard() {
  const { currentUser, logout } = useAuthContext();
  const { orders, isLoaded, updateOrderStatus, addComment } = useOrders();
  const [search, setSearch] = useState('');
  const [chatOrder, setChatOrder] = useState<Order | null>(null);

  const handleLogout = () => {
    if (window.confirm('Logout karna chahte hain?')) logout();
  };

  // Only show orders assigned to this karigar (match by name)
  const myOrders = useMemo(() => {
    const name = currentUser?.name?.toLowerCase();
    // Also check shopName field which could be karigar display name
    const shopName = currentUser?.shopName?.toLowerCase();
    let filtered = orders.filter((o) => {
      if (o.karigarId) return o.karigarId === currentUser?.id;
      const k = (o.karigar ?? '').trim().toLowerCase();
      return !!k && (k === name || k === shopName);
    });
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter((o) =>
        o.customerName.toLowerCase().includes(q) ||
        o.phone.includes(q) ||
        (o.serialNumber ?? '').toLowerCase().includes(q)
      );
    }
    return [...filtered].sort((a, b) => {
      if (a.status === 'delivered' && b.status !== 'delivered') return 1;
      if (a.status !== 'delivered' && b.status === 'delivered') return -1;
      return new Date(a.deliveryDate).getTime() - new Date(b.deliveryDate).getTime();
    });
  }, [orders, currentUser, search]);

  const pending = myOrders.filter((o) => o.status === 'pending').length;
  const stitching = myOrders.filter((o) => o.status === 'stitching').length;
  const ready = myOrders.filter((o) => o.status === 'ready').length;

  const getDayInfo = (order: Order) => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const d = new Date(order.deliveryDate); d.setHours(0, 0, 0, 0);
    const diff = Math.ceil((d.getTime() - today.getTime()) / 86400000);
    if (diff < 0) return { text: `${Math.abs(diff)} din deri`, overdue: true };
    if (diff === 0) return { text: 'Aaj deliver karein', overdue: false };
    if (diff === 1) return { text: 'Kal deliver karein', overdue: false };
    return { text: `${diff} din baqi`, overdue: false };
  };

  const nextStatus: Partial<Record<OrderStatus, OrderStatus>> = {
    pending: 'stitching',
    stitching: 'ready',
  };

  const nextStatusLabel: Partial<Record<OrderStatus, string>> = {
    pending: 'Silai Shuru ✂️',
    stitching: 'Tayar Mark Karein ✅',
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Scissors size={36} className="text-emerald-700 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background pb-20 font-sans text-foreground">

      {/* Header */}
      <header className="bg-amber-600 text-white px-4 py-3 sticky top-0 z-20 shadow-md">
        <div className="max-w-2xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-lg font-black flex items-center gap-2">
              <Scissors className="rotate-90" size={18} color="white" />
              {currentUser?.name}
            </h1>
            <p className="text-amber-100 text-xs mt-0.5">
              Karigar · {currentUser?.ownerShopName || currentUser?.shopName}
            </p>
          </div>
          <button onClick={handleLogout} className="p-2 bg-amber-700 hover:bg-amber-800 rounded-full transition-colors" title="Logout">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4 space-y-4">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-card border border-border rounded-xl p-3 text-center">
            <Clock size={18} className="mx-auto text-gray-500 mb-1" />
            <p className="text-2xl font-black text-foreground">{pending}</p>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase">Pending</p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3 text-center">
            <Scissors size={18} className="mx-auto text-blue-600 mb-1" />
            <p className="text-2xl font-black text-blue-700 dark:text-blue-300">{stitching}</p>
            <p className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 uppercase">Sil raha hun</p>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3 text-center">
            <CheckCircle2 size={18} className="mx-auto text-emerald-600 mb-1" />
            <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300">{ready}</p>
            <p className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase">Tayar</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Customer ka naam ya serial number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder-muted-foreground"
          />
        </div>

        {/* Orders */}
        {myOrders.length === 0 ? (
          <div className="text-center py-16 bg-card rounded-xl border border-dashed border-border">
            <Package size={36} className="mx-auto text-muted-foreground mb-3 opacity-40" />
            <p className="text-muted-foreground font-medium">
              {search ? 'Koi order nahi mila' : 'Aapke liye koi order assign nahi hua'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {!search && 'Owner aapko orders assign karega'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {myOrders.map((order) => {
              const dayInfo = getDayInfo(order);
              const next = nextStatus[order.status];
              const commentCount = order.comments?.length ?? 0;
              const unread = commentCount > 0;

              return (
                <div
                  key={order.id}
                  className={`bg-card border rounded-xl p-4 shadow-sm space-y-3 ${
                    dayInfo.overdue && order.status !== 'delivered'
                      ? 'border-l-4 border-l-red-500 border-border'
                      : 'border-border'
                  }`}
                >
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {order.serialNumber && (
                          <span className="text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full">
                            {order.serialNumber}
                          </span>
                        )}
                        {order.urgent && (
                          <span className="text-[10px] font-bold bg-red-600 text-white px-2 py-0.5 rounded-full flex items-center gap-1">
                            <AlertCircle size={9} /> URGENT
                          </span>
                        )}
                      </div>
                      <p className="font-bold text-foreground mt-1 flex items-center gap-1.5">
                        <User size={14} className="text-muted-foreground" />
                        {order.customerName}
                      </p>
                      <p className="text-xs text-muted-foreground">{order.suitCount} jora · {order.fabric}</p>
                    </div>
                    {/* Status badge */}
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border shrink-0 ${statusColors[order.status]}`}>
                      {statusLabel[order.status]}
                    </span>
                  </div>

                  {/* Delivery */}
                  <div className={`flex items-center gap-1.5 text-xs font-semibold ${dayInfo.overdue ? 'text-red-600' : 'text-muted-foreground'}`}>
                    <CalendarClock size={13} />
                    {dayInfo.text}
                    {order.specialNotes && (
                      <span className="ml-2 text-amber-600 dark:text-amber-400">· Note: {order.specialNotes}</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    {/* Status update */}
                    {next && order.status !== 'delivered' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, next)}
                        className="flex-1 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <CheckCircle2 size={14} />
                        {nextStatusLabel[order.status]}
                      </button>
                    )}
                    {order.status === 'delivered' && (
                      <div className="flex-1 py-2 bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5">
                        <CheckCircle2 size={14} /> Deliver Ho Gaya
                      </div>
                    )}

                    {/* Chat */}
                    <button
                      onClick={() => setChatOrder(order)}
                      className="relative px-3 py-2 bg-card border border-border hover:bg-muted text-foreground text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
                    >
                      <MessageCircle size={15} className={unread ? 'text-emerald-600' : 'text-muted-foreground'} />
                      <span>{commentCount > 0 ? commentCount : ''}</span>
                      {unread && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full" />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <OrderChatModal
        order={chatOrder ? orders.find((o) => o.id === chatOrder.id) ?? null : null}
        onClose={() => setChatOrder(null)}
        onAddComment={addComment}
      />
    </div>
  );
}
