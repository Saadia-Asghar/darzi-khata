import { fabricName } from '../lib/i18n';
import { StatusBadge } from './status-meta';
import { usePreferences } from '../hooks/use-preferences';
import { shortDate } from '../lib/i18n';
import * as Dialog from './page-dialog';
import { X, Printer, Download, ClipboardList, AlertTriangle } from 'lucide-react';
import { Order } from '../types/order';
import { useSettings } from '../hooks/use-settings';
import { printElement } from '../lib/print';

interface WorkSheetModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orders: Order[];
}

export function WorkSheetModal({ open, onOpenChange, orders }: WorkSheetModalProps) {
  const { settings } = useSettings();
  const { label, lang } = usePreferences();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const activeOrders = orders.filter((o) => o.status !== 'delivered');

  const overdueOrders = activeOrders.filter((o) => {
    const d = new Date(o.deliveryDate);
    d.setHours(0, 0, 0, 0);
    return d < today;
  });

  const urgentOrders = activeOrders.filter((o) => {
    const d = new Date(o.deliveryDate);
    d.setHours(0, 0, 0, 0);
    return o.urgent && d >= today;
  });

  const normalOrders = activeOrders.filter((o) => {
    const d = new Date(o.deliveryDate);
    d.setHours(0, 0, 0, 0);
    return !o.urgent && d >= today;
  });

  const formatDate = (iso: string) => shortDate(iso, lang);

  const getDiffDays = (iso: string) => {
    const d = new Date(iso);
    d.setHours(0, 0, 0, 0);
    return Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const OrderRow = ({ order, rowBg }: { order: Order; rowBg: string }) => {
    const diff = getDiffDays(order.deliveryDate);
    return (
      <tr className={rowBg}>
        <td className="px-2 py-2 font-mono text-sm text-muted-foreground whitespace-nowrap">{order.serialNumber || '—'}</td>
        <td className="px-2 py-2">
          <div className="font-bold text-sm text-foreground">{order.customerName}</div>
          <div className="text-sm text-muted-foreground font-mono">{order.phone}</div>
        </td>
        <td className="px-2 py-2 text-center text-sm font-bold">{order.suitCount}</td>
        <td className="px-2 py-2 text-sm text-foreground">{fabricName(order.fabric)}</td>
        <td className="px-2 py-2 text-sm text-center">
          <div className="font-semibold text-foreground">{formatDate(order.deliveryDate)}</div>
          <div className={`text-xs font-bold ${diff < 0 ? 'text-danger' : diff === 0 ? 'text-warning' : 'text-muted-foreground'}`}>
            {diff < 0 ? label('t_nd_late', { diff: Math.abs(diff) }) : diff === 0 ? label('today') : label('t_nd', { diff })}
          </div>
        </td>
        <td className="px-2 py-2 text-sm text-center text-muted-foreground">{order.karigar || '—'}</td>
        <td className="px-2 py-2 text-center">
          <StatusBadge order={order} />
        </td>
        <td className="px-2 py-2 text-right">
          {order.totalAmount - order.advanceAmount > 0 ? (
            <span className="text-danger font-bold text-sm">Rs {(order.totalAmount - order.advanceAmount).toLocaleString()}</span>
          ) : (
            <span className="text-primary text-sm font-semibold">{label('paid')}</span>
          )}
        </td>
        <td className="px-2 py-2 text-sm text-muted-foreground text-center">{order.specialNotes || '—'}</td>
      </tr>
    );
  };

  const SectionHeader = ({ label: title, count, color }: { label: string; count: number; color: string }) => (
    <tr>
      <td colSpan={9} className={`px-2 py-1 font-bold text-sm   ${color}`}>
        {title} ({(count === 1 ? label('t_one_order') : label('t_n_orders_count', { count }))})
      </td>
    </tr>
  );

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-foreground/60 z-50  print:hidden" />
        <Dialog.Content className="fixed inset-2 sm:inset-8 z-50 rounded-lg bg-card  outline-none overflow-hidden flex flex-col max-h-[95vh] print:static print:inset-0 print:rounded-none print:max-h-none">

          {/* Header */}
          <div className="px-5 py-4 border-b flex justify-between items-center bg-card text-foreground border-border shrink-0 print:bg-card print:text-foreground print:border-b-2 print:border-border">
            <div>
              <Dialog.Title className="text-base font-bold flex items-center gap-2">
                <ClipboardList size={18} aria-hidden /> {label('production_work_sheet')}
              </Dialog.Title>
              <Dialog.Description className="text-muted-foreground text-sm">
                {settings.shopName} · {new Date().toLocaleDateString('en-PK', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </Dialog.Description>
            </div>
            <div className="flex items-center gap-2 print:hidden">
              <button
                onClick={() => void printElement(document.getElementById('worksheet-print-area'), { paper: 'a4' })}
                className="flex items-center gap-2 px-4 min-h-[44px] bg-card/10 hover:bg-card/20 rounded-lg text-sm font-bold transition-colors"
              >
                <Printer size={16} aria-hidden /> {label('print')}
              </button>
              <button onClick={() => void printElement(document.getElementById('worksheet-print-area'), { download: true })} className="flex items-center gap-2 px-3 min-h-[44px] rounded-lg text-sm font-bold" data-testid="btn-download-worksheet">
                <Download size={16} aria-hidden /> {label('feature_download_pdf')}
              </button>
              <Dialog.Close asChild>
                <button className="h-11 w-11 flex items-center justify-center rounded-full hover:bg-primary text-primary-foreground" aria-label={label('close')}>
                  <X size={18} />
                </button>
              </Dialog.Close>
            </div>
          </div>

          {/* Scrollable table */}
          <div id="worksheet-print-area" className="flex-1 overflow-auto p-4 print:overflow-visible print:p-6">
            <h2 className="hidden print:block font-bold text-lg">{settings.shopName} · {label('production_work_sheet')}</h2>
            {activeOrders.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <ClipboardList size={48} className="mx-auto mb-3" />
                <p className="font-semibold">{label('no_active_orders')}</p>
              </div>
            ) : (
              <>
              <ul className="space-y-4 sm:hidden print:hidden">
                {[...overdueOrders, ...urgentOrders, ...normalOrders].map((o) => (
                  <li key={o.id} className="border-b border-border pb-4 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <strong className="text-lg">{o.customerName}</strong>
                      <span className="num text-sm text-muted-foreground">{o.serialNumber}</span>
                    </div>
                    <p className="text-base">{o.suitCount} {label('pcs_2')} · {fabricName(o.fabric)}</p>
                    <p className="text-sm">{label('delivery')}: {formatDate(o.deliveryDate)}</p>
                    <p className="text-sm">{label('karigar')}: {o.karigar || label('not_assigned')}</p>
                    <StatusBadge order={o} />
                  </li>
                ))}
              </ul>
              <table className="hidden sm:table print:table w-full border-collapse text-sm min-w-[700px]">
                <thead>
                  <tr className="bg-muted border-b-2 border-border">
                    <th className="px-2 py-2 text-left font-bold text-muted-foreground whitespace-nowrap">{label('serial')}</th>
                    <th className="px-2 py-2 text-left font-bold text-muted-foreground">{label('customer')}</th>
                    <th className="px-2 py-2 text-center font-bold text-muted-foreground">{label('pcs_2')}</th>
                    <th className="px-2 py-2 text-left font-bold text-muted-foreground">{label('fabric')}</th>
                    <th className="px-2 py-2 text-center font-bold text-muted-foreground">{label('delivery')}</th>
                    <th className="px-2 py-2 text-center font-bold text-muted-foreground">{label('karigar')}</th>
                    <th className="px-2 py-2 text-center font-bold text-muted-foreground">{label('status')}</th>
                    <th className="px-2 py-2 text-right font-bold text-muted-foreground">{label('balance_2')}</th>
                    <th className="px-2 py-2 text-center font-bold text-muted-foreground">{label('note')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {overdueOrders.length > 0 && (
                    <>
                      <SectionHeader label={label('overdue')} count={overdueOrders.length} color="bg-danger-soft text-danger" />
                      {overdueOrders.map((o) => <OrderRow key={o.id} order={o} rowBg="bg-danger-soft/50 hover:bg-danger-soft" />)}
                    </>
                  )}
                  {urgentOrders.length > 0 && (
                    <>
                      <SectionHeader label={label('urgent_orders')} count={urgentOrders.length} color="bg-warning-soft text-warning" />
                      {urgentOrders.map((o) => <OrderRow key={o.id} order={o} rowBg="bg-warning-soft/40 hover:bg-warning-soft" />)}
                    </>
                  )}
                  {normalOrders.length > 0 && (
                    <>
                      <SectionHeader label={label('regular_orders')} count={normalOrders.length} color="bg-primary-soft text-primary" />
                      {normalOrders.map((o) => <OrderRow key={o.id} order={o} rowBg="bg-card hover:bg-muted" />)}
                    </>
                  )}
                </tbody>
              </table>
              </>
            )}
          </div>

          {/* Footer summary */}
          <div className="px-5 py-3 bg-muted border-t text-sm text-muted-foreground flex flex-wrap gap-4 shrink-0 print:bg-card print:border-t-2">
            <span className="font-semibold">{label('total_active')}: <strong>{activeOrders.length}</strong></span>
            <span className="text-danger font-semibold">{label('overdue')}: <strong>{overdueOrders.length}</strong></span>
            <span className="text-warning font-semibold">{label('urgent')}: <strong>{urgentOrders.length}</strong></span>
            <span>{label('total_balance')}: <strong>Rs {activeOrders.reduce((s, o) => s + (o.totalAmount - o.advanceAmount), 0).toLocaleString()}</strong></span>
          </div>

        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
