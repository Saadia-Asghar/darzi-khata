import type { Order } from '../types/order';
import { balance, paymentDetailsText, type PaymentDetails } from './payments';
export type ReminderKind = 'ready' | 'payment' | 'tomorrow';
export function normalizePakistaniPhone(value: string): string {
  let number = value.replace(/\D/g, '').replace(/^00/, '');
  if (/^03\d{9}$/.test(number)) number = '92' + number.slice(1);
  else if (/^3\d{9}$/.test(number)) number = '92' + number;
  return number;
}
export function reminderText(order: Order, kind: ReminderKind, details: PaymentDetails): string {
  const heading = kind === 'ready' ? 'Your suit is ready / آپ کا سوٹ تیار ہے'
    : kind === 'tomorrow' ? 'Delivery tomorrow / آپ کے آرڈر کی ترسیل کل ہے'
    : `Payment reminder / ادائیگی کی یاد دہانی: Rs ${balance(order).toLocaleString()} باقی`;
  return `Assalam o Alaikum ${order.customerName}\n${heading}\n${order.serialNumber || ''} · ${details.shopName}\nBalance / بقایا: Rs ${balance(order).toLocaleString()}\n${paymentDetailsText(details)}`;
}
export function whatsappReminder(order: Order, kind: ReminderKind, details: PaymentDetails): string {
  return `https://wa.me/${normalizePakistaniPhone(order.phone)}?text=${encodeURIComponent(reminderText(order, kind, details))}`;
}
export function pendingReminders(orders: Order[], now = new Date()): Order[] {
  return orders.filter(o => (o.status === 'delivered' && balance(o) > 0)
    || (o.status === 'ready' && !!o.readyAt && now.getTime() - Date.parse(o.readyAt) >= 3 * 86400000));
}
