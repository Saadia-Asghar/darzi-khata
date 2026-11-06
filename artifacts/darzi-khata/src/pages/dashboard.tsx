import { useState, useMemo, useEffect, lazy, type ReactNode } from 'react';
import { useLocation } from 'wouter';
import { useOrders } from '../hooks/use-orders';
import { useAuthContext } from '../context/auth-context';
import { OrderCard } from '../components/order-card';
import { StatsBar } from '../components/stats-bar';
import { SettingsModal } from '../components/settings-modal';
import { EarningsModal } from '../components/earnings-modal';
import { DueTodayModal } from '../components/due-today-modal';
import { CustomerHistoryModal } from '../components/customer-history-modal';
import { WorkSheetModal } from '../components/work-sheet-modal';
import { TeamModal } from '../components/team-modal';
import { OrderChatModal } from '../components/order-chat-modal';
import { PendingRemindersModal } from '../components/pending-reminders-modal';
import { BottomNav, type NavTab } from '../components/bottom-nav';
import { DailySummary } from '../components/daily-summary';
import { CustomersPanel } from '../components/customers-panel';
import { MorePanel, type MoreTool } from '../components/more-panel';
import { PageMode } from '../components/page-dialog';
import { isOverdue, startOfDay } from '../components/status-meta';
import { matchesCustomer } from '../components/format';
import { useDemoMode } from '../hooks/use-demo-mode';
import { usePreferences } from '../hooks/use-preferences';
import { pendingReminders } from '../lib/reminders';
import { scheduleDelete, cancelDelete, useHiddenOrders, UNDO_MS } from '../lib/pending-delete';
import { shortDate, type DictKey } from '../lib/i18n';
import { Customer, Order } from '../types/order';
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Search, FlaskConical, Zap, ListChecks, LockKeyhole, BarChart2, ChevronRight } from 'lucide-react';
import { BackupReminder } from '../components/backup-reminder';
import { ExpenseTools, ProfitSummary } from '../components/expense-tools';
import { RushTools } from '../components/rush-tools';
import { SavingsTools } from '../components/savings-tools';
import { RecoveryTools } from '../components/recovery-tools';
import { ShareProfileTools } from '../components/share-tools';
import { PitchDemo } from '../components/pitch-demo';
import { useSettings } from '../hooks/use-settings';

const CreditModal = lazy(() => import('../components/credit-modal').then(m => ({ default: m.CreditModal })));
const ImpactModal = lazy(() => import('../components/impact-modal').then(m => ({ default: m.ImpactModal })));
const PaymentsPanel = lazy(() => import('../components/payments-panel').then(m => ({ default: m.PaymentsPanel })));
const OrderForm = lazy(() => import('../components/order-form').then(m => ({ default: m.OrderForm })));
const QuickOrderForm = lazy(() => import('../components/quick-order-form').then(m => ({ default: m.QuickOrderForm })));
const ReceiptModal = lazy(() => import('../components/receipt-modal').then(m => ({ default: m.ReceiptModal })));
type FilterTab = 'all' | 'overdue' | 'soon' | 'ready' | 'delivered' | 'urgent' | 'pending' | 'stitching';
export type Section = NavTab | MoreTool | 'customer';

