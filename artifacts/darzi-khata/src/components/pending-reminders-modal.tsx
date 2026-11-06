import { tl } from '../lib/i18n';
import { useMemo } from 'react';
import { BellRing } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from './page-dialog';
import { Order } from '../types/order';
import { pendingReminders } from '../lib/reminders';
import { balance } from '../lib/payments';
import { ReminderButtons } from './reminder-buttons';

interface Props { open: boolean; onOpenChange: (o: boolean) => void; orders: Order[] }

export function PendingRemindersModal({ open, onOpenChange, orders }: Props) {
  const list = useMemo(() => pendingReminders(orders), [orders]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-[calc(100%-1rem)] p-0 overflow-hidden rounded-lg gap-0 max-h-[90dvh] flex flex-col">
        <div className="bg-card text-foreground border-border px-5 py-4 shrink-0">
          <DialogTitle className="text-lg font-bold flex items-center gap-2"><BellRing size={18} aria-hidden /> {tl('rem_title')}</DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">{tl('rem_desc')}</DialogDescription>
        </div>
        <div className="overflow-y-auto p-4 space-y-3 bg-background">
          {list.length === 0 ? (
            <div className="text-center py-12 px-4 rounded-lg border border-dashed border-border">
              <BellRing className="mx-auto text-primary mb-3" size={32} />
              <p className="font-bold">{tl('rem_all_clear')}</p>
            </div>
          ) : list.map((o) => {
            const days = o.readyAt ? Math.floor((Date.now() - Date.parse(o.readyAt)) / 86400000) : 0;
            return (
              <div key={o.id} className="rounded-lg border border-border bg-card p-3 space-y-2 dk-rise" data-testid={`pending-${o.id}`}>
                <div className="flex justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-bold truncate">{o.customerName} <span className="text-xs font-mono text-muted-foreground">{o.serialNumber}</span></div>
                    <div className="text-sm text-muted-foreground">{o.status === 'delivered' ? tl('m_delivered_unpaid') : tl('m_ready_days_days', { days })}</div>
                  </div>
                  <div className="text-right shrink-0"><div className="text-xs text-muted-foreground">{tl('j_balance')}</div><div className="font-bold text-danger font-mono">Rs {balance(o).toLocaleString()}</div></div>
                </div>
                <ReminderButtons order={o} compact />
              </div>
            );
          })}
          <p className="text-xs text-muted-foreground text-center pt-2">{tl('j_opens_whatsapp_with_a_prepared_message_n')}</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
