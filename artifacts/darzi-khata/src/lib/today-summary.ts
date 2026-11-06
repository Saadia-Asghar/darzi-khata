import type { Order } from '../types/order';
import { balance } from './payments';

function localDay(value: Date | string) {
  const d = new Date(value);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/** Count each active order once; ready future orders are collectible too. */
export function todaySummary(orders: Order[], now = new Date()) {
  const today = localDay(now);
  let deliveries = 0, collect = 0, overdue = 0;
  for (const order of orders) {
    if (order.status === 'delivered') continue;
    const due = localDay(order.deliveryDate);
    if (due === today) deliveries++;
    if (due < today) overdue++;
    if (due <= today || order.status === 'ready') collect += balance(order);
  }
  return { deliveries, collect, overdue };
}
