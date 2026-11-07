import { useState, useMemo, useEffect, lazy, type ReactNode } from 'react';
import { useLocation } from 'wouter';
import { useOrders } from '../hooks/use-orders';
import { useAuthContext } from '../context/auth-context';
import { OrderCard, OrderRow, ORDER_ROW_GRID } from '../components/order-card';
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
import { Search, FlaskConical, Zap, ListChecks, LockKeyhole, BarChart2, ChevronRight, X } from 'lucide-react';
import { DesktopSidebar, DesktopTopBar, type SideTab } from '../components/desktop-shell';
import { OrderDetailPane, TodayPanel } from '../components/order-detail-pane';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { BackupReminder } from '../components/backup-reminder';
import { ExpenseTools, ProfitSummary } from '../components/expense-tools';
import { RushTools } from '../components/rush-tools';
import { SavingsTools } from '../components/savings-tools';
import { RecoveryTools } from '../components/recovery-tools';
import { ShareProfileTools } from '../components/share-tools';
import { PitchDemo } from '../components/pitch-demo';
import { useSettings } from '../hooks/use-settings';
import { KpiTiles } from '../components/kpi-tiles';

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
  const [displayOrder, setDisplayOrder] = useState<string[] | null>(null);
  useEffect(() => { setVisibleLimit(20); setDisplayOrder(null); }, [searchTerm, activeFilter, karigarFilter]);

  const [formOpen, setFormOpen] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);
  const [chooserOpen, setChooserOpen] = useState(false);
  const [quickCustomer, setQuickCustomer] = useState<Customer | undefined>();
  const [editingOrder, setEditingOrder] = useState<Order | undefined>();
  const [prefilledData, setPrefilledData] = useState<Partial<Order> | undefined>();
  const [pendingDelete, setPendingDelete] = useState<Order | null>(null);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

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
    const sorted = [...r].sort((a, b) =>
      (isOverdue(b) ? 1 : 0) - (isOverdue(a) ? 1 : 0)
      || (a.status === 'delivered' ? 1 : 0) - (b.status === 'delivered' ? 1 : 0)
      || +new Date(a.deliveryDate) - +new Date(b.deliveryDate));
    // A status edit must not replace the tapped card with a different order.
    // Explicit filter/search changes restore the normal active-first sorting.
    if (displayOrder) {
      const rank = new Map(displayOrder.map((id, index) => [id, index]));
      sorted.sort((a, b) => (rank.get(a.id) ?? -1) - (rank.get(b.id) ?? -1));
    }
    return sorted;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders, searchTerm, activeFilter, karigarFilter, displayOrder]);

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
    onStatusChange: (id: string, status: Order['status']) => {
      const selected = orders.find(o => o.id === id);
      if (!selected || selected.status === status) return;
      try {
        updateOrderStatus(id, status);
        if (activeFilter === 'all') setDisplayOrder(visible.map(o => o.id));
        toast({
          title: `${selected.serialNumber || selected.customerName}: ${label(`status_${status}`)}`,
          description: selected.serialNumber ? selected.customerName : undefined,
          duration: 2500,
        });
      } catch (error) {
        toast({ title: label('status_change_failed'), description: error instanceof Error ? error.message : undefined, variant: 'destructive' });
      }
    },
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
  const page = (node: ReactNode, fallback = '/more', wide?: string) => <PageMode onBack={() => back(fallback)} wide={wide}>{node}</PageMode>;
  const sideTab: SideTab = section === 'credit' ? 'credit' : section === 'impact' ? 'payments' : section === 'reminders' ? 'reminders' : navTab;
  const selectedOrder = orders.find((o) => o.id === selectedOrderId) ?? null;
  const openDetails = (o: Order) => { setSelectedOrderId(o.id); setDetailOpen(true); };
  const wrap = 'px-4 pt-2 pb-4 md:pt-3 max-w-2xl md:max-w-none lg:max-w-[1440px] lg:px-4 lg:pt-4 mx-auto';
  const pageOpen = { open: true, onOpenChange: (v: boolean) => { if (!v) back('/more'); } };
  const chip = (on: boolean) => `whitespace-nowrap min-h-[36px] h-9 px-2.5 rounded-md text-sm font-medium border shrink-0 inline-flex items-center gap-1.5 ${on ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-foreground border-border hover:bg-muted'}`;

  return (
    <div className="min-h-[100dvh] bg-background pb-24 lg:pb-4 text-foreground lg:ps-16 xl:ps-[220px]">
      <DesktopSidebar tab={sideTab} onNew={() => setChooserOpen(true)} onLogout={() => setLogoutOpen(true)} onSetupPin={() => navigate('/settings#pin')} pendingCount={pendingCount} />
      <DesktopTopBar shopLabel={shopLabel} ownerName={currentUser?.name} demo={demoMode} search={searchTerm}
        onSearch={(q) => { setSearchTerm(q); if (section !== 'orders') navigate('/'); }} />
      {!isToolPage && (
        <header data-app-header className="lg:hidden bg-card border-b border-border px-4 sticky top-0 z-20 print:hidden">
          <div className="max-w-2xl md:max-w-none mx-auto h-14 flex items-center gap-2 min-w-0">
            <div className="flex-1 min-w-0">
              <h1 className="truncate text-base font-semibold leading-tight" data-testid="text-shop-name" title={shopLabel}>{shopLabel}</h1>
              <p className="truncate text-xs text-muted-foreground leading-tight" title={currentUser?.name}>{shortDate(new Date(), lang)}{currentUser?.name ? ` · ${currentUser.name}` : ''}</p>
            </div>
            {demoMode && <span className="shrink-0 rounded-md bg-warning-soft text-warning border border-warning/30 text-xs font-medium px-1.5 py-0.5" data-testid="badge-demo">{one('demo_badge')}</span>}
            <span className="shrink-0 inline-flex h-10 w-10 items-center justify-center rounded-md text-primary" role="img" aria-label={label('data_note')} title={label('data_note')}><LockKeyhole size={20} aria-hidden /></span>
          </div>
        </header>
      )}

      {section === 'orders' && (
        <main className={`${wrap} dk-rise`}>
          {homeBased && <section className="rounded-lg border border-border bg-card p-3 mb-2 flex items-center gap-3">
            <div className="flex-1 min-w-0"><h2 className="font-semibold truncate">{label('feature_home_based')}</h2><p className="text-sm text-muted-foreground truncate">{label('feature_home_intro')}</p></div>
            <button className="min-h-[40px] rounded-md px-3 bg-primary text-primary-foreground text-sm font-semibold" onClick={() => { setQuickCustomer(undefined); setQuickOpen(true); }}>{label('new_order')}</button>
          </section>}
          <div className="hidden md:block mb-2 lg:mb-3"><BackupReminder onBackup={() => navigate('/settings#backup')} /></div>

          <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_380px] xl:grid-cols-[minmax(0,1fr)_420px] lg:gap-4 lg:items-start">
          <div className="min-w-0">
          {!homeBased && <StatsBar orders={orders} onDueTodayClick={() => navigate('/due')} />}
          <div className="relative mb-2 lg:hidden">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" size={18} aria-hidden />
            <input type="search" aria-label={label('search_orders')}
              className="block w-full h-10 ps-9 pe-3 border border-input rounded-lg bg-card text-foreground text-base placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder={label('search_placeholder')} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} data-testid="input-search" />
          </div>

          <div className="flex items-center gap-1.5 mb-2 lg:mb-3 overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 [scrollbar-width:none]" data-testid="filter-row">
            <div className="flex gap-1.5 shrink-0" role="tablist" aria-label={label('filter_orders')}>
              {filters.map(({ id, k }) => (
                <button key={id} role="tab" aria-selected={activeFilter === id} onClick={() => setActiveFilter(id)} className={chip(activeFilter === id)} data-testid={`filter-${id}`}>
                  <span>{one(k)}</span>
                  <span className={`num text-xs ${activeFilter === id ? '' : id === 'overdue' && counts.overdue > 0 ? 'text-danger font-semibold' : 'text-muted-foreground'}`}>{counts[id]}</span>
                </button>
              ))}
            </div>
            {!homeBased && activeKarigars.length > 0 && <>
              <span className="shrink-0 w-px h-6 bg-border mx-1" aria-hidden />
              <div className="flex gap-1.5 shrink-0" role="group" aria-label={label('all_karigars')}>
                <button onClick={() => setKarigarFilter('')} aria-pressed={karigarFilter === ''} className={chip(karigarFilter === '')} data-testid="filter-karigar-all">{label('all_karigars')}</button>
                {activeKarigars.map((k) => (
                  <button key={k} aria-pressed={karigarFilter === k} onClick={() => setKarigarFilter(karigarFilter === k ? '' : k)} className={chip(karigarFilter === k)} data-testid={`filter-karigar-${k}`}>{k}</button>
                ))}
              </div>
            </>}
          </div>

          <div data-testid="orders-list">
            {orders.length === 0 ? (
              <div className="py-4 px-4 bg-card rounded-lg border border-border text-center" data-testid="empty-orders">
                <p className="text-base font-medium">{label('empty_orders')}</p>
                <div className="grid gap-2 mt-3 max-w-sm mx-auto">
                  <button onClick={() => setQuickOpen(true)} className="min-h-[44px] rounded-md bg-primary text-primary-foreground text-base font-semibold" data-testid="btn-empty-new">{label('add_first_order')}</button>
                  {!demoMode && <button onClick={() => { setDemoMode(true); toast({ title: label('demo_loaded'), description: label('demo_loaded_hint') }); }} className="min-h-[44px] rounded-md border border-border text-base font-medium inline-flex items-center justify-center gap-2" data-testid="btn-load-demo"><FlaskConical size={20} aria-hidden /> {label('load_demo')}</button>}
                </div>
                <p className="text-sm text-muted-foreground mt-3">{label('data_note')}</p>
              </div>
            ) : visible.length === 0 ? (
              <div className="py-4 bg-card rounded-lg border border-border text-center">
                <p className="text-base text-muted-foreground">{label('no_match')}</p>
                <button onClick={() => { setSearchTerm(''); setActiveFilter('all'); setKarigarFilter(''); }} className="mt-2 min-h-[44px] px-4 rounded-md border border-border text-base font-medium">{label('clear_filters')}</button>
              </div>
            ) : (<>
              <div className="lg:hidden grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
                {visible.slice(0, visibleLimit).map((o) => (
                  <div key={o.id} data-testid={`order-select-${o.id}`} className="min-w-0">
                    <OrderCard order={o} {...cardProps} onOpen={openDetails} />
                  </div>
                ))}
              </div>
              <div className="hidden lg:block rounded-lg border border-border bg-card overflow-hidden" role="table" aria-label={label('nav_orders')} data-testid="orders-table">
                <div role="row" className={`${ORDER_ROW_GRID} px-3 h-8 bg-muted text-xs font-medium text-muted-foreground border-b border-border`}>
                  <span role="columnheader">DK</span><span role="columnheader">{label('dk_col_customer')}</span><span role="columnheader">{label('dk_col_garments')}</span>
                  <span role="columnheader">{label('dk_col_delivery')}</span><span role="columnheader">{label('dk_col_status')}</span><span role="columnheader" className="text-end">{one('baqi')}</span><span role="columnheader" className="w-[140px]">{label('dk_col_actions')}</span>
                </div>
                <div className="divide-y divide-border">
                  {visible.slice(0, visibleLimit).map((o) => (
                    <div key={o.id} data-testid={`order-row-${o.id}`}>
                      <OrderRow order={o} {...cardProps} onOpen={(x) => setSelectedOrderId(x.id)} selected={selectedOrder?.id === o.id} />
                    </div>
                  ))}
                </div>
              </div>
            </>)}
            {visible.length > visibleLimit && <button type="button" className="mt-2 w-full min-h-[44px] border border-border rounded-lg bg-card text-primary font-semibold" onClick={() => setVisibleLimit(n => n + 20)} data-testid="orders-show-more">{label('feature_more_orders', { shown: Math.min(visibleLimit, visible.length), total: visible.length })}</button>}
          </div>
          <div className="md:hidden mt-3"><BackupReminder onBackup={() => navigate('/settings#backup')} /></div>
          </div>
          <aside className="hidden lg:block sticky top-[72px] max-h-[calc(100dvh-88px)] overflow-y-auto" data-testid="order-detail-aside">
            {selectedOrder ? <>
              <button type="button" onClick={() => setSelectedOrderId(null)} className="mb-2 min-h-[32px] h-8 px-2 rounded-md text-sm text-muted-foreground hover:bg-muted inline-flex items-center gap-1" data-testid="btn-detail-today"><X size={16} aria-hidden /> {label('dk_close_details')}</button>
              <OrderDetailPane order={selectedOrder} shopFallback={shopLabel} onPrint={openReceipt} onEdit={cardProps.onEdit}
                onChat={cardProps.onChat} onCustomer={(k) => navigate(`/customers/${encodeURIComponent(k)}`)} />
            </> : <TodayPanel orders={orders} onSelect={(o) => setSelectedOrderId(o.id)} />}
          </aside>
          </div>

          <Dialog open={detailOpen && !!selectedOrder} onOpenChange={setDetailOpen}>
            <DialogContent className="w-[calc(100%-1rem)] max-w-[560px] max-h-[92dvh] overflow-y-auto rounded-lg p-3 lg:hidden" data-testid="order-detail-dialog">
              <DialogTitle className="text-base font-semibold pe-8">{label('dk_open_details')}</DialogTitle>
              <OrderDetailPane order={selectedOrder} shopFallback={shopLabel} onPrint={(o) => { setDetailOpen(false); openReceipt(o); }} onEdit={(o) => { setDetailOpen(false); cardProps.onEdit(o); }}
                onChat={(o) => { setDetailOpen(false); cardProps.onChat(o); }} onCustomer={(k) => { setDetailOpen(false); navigate(`/customers/${encodeURIComponent(k)}`); }} />
            </DialogContent>
          </Dialog>
        </main>
      )}
      {section === 'customers' && (
        <main className={wrap}>
          <CustomersPanel orders={orders} onHistory={(p) => navigate(`/customers/${encodeURIComponent(p)}`)} onQuickOrder={(c) => { setQuickCustomer(c); setQuickOpen(true); }} />
        </main>
      )}
      {section === 'hisaab' && (
        <main className={`${wrap} space-y-4`}>
          <h1 className="text-xl font-semibold">{label('hisaab_title')}</h1>
          <KpiTiles orders={orders} kind="hisaab" />
          <div className="space-y-4 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-4 lg:items-start" data-testid="hisaab-grid">
          <div className="space-y-4 min-w-0">
          <ProfitSummary orders={orders} />
          <button onClick={() => navigate('/earnings')} className="w-full min-h-[56px] rounded-lg border border-border bg-card px-4 flex items-center gap-3 text-start hover:bg-muted" data-testid="btn-open-earnings">
            <BarChart2 size={20} aria-hidden className="text-primary" />
            <span className="flex-1 text-base font-medium">{label('open_earnings')}</span>
            <ChevronRight size={20} aria-hidden className="text-muted-foreground rtl:rotate-180" />
          </button>
          </div>
          <div className="min-w-0 scroll-mt-20" id="payments"><PaymentsPanel orders={orders} onViewReceipt={openReceipt} /></div>
          </div>
        </main>
      )}
      {section === 'more' && (
        <main className={wrap}>
          <MorePanel onLogout={() => setLogoutOpen(true)} pendingCount={pendingCount}
            renderSettings={(close) => <PageMode onBack={close} bare><SettingsModal open onOpenChange={(v) => { if (!v) close(); }} orders={allOrders} setAllOrders={setAllOrders} /></PageMode>} />
        </main>
      )}

      {section === 'settings' && page(<SettingsModal {...pageOpen} orders={allOrders} setAllOrders={setAllOrders} />, '/more', 'settings')}
      {section === 'earnings' && page(<EarningsModal {...pageOpen} orders={orders} />, '/hisaab', 'earnings')}
      {section === 'due' && page(<DueTodayModal {...pageOpen} orders={orders} onViewReceipt={openReceipt} />, '/')}
      {section === 'worksheet' && page(<WorkSheetModal {...pageOpen} orders={orders} />)}
      {section === 'team' && page(<TeamModal {...pageOpen} />)}
      {section === 'credit' && page(<CreditModal {...pageOpen} orders={orders} />, '/more', 'credit')}
      {section === 'impact' && page(<ImpactModal {...pageOpen} orders={orders} />, '/more', 'impact')}
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

      <div className="lg:hidden"><BottomNav tab={navTab} onNew={() => setChooserOpen(true)} badge={pendingCount} /></div>

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