export default function Dashboard({ section = 'orders', phone }: { section?: Section; phone?: string }) {
  const { orders: allOrders, isLoaded, addOrder, updateOrder, deleteOrder, updateOrderStatus, setAllOrders, addComment } = useOrders();
  const { currentUser, logout } = useAuthContext();
  const { demoMode, setDemoMode } = useDemoMode();
  const { label, one, lang } = usePreferences();
  const { settings } = useSettings();
  const homeBased = settings.shopType === 'women-home-tailor';
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const hidden = useHiddenOrders();
  const orders = useMemo(() => allOrders.filter((o) => !hidden.has(o.id)), [allOrders, hidden]);

  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [karigarFilter, setKarigarFilter] = useState('');
  const [visibleLimit, setVisibleLimit] = useState(20);
  useEffect(() => { setVisibleLimit(20); }, [searchTerm, activeFilter, karigarFilter]);

  const [formOpen, setFormOpen] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);
  const [chooserOpen, setChooserOpen] = useState(false);
  const [quickCustomer, setQuickCustomer] = useState<Customer | undefined>();
  const [editingOrder, setEditingOrder] = useState<Order | undefined>();
  const [prefilledData, setPrefilledData] = useState<Partial<Order> | undefined>();
  const [pendingDelete, setPendingDelete] = useState<Order | null>(null);
  const [logoutOpen, setLogoutOpen] = useState(false);

  const [receiptOpen, setReceiptOpen] = useState(false);
  const [chatOrderId, setChatOrderId] = useState<string | null>(null);
  const [receiptOrderId, setReceiptOrderId] = useState<string | null>(null);
  const chatOrder = useMemo(() => orders.find((o) => o.id === chatOrderId) ?? null, [orders, chatOrderId]);
  const receiptOrder = useMemo(() => orders.find((o) => o.id === receiptOrderId) ?? null, [orders, receiptOrderId]);
  const pendingCount = useMemo(() => pendingReminders(orders).length, [orders]);
  const activeKarigars = useMemo(() => Array.from(new Set(orders.map((o) => o.karigar).filter(Boolean) as string[])).sort(), [orders]);

  const back = (fallback = '/') => {
    if (window.history.length > 1) window.history.back(); else navigate(fallback);
  };

  const soonCut = useMemo(() => { const t = startOfDay(new Date()); t.setDate(t.getDate() + 1); return t; }, []);
  const isSoon = (o: Order) => o.status !== 'delivered' && startOfDay(o.deliveryDate) <= soonCut;
  const counts = useMemo(() => ({
    all: orders.length,
    overdue: orders.filter((o) => isOverdue(o)).length,
    soon: orders.filter(isSoon).length,
    ready: orders.filter((o) => o.status === 'ready').length,
    delivered: orders.filter((o) => o.status === 'delivered').length,
    urgent: orders.filter((o) => o.urgent && o.status !== 'delivered').length,
    pending: orders.filter((o) => o.status === 'pending').length,
    stitching: orders.filter((o) => o.status === 'stitching').length,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [orders]);

  const visible = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    let r = orders.filter((o) => matchesCustomer(searchTerm, o.customerName, o.phone) || (o.serialNumber || '').toLowerCase().includes(q));
    if (karigarFilter) r = r.filter((o) => o.karigar === karigarFilter);
    if (activeFilter === 'overdue') r = r.filter((o) => isOverdue(o));
    else if (activeFilter === 'soon') r = r.filter(isSoon);
    else if (activeFilter === 'urgent') r = r.filter((o) => o.urgent);
    else if (activeFilter !== 'all') r = r.filter((o) => o.status === activeFilter);
    return [...r].sort((a, b) =>
      (isOverdue(b) ? 1 : 0) - (isOverdue(a) ? 1 : 0)
      || (a.status === 'delivered' ? 1 : 0) - (b.status === 'delivered' ? 1 : 0)
      || +new Date(a.deliveryDate) - +new Date(b.deliveryDate));
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
    scheduleDelete(victim.id, () => {
      try { deleteOrder(victim.id); }
      catch (e) { toast({ title: label('delete_failed'), description: e instanceof Error ? e.message : undefined, variant: 'destructive' }); }
    });
    toast({
      title: label('order_deleted'),
      duration: UNDO_MS,
      description: `${victim.customerName} ${victim.serialNumber ?? ''}`.trim(),
      action: (
        <ToastAction altText={label('undo_delete')} className="min-h-[44px]" onClick={() => { cancelDelete(victim.id); toast({ title: label('order_restored'), duration: 2500 }); }} data-testid="btn-undo-delete">
          {one('undo')}
        </ToastAction>
      ),
    });
  };

  const cardProps = {
    onEdit: (o: Order) => { setEditingOrder(o); setPrefilledData(undefined); setFormOpen(true); },
    onDelete: (id: string) => setPendingDelete(orders.find((o) => o.id === id) ?? null),
    onViewReceipt: openReceipt,
    onStatusChange: updateOrderStatus,
    onCustomerClick: (p: string) => navigate(`/customers/${encodeURIComponent(p)}`),
    onChat: (o: Order) => setChatOrderId(o.id),
  };

  if (!isLoaded) {
    return (
      <div className="min-h-[100dvh] bg-background p-4 max-w-2xl mx-auto space-y-3" aria-busy="true" aria-label={label('loading')}>
        <div className="h-14 rounded-lg bg-muted animate-pulse motion-reduce:animate-none" />
        <div className="h-20 rounded-lg bg-muted animate-pulse motion-reduce:animate-none" />
        {[0, 1, 2].map((i) => <div key={i} className="h-40 rounded-lg bg-muted animate-pulse motion-reduce:animate-none" />)}
      </div>
    );
  }

  const shopLabel = currentUser?.shopName || 'Darzi Khata';
  const filters: { id: FilterTab; k: DictKey }[] = [
    { id: 'all', k: 'filter_all' }, { id: 'overdue', k: 'filter_overdue' }, { id: 'soon', k: 'filter_soon' },
    { id: 'ready', k: 'filter_ready' }, { id: 'delivered', k: 'filter_delivered' }, { id: 'urgent', k: 'filter_urgent' },
    { id: 'pending', k: 'status_pending' }, { id: 'stitching', k: 'status_stitching' },
  ];
  const navTab: NavTab | null = section === 'orders' || section === 'customers' || section === 'hisaab' || section === 'more' ? section : section === 'customer' ? 'customers' : section === 'earnings' ? 'hisaab' : 'more';
  const isToolPage = !['orders', 'customers', 'hisaab', 'more'].includes(section);
  const page = (node: ReactNode, fallback = '/more') => <PageMode onBack={() => back(fallback)}>{node}</PageMode>;
  const pageOpen = { open: true, onOpenChange: (v: boolean) => { if (!v) back('/more'); } };
  const chip = (on: boolean) => `whitespace-nowrap min-h-[44px] px-3 rounded-md text-sm font-medium border shrink-0 inline-flex items-center gap-1.5 ${on ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-foreground border-border hover:bg-muted'}`;

  return (
    <div className="min-h-[100dvh] bg-background pb-28 text-foreground">
      {!isToolPage && (
        <header data-app-header className="bg-card border-b border-border px-4 sticky top-0 z-20 print:hidden">
          <div className="max-w-2xl mx-auto py-2">
            <div className="flex items-center gap-2">
              <h1 className="flex-1 min-w-0 truncate text-lg font-semibold" data-testid="text-shop-name" title={shopLabel}>{shopLabel}</h1>
              <span className="shrink-0 inline-flex h-11 w-11 items-center justify-center rounded-md text-primary" role="img" aria-label={label('data_note')} title={label('data_note')}><LockKeyhole size={20} aria-hidden /></span>
            </div>
            <div className="flex items-center gap-1.5 min-w-0 pb-1">
              <span className="text-sm text-muted-foreground shrink-0">{shortDate(new Date(), lang)}</span>
              {demoMode && <span className="shrink-0 rounded-md bg-warning-soft text-warning border border-warning/30 text-xs font-medium px-1.5 py-0.5" data-testid="badge-demo">{one('demo_badge')}</span>}
              <span className="min-w-0 truncate text-sm text-muted-foreground" title={currentUser?.name}>· {currentUser?.name}</span>
            </div>
          </div>
        </header>
      )}

      {section === 'orders' && (
        <main className="p-4 max-w-2xl mx-auto dk-rise">
          {homeBased && <section className="rounded-lg border border-border bg-card p-4 mb-3">
            <h2 className="font-semibold">{label('feature_home_based')}</h2><p className="text-sm text-muted-foreground">{label('feature_home_intro')}</p>
            <button className="mt-3 min-h-[48px] rounded-lg px-4 bg-primary text-primary-foreground font-semibold" onClick={() => { setQuickCustomer(undefined); setQuickOpen(true); }}>{label('new_order')}</button>
          </section>}
          <div className="mb-3"><BackupReminder onBackup={() => navigate('/settings#backup')} /></div>
          {!homeBased && <><DailySummary orders={orders} onOpenDue={() => navigate('/due')} />
          <StatsBar orders={orders} onDueTodayClick={() => navigate('/due')} /></>}

          <div className="relative mb-3">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" size={20} aria-hidden />
            <input type="search" aria-label={label('search_orders')}
              className="block w-full min-h-[48px] ps-10 pe-3 border border-input rounded-lg bg-card text-foreground text-base placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder={label('search_placeholder')} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} data-testid="input-search" />
          </div>

          <div className="flex gap-2 mb-3 overflow-x-auto pb-1 -mx-4 px-4 [scrollbar-width:none]" role="tablist" aria-label={label('filter_orders')}>
            {filters.map(({ id, k }) => (
              <button key={id} role="tab" aria-selected={activeFilter === id} onClick={() => setActiveFilter(id)} className={chip(activeFilter === id)} data-testid={`filter-${id}`}>
                <span>{one(k)}</span>
                <span className={`num text-sm ${activeFilter === id ? '' : id === 'overdue' && counts.overdue > 0 ? 'text-danger font-semibold' : 'text-muted-foreground'}`}>{counts[id]}</span>
              </button>
            ))}
          </div>

          {!homeBased && activeKarigars.length > 0 && (
            <div className="flex gap-2 mb-4 overflow-x-auto pb-1 -mx-4 px-4 [scrollbar-width:none]" aria-label={label('all_karigars')}>
              <button onClick={() => setKarigarFilter('')} aria-pressed={karigarFilter === ''} className={chip(karigarFilter === '')}>{label('all_karigars')}</button>
              {activeKarigars.map((k) => (
                <button key={k} aria-pressed={karigarFilter === k} onClick={() => setKarigarFilter(karigarFilter === k ? '' : k)} className={chip(karigarFilter === k)}>{k}</button>
              ))}
            </div>
          )}

          <div className="space-y-3">
            {orders.length === 0 ? (
              <div className="py-8 px-5 bg-card rounded-lg border border-border text-center" data-testid="empty-orders">
                <p className="text-base font-medium">{label('empty_orders')}</p>
                <div className="grid gap-2 mt-4">
                  <button onClick={() => setQuickOpen(true)} className="min-h-[48px] rounded-md bg-primary text-primary-foreground text-base font-semibold" data-testid="btn-empty-new">{label('add_first_order')}</button>
                  {!demoMode && <button onClick={() => { setDemoMode(true); toast({ title: label('demo_loaded'), description: label('demo_loaded_hint') }); }} className="min-h-[48px] rounded-md border border-border text-base font-medium inline-flex items-center justify-center gap-2" data-testid="btn-load-demo"><FlaskConical size={20} aria-hidden /> {label('load_demo')}</button>}
                </div>
                <p className="text-sm text-muted-foreground mt-4">{label('data_note')}</p>
              </div>
            ) : visible.length === 0 ? (
              <div className="py-8 bg-card rounded-lg border border-border text-center">
                <p className="text-base text-muted-foreground">{label('no_match')}</p>
                <button onClick={() => { setSearchTerm(''); setActiveFilter('all'); setKarigarFilter(''); }} className="mt-3 min-h-[44px] px-4 rounded-md border border-border text-base font-medium">{label('clear_filters')}</button>
              </div>
            ) : (
              visible.slice(0, visibleLimit).map((o) => <OrderCard key={o.id} order={o} {...cardProps} />)
            )}
            {visible.length > visibleLimit && <button type="button" className="w-full min-h-[48px] border border-border rounded-lg bg-card text-primary font-semibold" onClick={() => setVisibleLimit(n => n + 20)} data-testid="orders-show-more">{label('feature_more_orders', { shown: Math.min(visibleLimit, visible.length), total: visible.length })}</button>}
          </div>
        </main>
      )}

      {section === 'customers' && (
        <main className="p-4 max-w-2xl mx-auto">
          <CustomersPanel orders={orders} onHistory={(p) => navigate(`/customers/${encodeURIComponent(p)}`)} onQuickOrder={(c) => { setQuickCustomer(c); setQuickOpen(true); }} />
        </main>
      )}
      {section === 'hisaab' && (
        <main className="p-4 max-w-2xl mx-auto space-y-4">
          <h1 className="text-xl font-semibold">{label('hisaab_title')}</h1>
          <ProfitSummary orders={orders} />
          <button onClick={() => navigate('/earnings')} className="w-full min-h-[56px] rounded-lg border border-border bg-card px-4 flex items-center gap-3 text-start hover:bg-muted" data-testid="btn-open-earnings">
            <BarChart2 size={20} aria-hidden className="text-primary" />
            <span className="flex-1 text-base font-medium">{label('open_earnings')}</span>
            <ChevronRight size={20} aria-hidden className="text-muted-foreground rtl:rotate-180" />
          </button>
          <PaymentsPanel orders={orders} onViewReceipt={openReceipt} />
        </main>
      )}
      {section === 'more' && (
        <main className="p-4 max-w-2xl mx-auto">
          <MorePanel onLogout={() => setLogoutOpen(true)} pendingCount={pendingCount} />
        </main>
      )}

      {section === 'settings' && page(<SettingsModal {...pageOpen} orders={allOrders} setAllOrders={setAllOrders} />)}
      {section === 'earnings' && page(<EarningsModal {...pageOpen} orders={orders} />, '/hisaab')}
      {section === 'due' && page(<DueTodayModal {...pageOpen} orders={orders} onViewReceipt={openReceipt} />, '/')}
      {section === 'worksheet' && page(<WorkSheetModal {...pageOpen} orders={orders} />)}
      {section === 'team' && page(<TeamModal {...pageOpen} />)}
      {section === 'credit' && page(<CreditModal {...pageOpen} orders={orders} />)}
      {section === 'impact' && page(<ImpactModal {...pageOpen} orders={orders} />)}
      {section === 'reminders' && page(<PendingRemindersModal {...pageOpen} orders={orders} />)}
      {section === 'pitch' && <PitchDemo />}
      {section === 'share-profile' && <ShareProfileTools orders={orders} />}
      {section === 'recovery' && <RecoveryTools orders={orders} />}
      {section === 'rush' && <RushTools orders={orders} />}
      {section === 'expenses' && <ExpenseTools orders={orders} />}
      {section === 'savings' && <SavingsTools orders={orders} />}
      {section === 'customer' && page(
        <CustomerHistoryModal
          phone={phone ?? ''}
          onClose={() => back('/customers')}
          orders={orders}
          onCopyMeasurements={(o) => {
            openFull({ customerName: o.customerName, phone: o.phone, customerId: o.customerId, items: o.items, measurements: o.measurements, suitCount: o.suitCount, totalAmount: o.totalAmount, collarType: o.collarType, damanType: o.damanType, pockets: o.pockets, cuffType: o.cuffType, specialNotes: o.specialNotes, fabric: o.fabric });
          }}
        />, '/customers')}

      <BottomNav tab={navTab} onNew={() => setChooserOpen(true)} badge={pendingCount} />

      <AlertDialog open={chooserOpen} onOpenChange={setChooserOpen}>
        <AlertDialogContent className="w-[calc(100%-1.5rem)] max-w-sm rounded-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>{label('new_order')}</AlertDialogTitle>
            <AlertDialogDescription className="text-base">{label('choose_how')}</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-2">
            <button onClick={() => { setChooserOpen(false); setQuickCustomer(undefined); setQuickOpen(true); }} className="min-h-[64px] rounded-md bg-accent text-accent-foreground border border-accent-border font-semibold flex items-center gap-3 px-4 text-start" data-testid="btn-new-quick">
              <Zap size={20} aria-hidden /><span><span className="block text-base">{label('quick_order')}</span><span className="block text-sm font-normal">{label('quick_order_hint')}</span></span>
            </button>
            <button onClick={() => { setChooserOpen(false); openFull(); }} className="min-h-[64px] rounded-md border border-border font-semibold flex items-center gap-3 px-4 text-start hover:bg-muted" data-testid="btn-new-full">
              <ListChecks size={20} aria-hidden /><span><span className="block text-base">{label('full_order')}</span><span className="block text-sm font-normal text-muted-foreground">{label('full_order_hint')}</span></span>
            </button>
          </div>
          <AlertDialogFooter><AlertDialogCancel className="min-h-[44px]">{label('cancel')}</AlertDialogCancel></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!pendingDelete} onOpenChange={(v) => { if (!v) setPendingDelete(null); }}>
        <AlertDialogContent className="w-[calc(100%-1.5rem)] max-w-sm rounded-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>{label('delete_title')}</AlertDialogTitle>
            <AlertDialogDescription className="text-base">{pendingDelete?.customerName} {pendingDelete?.serialNumber}. {label('delete_hint')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="min-h-[44px]">{label('keep')}</AlertDialogCancel>
            <AlertDialogAction className="min-h-[44px] bg-danger text-danger-foreground hover:bg-danger/90" onClick={confirmDelete} data-testid="btn-confirm-delete">{label('delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={logoutOpen} onOpenChange={setLogoutOpen}>
        <AlertDialogContent className="w-[calc(100%-1.5rem)] max-w-sm rounded-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>{label('log_out_q')}</AlertDialogTitle>
            <AlertDialogDescription className="text-base">{label('data_stays')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="min-h-[44px]">{label('cancel')}</AlertDialogCancel>
            <AlertDialogAction className="min-h-[44px]" onClick={logout} data-testid="btn-confirm-logout">{label('log_out')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {formOpen && <OrderForm open={formOpen} onOpenChange={setFormOpen} order={editingOrder} prefill={prefilledData} onSave={handleSave} />}
      {quickOpen && <QuickOrderForm open={quickOpen} onOpenChange={setQuickOpen} initialCustomer={quickCustomer} orders={orders} onSave={addOrder} onOpenFull={openFull} />}
      {receiptOpen && <ReceiptModal open={receiptOpen} onOpenChange={setReceiptOpen} order={receiptOrder} />}
      <OrderChatModal order={chatOrder} onClose={() => setChatOrderId(null)} onAddComment={addComment} />
    </div>
  );
}

