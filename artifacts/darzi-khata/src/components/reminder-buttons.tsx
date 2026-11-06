import { entry, tl } from '../lib/i18n';
import { MessageCircle } from 'lucide-react';
import { Order } from '../types/order';
import { useSettings } from '../hooks/use-settings';
import { useToast } from '@/hooks/use-toast';
import { balance } from '../lib/payments';
import { whatsappReminder, normalizePakistaniPhone, type ReminderKind } from '../lib/reminders';

export function reminderKinds(order: Order, now = new Date()): ReminderKind[] {
  const kinds: ReminderKind[] = [];
  if (order.status === 'ready') kinds.push('ready');
  if (balance(order) > 0) kinds.push('payment');
  const t = new Date(now); t.setHours(0, 0, 0, 0); t.setDate(t.getDate() + 1);
  const d = new Date(order.deliveryDate); d.setHours(0, 0, 0, 0);
  if (order.status !== 'delivered' && d.getTime() === t.getTime()) kinds.push('tomorrow');
  return kinds;
}

const LABEL: Record<ReminderKind, { en: string; ur: string }> = {
  ready: { ...entry('d_ready') },
  payment: { ...entry('d_payment') },
  tomorrow: { ...entry('d_tomorrow') },
};

export function ReminderButtons({ order, compact = false }: { order: Order; compact?: boolean }) {
  const { settings } = useSettings();
  const { toast } = useToast();
  const kinds = reminderKinds(order);
  if (kinds.length === 0) return null;
  const validPhone = /^92\d{10}$/.test(normalizePakistaniPhone(order.phone));

  const open = (kind: ReminderKind) => {
    if (!validPhone) {
      toast({ title: tl('m_invalid_number'), description: tl('m_phone_number_must_be_a_pakistani_mobile_'), variant: 'destructive' });
      return;
    }
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      toast({ title: tl('m_offline'), description: tl('m_whatsapp_needs_internet_nothing_was_sent') });
      return;
    }
    window.open(whatsappReminder(order, kind, settings), '_blank', 'noopener,noreferrer');
    toast({ title: tl('m_whatsapp_opened'), description: tl('m_press_send_in_whatsapp_to_deliver') });
  };

  return (
    <div className="flex flex-wrap gap-2" aria-label={tl('m_whatsapp_reminders')}>
      {kinds.map((k) => (
        <button key={k} type="button" onClick={() => open(k)}
          className={`min-h-[44px] inline-flex items-center gap-1.5 rounded-lg border border-border  bg-primary-soft/70  text-primary  hover:bg-primary-soft  active:scale-[0.97] transition px-3 text-sm font-bold ${compact ? 'flex-1 justify-center' : ''}`}
          data-testid={`btn-remind-${k}-${order.id}`}>
          <MessageCircle size={14} />
          <span>{LABEL[k].en}</span><span className="font-urdu font-normal" lang="ur" dir="rtl">{LABEL[k].ur}</span>
        </button>
      ))}
    </div>
  );
}
