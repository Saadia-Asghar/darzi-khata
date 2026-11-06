import { useMemo } from 'react';
import { BellRing } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Order } from '../types/order';
import { pendingReminders } from '../lib/reminders';
import { balance } from '../lib/payments';
import { ReminderButtons } from './reminder-buttons';

interface Props { open: boolean; onOpenChange: (o: boolean) => void; orders: Order[] }

export function PendingRemindersModal({ open, onOpenChange, orders }: Props) {
  const list = useMemo(() => pendingReminders(orders), [orders]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-[calc(100%-1rem)] p-0 overflow-hidden rounded-2xl gap-0 max-h-[90dvh] flex flex-col">
        <div className="bg-emerald-800 text-white px-5 py-4 shrink-0">
          <DialogTitle className="text-lg font-bold flex items-center gap-2"><BellRing size={18} /> Pending reminders</DialogTitle>
          <DialogDescription className="text-emerald-200 text-xs"><span className="font-urdu">زیرِ التوا یاد دہانیاں</span> · ready 3+ days or delivered unpaid</DialogDescription>
        </div>
        <div className="overflow-y-auto p-4 space-y-3 bg-background">
          {list.length === 0 ? (
            <div className="text-center py-12 px-4 rounded-2xl border border-dashed border-border">
              <BellRing className="mx-auto text-emerald-600 mb-3" size={32} />
              <p className="font-bold">All caught up</p>
              <p className="font-urdu text-muted-foreground mt-1">سب ٹھیک ہے، کوئی یاد دہانی باقی نہیں</p>
            </div>
          ) : list.map((o) => {
            const days = o.readyAt ? Math.floor((Date.now() - Date.parse(o.readyAt)) / 86400000) : 0;
            return (
              <div key={o.id} className="rounded-xl border border-border bg-card p-3 space-y-2 dk-rise" data-testid={`pending-${o.id}`}>
                <div className="flex justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-bold truncate">{o.customerName} <span className="text-[10px] font-mono text-muted-foreground">{o.serialNumber}</span></div>
                    <div className="text-xs text-muted-foreground">{o.status === 'delivered' ? 'Delivered, unpaid / ڈیلیور، بقایا' : `Ready ${days} days / ${days} دن سے تیار`}</div>
                  </div>
                  <div className="text-right shrink-0"><div className="text-[10px] text-muted-foreground">Balance / بقایا</div><div className="font-bold text-red-600 font-mono">Rs {balance(o).toLocaleString()}</div></div>
                </div>
                <ReminderButtons order={o} compact />
              </div>
            );
          })}
          <p className="text-[11px] text-muted-foreground text-center pt-2">Opens WhatsApp with a prepared message. Needs WhatsApp and internet; you press send. / پیغام آپ خود بھیجیں</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
