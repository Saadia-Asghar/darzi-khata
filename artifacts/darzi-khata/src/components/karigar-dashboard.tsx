import { fabricName } from '../lib/i18n';
import { usePreferences } from '../hooks/use-preferences';
import { StatusBadge } from './status-meta';
import { useState, useMemo } from 'react';
import { useOrders } from '../hooks/use-orders';
import { useAuthContext } from '../context/auth-context';
import { OrderChatModal } from './order-chat-modal';
import { Order, OrderStatus } from '../types/order';
import { OrderComment } from '../types/order';
import { AlertDialog, AlertDialogContent, AlertDialogTitle, AlertDialogDescription, AlertDialogCancel, AlertDialogAction, AlertDialogFooter } from './ui/alert-dialog';
import {
  Scissors, MessageCircle, LogOut, CheckCircle2, Clock, AlertCircle,
  CalendarClock, User, Package, Search,
} from 'lucide-react';

export function KarigarDashboard() {
  const { currentUser, logout } = useAuthContext();
  const { label } = usePreferences();
  const { orders, isLoaded, updateOrderStatus, addComment } = useOrders();
  const [search, setSearch] = useState('');
  const [chatOrder, setChatOrder] = useState<Order | null>(null);

  const [confirmLogout, setConfirmLogout] = useState(false);
  const handleLogout = () => setConfirmLogout(true);

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
    if (diff < 0) return { text: label('t_n_days_late', { diff: Math.abs(diff) }), overdue: true };
    if (diff === 0) return { text: label('deliver_today'), overdue: false };
    if (diff === 1) return { text: label('deliver_tomorrow'), overdue: false };
    return { text: label('t_n_days_left', { diff }), overdue: false };
  };

  const nextStatus: Partial<Record<OrderStatus, OrderStatus>> = {
    pending: 'stitching',
    stitching: 'ready',
  };

  const nextStatusLabel: Partial<Record<OrderStatus, string>> = {
    pending: label('start_stitching'),
    stitching: label('mark_ready'),
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Scissors size={36} className="text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background pb-20 font-sans text-foreground">

      {/* Header */}
      <header className="bg-accent text-accent-foreground px-4 py-3 sticky top-0 z-20 ">
        <div className="max-w-2xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-lg font-bold flex items-center gap-2">
              <Scissors className="rotate-90 text-primary-foreground" size={18} />
              {currentUser?.name}
            </h1>
            <p className="text-accent-foreground text-sm mt-0.5">
              {label('karigar')} · {currentUser?.ownerShopName || currentUser?.shopName}
            </p>
          </div>
          <button onClick={handleLogout} className="h-11 w-11 flex items-center justify-center bg-warning hover:bg-warning rounded-full transition-colors" title={label('log_out_x')} aria-label={label('log_out_x')}>
            <LogOut size={18} className="rtl:rotate-180" aria-hidden />
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4 space-y-4">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-card border border-border rounded-lg p-3 text-center">
            <Clock size={18} className="mx-auto text-muted-foreground mb-1" />
            <p className="text-2xl font-bold text-foreground">{pending}</p>
            <p className="text-xs font-semibold text-muted-foreground ">{label('pending')}</p>
          </div>
          <div className="bg-info-soft  border border-border  rounded-lg p-3 text-center">
            <Scissors size={18} className="mx-auto text-info mb-1" />
            <p className="text-2xl font-bold text-info ">{stitching}</p>
            <p className="text-xs font-semibold text-info  ">{label('stitching_2')}</p>
          </div>
          <div className="bg-primary-soft  border border-border  rounded-lg p-3 text-center">
            <CheckCircle2 size={18} className="mx-auto text-primary mb-1" />
            <p className="text-2xl font-bold text-primary ">{ready}</p>
            <p className="text-xs font-semibold text-primary  ">{label('ready')}</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder={label('customer_name_or_serial_number')} aria-label={label('search_orders_x')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring placeholder-muted-foreground"
          />
        </div>

        {/* Orders */}
        {myOrders.length === 0 ? (
          <div className="text-center py-16 bg-card rounded-lg border border-dashed border-border">
            <Package size={36} className="mx-auto text-muted-foreground mb-3 opacity-40" />
            <p className="text-muted-foreground font-medium">
              {search ? label('no_order_found') : label('no_orders_assigned_to_you')}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {!search && label('the_owner_will_assign_orders_to_you')}
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
                  className={`bg-card border rounded-lg p-4  space-y-3 ${
                    dayInfo.overdue && order.status !== 'delivered'
                      ? ' border-l-danger border-border'
                      : 'border-border'
                  }`}
                >
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {order.serialNumber && (
                          <span className="text-xs font-bold bg-primary-soft  text-primary  px-2 py-0.5 rounded-full">
                            {order.serialNumber}
                          </span>
                        )}
                        {order.urgent && (
                          <span className="text-xs font-bold bg-danger text-danger-foreground px-2 py-0.5 rounded-full flex items-center gap-1">
                            <AlertCircle size={9} aria-hidden /> {label('urgent')}
                          </span>
                        )}
                      </div>
                      <p className="font-bold text-foreground mt-1 flex items-center gap-1.5">
                        <User size={14} className="text-muted-foreground" />
                        {order.customerName}
                      </p>
                      <p className="text-sm text-muted-foreground">{label('t_n_pcs', { suitCount: order.suitCount })} · {fabricName(order.fabric)}</p>
                    </div>
                    {/* Status badge */}
                    <StatusBadge order={order} />
                  </div>

                  {/* Delivery */}
                  <div className={`flex items-center gap-1.5 text-sm font-semibold ${dayInfo.overdue ? 'text-danger' : 'text-muted-foreground'}`}>
                    <CalendarClock size={13} />
                    {dayInfo.text}
                    {order.specialNotes && (
                      <span className="ms-2 text-warning ">· {label('note')}: {order.specialNotes}</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    {/* Status update */}
                    {next && order.status !== 'delivered' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, next)}
                        className="flex-1 min-h-[44px] bg-accent hover:bg-accent text-accent-foreground text-sm font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <CheckCircle2 size={14} />
                        {nextStatusLabel[order.status]}
                      </button>
                    )}
                    {order.status === 'delivered' && (
                      <div className="flex-1 min-h-[44px] bg-muted  text-muted-foreground text-sm font-bold rounded-lg flex items-center justify-center gap-1.5">
                        <CheckCircle2 size={14} aria-hidden /> {label('delivered')}
                      </div>
                    )}

                    {/* Chat */}
                    <button
                      onClick={() => setChatOrder(order)}
                      aria-label={label('t_chat_n_messages', { commentCount })} className="relative px-3 min-h-[44px] min-w-[44px] justify-center bg-card border border-border hover:bg-muted text-foreground text-sm font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
                    >
                      <MessageCircle size={15} className={unread ? 'text-primary' : 'text-muted-foreground'} />
                      <span>{commentCount > 0 ? commentCount : ''}</span>
                      {unread && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-danger rounded-full" />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <AlertDialog open={confirmLogout} onOpenChange={setConfirmLogout}>
        <AlertDialogContent><AlertDialogTitle>{label('log_out_2')}</AlertDialogTitle>
          <AlertDialogDescription>{label('log_out_2')}</AlertDialogDescription>
          <AlertDialogFooter><AlertDialogCancel>{label('cancel_x')}</AlertDialogCancel><AlertDialogAction onClick={logout}>{label('log_out_2')}</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <OrderChatModal
        order={chatOrder ? orders.find((o) => o.id === chatOrder.id) ?? null : null}
        onClose={() => setChatOrder(null)}
        onAddComment={addComment}
      />
    </div>
  );
}
