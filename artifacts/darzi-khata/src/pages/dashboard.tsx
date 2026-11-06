import { useState, useMemo } from 'react';
import { useOrders } from '../hooks/use-orders';
import { useAuthContext } from '../context/auth-context';
import { OrderCard } from '../components/order-card';
import { StatsBar } from '../components/stats-bar';
import { OrderForm } from '../components/order-form';
import { QuickOrderForm } from '../components/quick-order-form';
import { ReceiptModal } from '../components/receipt-modal';
import { SettingsModal } from '../components/settings-modal';
import { EarningsModal } from '../components/earnings-modal';
import { DueTodayModal } from '../components/due-today-modal';
import { CustomerHistoryModal } from '../components/customer-history-modal';
import { WorkSheetModal } from '../components/work-sheet-modal';
import { TeamModal } from '../components/team-modal';
import { OrderChatModal } from '../components/order-chat-modal';
import { CreditModal } from '../components/credit-modal';
import { ImpactModal } from '../components/impact-modal';
import { PendingRemindersModal } from '../components/pending-reminders-modal';
import { BottomNav, type NavTab } from '../components/bottom-nav';
import { DailySummary } from '../components/daily-summary';
import { CustomersPanel } from '../components/customers-panel';
import { PaymentsPanel } from '../components/payments-panel';
import { MorePanel, type MoreTool } from '../components/more-panel';
import { STATUS_META, isOverdue } from '../components/status-meta';
import { matchesCustomer } from '../components/format';
import { useDemoMode } from '../hooks/use-demo-mode';
import { usePreferences } from '../hooks/use-preferences';
import { pendingReminders } from '../lib/reminders';
import { Customer, Order } from '../types/order';
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Scissors, Search, AlertTriangle, FlaskConical, Zap, ListChecks } from 'lucide-react';

type FilterTab = 'all' | 'urgent' | 'soon' | 'pending' | 'stitching' | 'ready' | 'delivered';

