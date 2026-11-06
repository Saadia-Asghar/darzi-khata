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
  ready: { en: 'Ready', ur: 'تیار' },
  payment: { en: 'Payment', ur: 'ادائیگی' },
  tomorrow: { en: 'Tomorrow', ur: 'کل' },
};

export function ReminderButtons({ order, compact = false }: { order: Order; compact?: boolean }) {
  const { settings } = useSettings();
  const { toast } = useToast();
  const kinds = reminderKinds(order);
  if (kinds.length === 0) return null;
  const validPhone = /^92\d{10}$/.test(normalizePakistaniPhone(order.phone));

  const open = (kind: ReminderKind) => {
    if (!validPhone) {
      toast({ title: 'Invalid number / غلط نمبر', description: 'Phone number must be a Pakistani mobile (03xx). / نمبر درست کریں', variant: 'destructive' });
      return;
    }
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      toast({ title: 'Offline / انٹرنیٹ نہیں', description: 'WhatsApp needs internet. Nothing was sent. / واٹس ایپ کے لیے انٹرنیٹ ضروری ہے، پیغام نہیں گیا' });
      return;
    }
    window.open(whatsappReminder(order, kind, settings), '_blank', 'noopener,noreferrer');
    toast({ title: 'WhatsApp opened / واٹس ایپ کھل گیا', description: 'Press send in WhatsApp to deliver. / پیغام بھیجنے کے لیے واٹس ایپ میں سینڈ دبائیں' });
  };

  return (
    <div className="flex flex-wrap gap-2" aria-label="WhatsApp reminders / یاد دہانی">
      {kinds.map((k) => (
        <button key={k} type="button" onClick={() => open(k)}
          className={`min-h-[44px] inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 active:scale-[0.97] transition px-3 text-xs font-bold ${compact ? 'flex-1 justify-center' : ''}`}
          data-testid={`btn-remind-${k}-${order.id}`}>
          <MessageCircle size={14} />
          <span>{LABEL[k].en}</span><span className="font-urdu font-normal leading-none">{LABEL[k].ur}</span>
        </button>
      ))}
    </div>
  );
}
