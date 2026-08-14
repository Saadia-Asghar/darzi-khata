import * as Dialog from '@radix-ui/react-dialog';
import { X, Printer, ClipboardList, AlertTriangle } from 'lucide-react';
import { Order } from '../types/order';
import { useSettings } from '../hooks/use-settings';

interface WorkSheetModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orders: Order[];
}

export function WorkSheetModal({ open, onOpenChange, orders }: WorkSheetModalProps) {
  const { settings } = useSettings();

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

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-PK', { day: '2-digit', month: 'short' });

  const getDiffDays = (iso: string) => {
    const d = new Date(iso);
    d.setHours(0, 0, 0, 0);
    return Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const statusLabel: Record<string, string> = {
    pending: 'Pending',
    stitching: 'Silai',
    ready: 'Tayyar',
    delivered: 'Diya',
  };

  const OrderRow = ({ order, rowBg }: { order: Order; rowBg: string }) => {
    const diff = getDiffDays(order.deliveryDate);
    return (
      <tr className={rowBg}>
        <td className="px-2 py-2 font-mono text-xs text-gray-500 whitespace-nowrap">{order.serialNumber || '—'}</td>
        <td className="px-2 py-2">
          <div className="font-bold text-sm text-gray-900">{order.customerName}</div>
          <div className="text-xs text-gray-500 font-mono">{order.phone}</div>
        </td>
        <td className="px-2 py-2 text-center text-sm font-bold">{order.suitCount}</td>
        <td className="px-2 py-2 text-xs text-gray-700">{order.fabric}</td>
        <td className="px-2 py-2 text-xs text-center">
          <div className="font-semibold text-gray-800">{formatDate(order.deliveryDate)}</div>
          <div className={`text-[10px] font-bold ${diff < 0 ? 'text-red-600' : diff === 0 ? 'text-orange-600' : 'text-gray-500'}`}>
            {diff < 0 ? `${Math.abs(diff)}d late` : diff === 0 ? 'Aaj' : `${diff}d`}
          </div>
        </td>
        <td className="px-2 py-2 text-xs text-center text-gray-600">{order.karigar || '—'}</td>
        <td className="px-2 py-2 text-center">
          <span className="text-xs font-semibold border px-1.5 py-0.5 rounded-full bg-white text-gray-700">
            {statusLabel[order.status] || order.status}
          </span>
        </td>
        <td className="px-2 py-2 text-right">
          {order.totalAmount - order.advanceAmount > 0 ? (
            <span className="text-red-600 font-bold text-xs">Rs.{(order.totalAmount - order.advanceAmount).toLocaleString()}</span>
          ) : (
            <span className="text-emerald-600 text-xs font-semibold">Ada✓</span>
          )}
        </td>
        <td className="px-2 py-2 text-xs text-gray-500 text-center">{order.specialNotes || '—'}</td>
      </tr>
    );
  };

  const SectionHeader = ({ label, count, color }: { label: string; count: number; color: string }) => (
    <tr>
      <td colSpan={9} className={`px-2 py-1 font-bold text-xs uppercase tracking-widest ${color}`}>
        {label} ({count} order{count !== 1 ? 's' : ''})
      </td>
    </tr>
  );

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm print:hidden" />
        <Dialog.Content className="fixed inset-2 sm:inset-8 z-50 rounded-2xl bg-white shadow-2xl outline-none overflow-hidden flex flex-col max-h-[95vh] print:static print:inset-0 print:rounded-none print:max-h-none">

          {/* Header */}
          <div className="px-5 py-4 border-b flex justify-between items-center bg-emerald-800 text-white shrink-0 print:bg-white print:text-gray-900 print:border-b-2 print:border-gray-800">
            <div>
              <Dialog.Title className="text-base font-bold flex items-center gap-2">
                <ClipboardList size={18} /> Production Work Sheet
              </Dialog.Title>
              <Dialog.Description className="text-emerald-200 text-xs font-urdu print:text-gray-600">
                {settings.shopName} — {new Date().toLocaleDateString('en-PK', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </Dialog.Description>
            </div>
            <div className="flex items-center gap-2 print:hidden">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-bold transition-colors"
              >
                <Printer size={16} /> Print
              </button>
              <Dialog.Close asChild>
                <button className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-emerald-700 text-white" aria-label="Close">
                  <X size={18} />
                </button>
              </Dialog.Close>
            </div>
          </div>

          {/* Scrollable table */}
          <div className="flex-1 overflow-auto p-4 print:overflow-visible print:p-6">
            {activeOrders.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <ClipboardList size={48} className="mx-auto mb-3" />
                <p className="font-semibold">Koi active order nahi hai</p>
              </div>
            ) : (
              <table className="w-full border-collapse text-xs min-w-[700px]">
                <thead>
                  <tr className="bg-gray-100 border-b-2 border-gray-300">
                    <th className="px-2 py-2 text-left font-bold text-gray-600 whitespace-nowrap">Serial</th>
                    <th className="px-2 py-2 text-left font-bold text-gray-600">Gahak</th>
                    <th className="px-2 py-2 text-center font-bold text-gray-600">Joray</th>
                    <th className="px-2 py-2 text-left font-bold text-gray-600">Kapra</th>
                    <th className="px-2 py-2 text-center font-bold text-gray-600">Delivery</th>
                    <th className="px-2 py-2 text-center font-bold text-gray-600">Karigar</th>
                    <th className="px-2 py-2 text-center font-bold text-gray-600">Halat</th>
                    <th className="px-2 py-2 text-right font-bold text-gray-600">Baqi</th>
                    <th className="px-2 py-2 text-center font-bold text-gray-600">Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {overdueOrders.length > 0 && (
                    <>
                      <SectionHeader label="🚨 Overdue / Deri Ho Gayi" count={overdueOrders.length} color="bg-red-50 text-red-700" />
                      {overdueOrders.map((o) => <OrderRow key={o.id} order={o} rowBg="bg-red-50/50 hover:bg-red-50" />)}
                    </>
                  )}
                  {urgentOrders.length > 0 && (
                    <>
                      <SectionHeader label="⚡ Urgent Orders" count={urgentOrders.length} color="bg-orange-50 text-orange-700" />
                      {urgentOrders.map((o) => <OrderRow key={o.id} order={o} rowBg="bg-orange-50/40 hover:bg-orange-50" />)}
                    </>
                  )}
                  {normalOrders.length > 0 && (
                    <>
                      <SectionHeader label="📋 Regular Orders" count={normalOrders.length} color="bg-emerald-50 text-emerald-700" />
                      {normalOrders.map((o) => <OrderRow key={o.id} order={o} rowBg="bg-white hover:bg-gray-50" />)}
                    </>
                  )}
                </tbody>
              </table>
            )}
          </div>

          {/* Footer summary */}
          <div className="px-5 py-3 bg-gray-50 border-t text-xs text-gray-600 flex flex-wrap gap-4 shrink-0 print:bg-white print:border-t-2">
            <span className="font-semibold">Total Active: <strong>{activeOrders.length}</strong></span>
            <span className="text-red-600 font-semibold">Overdue: <strong>{overdueOrders.length}</strong></span>
            <span className="text-orange-600 font-semibold">Urgent: <strong>{urgentOrders.length}</strong></span>
            <span>Total Baqi: <strong>Rs. {activeOrders.reduce((s, o) => s + (o.totalAmount - o.advanceAmount), 0).toLocaleString()}</strong></span>
          </div>

        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
