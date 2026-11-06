import type { Customer, Order, OrderItem } from '../types/order';
import { normalizePakistaniPhone } from './reminders';
import { migrateOrder } from './payments';
export const SCHEMA_VERSION = 2;
export const customerKey = (phone: string, fallback: string) =>
  `customer-${normalizePakistaniPhone(phone) || phone.replace(/\D/g, '') || fallback}`;
export function migrateRegister(input: Order[], existing: Customer[] = []): { orders: Order[]; customers: Customer[] } {
  if (!Array.isArray(input) || !Array.isArray(existing)) throw new Error('Invalid khata backup / بیک اپ درست نہیں');
  const customers = new Map(existing.map(c => [c.id, { ...c, profiles: [...(c.profiles || [])] }]));
  const orders = input.map(raw => {
    const o = migrateOrder(raw);
    const matched = existing.find(c => customerKey(c.phone, c.id) === customerKey(o.phone, o.id));
    const id = matched?.id || o.customerId || customerKey(o.phone, o.id);
    const items: OrderItem[] = o.items?.length ? o.items : [{
      id: `legacy-item-${o.id}`, garmentType: 'gents', quantity: o.suitCount || 1,
      unitPrice: o.totalAmount / (o.suitCount || 1), measurements: { ...o.measurements }, notes: o.specialNotes,
    }];
    let customer = customers.get(id);
    if (!customer) {
      customer = { id, name: o.customerName, phone: o.phone, profiles: [], notes: '', createdAt: o.createdAt || o.orderDate, updatedAt: o.createdAt || o.orderDate };
      customers.set(id, customer);
    }
    if (Date.parse(o.orderDate) >= Date.parse(customer.updatedAt)) {
      customer.name = o.customerName; customer.phone = o.phone;
      customer.updatedAt = o.createdAt || o.orderDate;
    }
    for (const item of items) {
      if (!customer.profiles.some(p => p.garmentType === item.garmentType)) {
        customer.profiles.push({ id: `profile-${id}-${item.garmentType}`, name: 'Saved measurements / محفوظ ناپ', garmentType: item.garmentType, measurements: { ...item.measurements } });
      }
    }
    return { ...o, customerId: id, items };
  });
  return { orders, customers: [...customers.values()] };
}
export function highestSerial(orders: Pick<Order, 'serialNumber'>[]) {
  return Math.max(0, ...orders.map(o => /^DK-(\d+)$/.exec(o.serialNumber || '')?.[1]).map(v => Number(v) || 0));
}