export default function Dashboard() {
  const { orders, isLoaded, addOrder, updateOrder, deleteOrder, restoreOrder, updateOrderStatus, setAllOrders, addComment } = useOrders();
  const { currentUser, logout } = useAuthContext();
  const { demoMode, setDemoMode } = useDemoMode();
  const { label, urduFirst } = usePreferences();
  const { toast } = useToast();

  const [tab, setTab] = useState<NavTab>('orders');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [karigarFilter, setKarigarFilter] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);
  const [chooserOpen, setChooserOpen] = useState(false);
  const [quickCustomer, setQuickCustomer] = useState<Customer | undefined>();
  const [editingOrder, setEditingOrder] = useState<Order | undefined>();
  const [prefilledData, setPrefilledData] = useState<Partial<Order> | undefined>();
  const [pendingDelete, setPendingDelete] = useState<Order | null>(null);
  const [logoutOpen, setLogoutOpen] = useState(false);

  const [receiptOpen, setReceiptOpen] = useState(false);
  const [tool, setTool] = useState<MoreTool | null>(null);
  const [customerHistoryPhone, setCustomerHistoryPhone] = useState<string | null>(null);
  const [chatOrderId, setChatOrderId] = useState<string | null>(null);
  const [receiptOrderId, setReceiptOrderId] = useState<string | null>(null);
  const chatOrder = useMemo(() => orders.find((o) => o.id === chatOrderId) ?? null, [orders, chatOrderId]);
  const receiptOrder = useMemo(() => orders.find((o) => o.id === receiptOrderId) ?? null, [orders, receiptOrderId]);
  const pendingCount = useMemo(() => pendingReminders(orders).length, [orders]);
  const toolProps = (t: MoreTool) => ({ open: tool === t, onOpenChange: (v: boolean) => setTool(v ? t : null) });

  const activeKarigars = useMemo(() => Array.from(new Set(orders.map((o) => o.karigar).filter(Boolean) as string[])).sort(), [orders]);

  const { overdueOrders, restOrders, total } = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
    let r = orders.filter((o) => matchesCustomer(searchTerm, o.customerName, o.phone) || (o.serialNumber || '').toLowerCase().includes(searchTerm.trim().toLowerCase()));
    if (karigarFilter) r = r.filter((o) => o.karigar === karigarFilter);
    if (activeFilter === 'urgent') r = r.filter((o) => o.urgent);
    else if (activeFilter === 'soon') r = r.filter((o) => { const d = new Date(o.deliveryDate); d.setHours(0, 0, 0, 0); return d <= tomorrow && o.status !== 'delivered'; });
    else if (activeFilter !== 'all') r = r.filter((o) => o.status === activeFilter);
    const sorted = [...r].sort((a, b) => (a.status === 'delivered' ? 1 : 0) - (b.status === 'delivered' ? 1 : 0) || +new Date(a.deliveryDate) - +new Date(b.deliveryDate));
    const od = activeFilter === 'all' ? sorted.filter((o) => isOverdue(o)) : [];
    return { overdueOrders: od, restOrders: sorted.filter((o) => !od.includes(o)), total: sorted.length };
  }, [orders, searchTerm, activeFilter, karigarFilter]);

  const openReceipt = (o: Order) => { setReceiptOrderId(o.id); setReceiptOpen(true); };
  const openFull = (prefill?: Partial<Order>) => { setEditingOrder(undefined); setPrefilledData(prefill); setFormOpen(true); };
  const handleSave = (data: Omit<Order, 'id' | 'createdAt' | 'serialNumber'>) => {
    if (editingOrder) updateOrder(editingOrder.id, data); else addOrder(data);
  };

  const confirmDelete = () => {
    const victim = pendingDelete;
    setPendingDelete(null);
    if (!victim) return;
    try {
      deleteOrder(victim.id);
      toast({
        title: label('Order deleted', 'آرڈر حذف ہو گیا'),
        duration: 30000,
        description: `${victim.customerName} ${victim.serialNumber ?? ''}`,
        action: (
          <ToastAction altText={label('Undo delete', 'واپس لائیں')} className="min-h-[44px]" onClick={() => {
            try { restoreOrder(victim); toast({ title: label('Order restored', 'آرڈر واپس آ گیا') }); }
            catch (e) { toast({ title: label('Could not restore', 'واپس نہیں آ سکا'), description: e instanceof Error ? e.message : undefined, variant: 'destructive' }); }
          }} data-testid="btn-undo-delete">{label('Undo', 'واپس')}</ToastAction>
        ),
      });
    } catch (e) {
      toast({ title: label('Delete failed', 'حذف نہیں ہوا'), description: e instanceof Error ? e.message : undefined, variant: 'destructive' });
    }
  };

  const cardProps = {
    onEdit: (o: Order) => { setEditingOrder(o); setPrefilledData(undefined); setFormOpen(true); },
    onDelete: (id: string) => setPendingDelete(orders.find((o) => o.id === id) ?? null),
    onViewReceipt: openReceipt,
    onStatusChange: updateOrderStatus,
    onCustomerClick: (phone: string) => setCustomerHistoryPhone(phone),
    onChat: (o: Order) => setChatOrderId(o.id),
  };

  if (!isLoaded) {
    return (
      <div className="min-h-[100dvh] bg-background p-4 max-w-2xl mx-auto space-y-3" aria-busy="true" aria-label={label('Loading', 'لوڈ ہو رہا ہے')}>
        <div className="h-14 rounded-xl bg-muted animate-pulse motion-reduce:animate-none" />
        <div className="h-28 rounded-2xl bg-muted animate-pulse motion-reduce:animate-none" />
        {[0, 1, 2].map((i) => <div key={i} className="h-40 rounded-xl bg-muted animate-pulse motion-reduce:animate-none" />)}
      </div>
    );
  }

  const shopLabel = currentUser?.shopName || 'Darzi Khata';
  const filters: { id: FilterTab; en: string; ur: string; icon?: typeof Scissors }[] = [
    { id: 'all', en: 'All', ur: 'سب' },
    { id: 'urgent', en: 'Urgent', ur: 'ہنگامی', icon: AlertTriangle },
    { id: 'soon', en: 'Due soon', ur: 'جلد' },
    ...(['pending', 'stitching', 'ready', 'delivered'] as const).map((s) => ({ id: s, en: STATUS_META[s].en, ur: STATUS_META[s].ur, icon: STATUS_META[s].icon })),
  ];

  return (
    <div className="min-h-[100dvh] bg-background pb-28 text-foreground">
      <header className="bg-emerald-800 text-white px-4 py-3 shadow-md sticky top-0 z-20">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl font-black tracking-tight flex items-center gap-2">
              <Scissors className="rotate-90 shrink-0 text-amber-500" size={20} aria-hidden />
              <span className="min-w-0 break-words [overflow-wrap:anywhere]">{shopLabel.toUpperCase()}</span>
            </h1>
            <p className="text-emerald-200 text-xs mt-0.5 break-words">{currentUser?.name} · {label('Owner', 'مالک')}</p>
          </div>
          {demoMode && <span className="inline-flex items-center gap-1 bg-amber-500 text-emerald-950 text-[11px] font-black px-2 py-1 rounded-full shrink-0" data-testid="badge-demo"><FlaskConical size={12} aria-hidden /> {label('DEMO', 'ڈیمو')}</span>}
        </div>
      </header>

      <main className="p-4 max-w-2xl mx-auto">
        {tab === 'orders' && (
          <div className="dk-rise">
            <DailySummary orders={orders} onOpenDue={() => setTool('due')} />
            <StatsBar orders={orders} onDueTodayClick={() => setTool('due')} />

            <div className="relative mb-3">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" size={17} aria-hidden />
              <input type="search" aria-label={label('Search orders', 'آرڈر تلاش کریں')}
                className="block w-full min-h-[48px] ps-10 pe-3 border border-border rounded-xl bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
                placeholder={label('Name, phone, last 4 digits or DK-001', 'نام، فون، آخری 4 ہندسے یا DK-001')}
                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} data-testid="input-search" />
            </div>

            <div className="flex flex-wrap gap-2 mb-3 pb-1" role="tablist" aria-label={label('Filter orders', 'آرڈر چھانٹیں')}>
              {filters.map(({ id, en, ur, icon: Icon }) => (
                <button key={id} role="tab" aria-selected={activeFilter === id} onClick={() => setActiveFilter(id)}
                  className={`whitespace-nowrap min-h-[44px] px-3.5 rounded-full text-xs font-bold border shrink-0 inline-flex items-center gap-1 ${activeFilter === id ? 'bg-emerald-800 text-white border-emerald-800' : 'bg-card text-muted-foreground border-border'}`} data-testid={`filter-${id}`}>
                  {Icon && <Icon size={13} aria-hidden />}{label(en, ur)}
                </button>
              ))}
            </div>

            {activeKarigars.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4 pb-1">
                <button onClick={() => setKarigarFilter('')} aria-pressed={karigarFilter === ''} className={`whitespace-nowrap min-h-[44px] px-3 rounded-full text-xs font-semibold border shrink-0 ${karigarFilter === '' ? 'bg-amber-600 text-white border-amber-600' : 'bg-card text-muted-foreground border-border'}`}>{label('All karigars', 'سب کاریگر')}</button>
                {activeKarigars.map((k) => (
                  <button key={k} aria-pressed={karigarFilter === k} onClick={() => setKarigarFilter(karigarFilter === k ? '' : k)} className={`whitespace-nowrap min-h-[44px] px-3 rounded-full text-xs font-semibold border shrink-0 ${karigarFilter === k ? 'bg-amber-600 text-white border-amber-600' : 'bg-card text-muted-foreground border-border'}`}>{k}</button>
                ))}
              </div>
            )}

            {overdueOrders.length > 0 && (
              <div className="mb-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex-1 h-px bg-red-300 dark:bg-red-800" />
                  <span className="text-xs font-bold text-red-700 dark:text-red-400 uppercase tracking-wider flex items-center gap-1"><AlertTriangle size={12} aria-hidden /> {label('Overdue', 'دیر')} ({overdueOrders.length})</span>
                  <div className="flex-1 h-px bg-red-300 dark:bg-red-800" />
                </div>
                <div className="space-y-3">{overdueOrders.map((o) => <OrderCard key={o.id} order={o} {...cardProps} />)}</div>
              </div>
            )}

            <div className="space-y-3">
              {orders.length === 0 ? (
                <div className="text-center py-10 px-5 bg-card rounded-2xl border border-dashed border-border" data-testid="empty-orders">
                  <Scissors className="mx-auto text-amber-600 mb-3 rotate-90" size={40} aria-hidden />
                  <p className={`font-bold text-lg ${urduFirst ? 'font-urdu leading-loose' : ''}`}>{label('Your khata is empty', 'آپ کا کھاتہ خالی ہے')}</p>
                  <p className="text-sm text-muted-foreground mt-1">{label('Write the first order, or try the app with sample orders.', 'پہلا آرڈر لکھیں یا نمونہ ڈیٹا سے آزمائیں')}</p>
                  <div className="grid gap-2 mt-4">
                    <button onClick={() => setQuickOpen(true)} className="min-h-[48px] rounded-xl bg-amber-600 text-white font-bold" data-testid="btn-empty-new">{label('Write first order', 'پہلا آرڈر لکھیں')}</button>
                    {!demoMode && <button onClick={() => { setDemoMode(true); toast({ title: label('Demo data loaded', 'ڈیمو ڈیٹا لوڈ'), description: label('Kept separate from your real khata. Turn off in Settings.', 'اصل کھاتے سے الگ، سیٹنگز میں بند کریں') }); }} className="min-h-[48px] rounded-xl border border-border font-bold flex items-center justify-center gap-2" data-testid="btn-load-demo"><FlaskConical size={16} aria-hidden /> {label('Load demo data', 'ڈیمو ڈیٹا لوڈ کریں')}</button>}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-4">{label('Data lives on this phone only. No cloud sync.', 'ڈیٹا صرف اسی فون پر ہے')}</p>
                </div>
              ) : total === 0 ? (
                <div className="text-center py-10 bg-card rounded-xl border border-dashed border-border">
                  <Search className="mx-auto text-muted-foreground mb-2" size={30} aria-hidden />
                  <p className="text-muted-foreground font-medium">{label('No orders match', 'کوئی آرڈر نہیں ملا')}</p>
                  <button onClick={() => { setSearchTerm(''); setActiveFilter('all'); setKarigarFilter(''); }} className="mt-3 min-h-[44px] px-4 rounded-lg bg-muted text-sm font-bold">{label('Clear filters', 'فلٹر ہٹائیں')}</button>
                </div>
              ) : (
                restOrders.map((o) => <OrderCard key={o.id} order={o} {...cardProps} />)
              )}
            </div>
          </div>
        )}

        {tab === 'customers' && (
          <CustomersPanel orders={orders} onHistory={(p) => setCustomerHistoryPhone(p)} onQuickOrder={(c) => { setQuickCustomer(c); setQuickOpen(true); }} />
        )}
        {tab === 'payments' && <PaymentsPanel orders={orders} onViewReceipt={openReceipt} />}
        {tab === 'more' && <MorePanel onOpen={setTool} onLogout={() => setLogoutOpen(true)} pendingCount={pendingCount} />}
      </main>

      <BottomNav tab={tab} onTab={setTab} onNew={() => setChooserOpen(true)} badge={pendingCount} />

      {/* New order chooser */}
      <AlertDialog open={chooserOpen} onOpenChange={setChooserOpen}>
        <AlertDialogContent className="w-[calc(100%-1.5rem)] max-w-sm rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>{label('New order', 'نیا آرڈر')}</AlertDialogTitle>
            <AlertDialogDescription>{label('Choose how to write it', 'طریقہ چنیں')}</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-2">
            <button onClick={() => { setChooserOpen(false); setQuickCustomer(undefined); setQuickOpen(true); }} className="min-h-[64px] rounded-xl bg-amber-600 text-white font-bold flex items-center gap-3 px-4 text-start" data-testid="btn-new-quick">
              <Zap size={22} aria-hidden /><span><span className="block">{label('Quick order', 'فوری آرڈر')}</span><span className="block text-xs font-normal opacity-90">{label('Saved customer, one garment', 'محفوظ گاہک، ایک کپڑا')}</span></span>
            </button>
            <button onClick={() => { setChooserOpen(false); openFull(); }} className="min-h-[64px] rounded-xl border border-border font-bold flex items-center gap-3 px-4 text-start" data-testid="btn-new-full">
              <ListChecks size={22} aria-hidden /><span><span className="block">{label('Full order', 'مکمل آرڈر')}</span><span className="block text-xs font-normal text-muted-foreground">{label('Many garments, photo, style', 'کئی کپڑے، تصویر، ڈیزائن')}</span></span>
            </button>
          </div>
          <AlertDialogFooter><AlertDialogCancel className="min-h-[44px]">{label('Cancel', 'منسوخ')}</AlertDialogCancel></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete confirm */}
      <AlertDialog open={!!pendingDelete} onOpenChange={(v) => { if (!v) setPendingDelete(null); }}>
        <AlertDialogContent className="w-[calc(100%-1.5rem)] max-w-sm rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>{label('Delete this order?', 'یہ آرڈر حذف کریں؟')}</AlertDialogTitle>
            <AlertDialogDescription>{pendingDelete?.customerName} {pendingDelete?.serialNumber} — {label('You can undo right after.', 'فوراً بعد واپس لا سکتے ہیں')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="min-h-[44px]">{label('Keep', 'رہنے دیں')}</AlertDialogCancel>
            <AlertDialogAction className="min-h-[44px] bg-red-600 hover:bg-red-700" onClick={confirmDelete} data-testid="btn-confirm-delete">{label('Delete', 'حذف کریں')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Logout confirm */}
      <AlertDialog open={logoutOpen} onOpenChange={setLogoutOpen}>
        <AlertDialogContent className="w-[calc(100%-1.5rem)] max-w-sm rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>{label('Log out?', 'لاگ آؤٹ کریں؟')}</AlertDialogTitle>
            <AlertDialogDescription>{label('Your data stays on this phone.', 'ڈیٹا اسی فون پر رہے گا')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="min-h-[44px]">{label('Cancel', 'منسوخ')}</AlertDialogCancel>
            <AlertDialogAction className="min-h-[44px]" onClick={logout} data-testid="btn-confirm-logout">{label('Log out', 'لاگ آؤٹ')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <OrderForm open={formOpen} onOpenChange={setFormOpen} order={editingOrder} prefill={prefilledData} onSave={handleSave} />
      <QuickOrderForm open={quickOpen} onOpenChange={setQuickOpen} initialCustomer={quickCustomer} orders={orders} onSave={addOrder} onOpenFull={openFull} />
      <ReceiptModal open={receiptOpen} onOpenChange={setReceiptOpen} order={receiptOrder} />
      <SettingsModal {...toolProps('settings')} orders={orders} setAllOrders={setAllOrders} />
      <EarningsModal {...toolProps('earnings')} orders={orders} />
      <DueTodayModal {...toolProps('due')} orders={orders} onViewReceipt={openReceipt} />
      <WorkSheetModal {...toolProps('worksheet')} orders={orders} />
      <TeamModal {...toolProps('team')} />
      <OrderChatModal order={chatOrder} onClose={() => setChatOrderId(null)} onAddComment={addComment} />
      <CreditModal {...toolProps('credit')} orders={orders} />
      <ImpactModal {...toolProps('impact')} orders={orders} />
      <PendingRemindersModal {...toolProps('reminders')} orders={orders} />
      <CustomerHistoryModal
        phone={customerHistoryPhone}
        onClose={() => setCustomerHistoryPhone(null)}
        orders={orders}
        onCopyMeasurements={(o) => {
          openFull({ customerName: o.customerName, phone: o.phone, customerId: o.customerId, items: o.items, measurements: o.measurements, suitCount: o.suitCount, totalAmount: o.totalAmount, collarType: o.collarType, damanType: o.damanType, pockets: o.pockets, cuffType: o.cuffType, specialNotes: o.specialNotes, fabric: o.fabric });
        }}
      />
    </div>
  );
}
