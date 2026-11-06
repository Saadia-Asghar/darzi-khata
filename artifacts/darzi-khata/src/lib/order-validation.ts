import { bi } from './i18n';
import type { Customer, Order } from '../types/order';
import { itemsTotal, validateItems } from './garments';
import { paymentHistory, PAYMENT_METHODS } from './payments';
const numeric = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0;
export function validateOrders(value: unknown): asserts value is Order[] {
  if (!Array.isArray(value) || value.length > 50000) throw new Error(bi('m_invalid_orders_backup'));
  for (const o of value as Order[]) {
    if (!o || typeof o.id !== 'string' || !o.id || typeof o.customerName !== 'string' || typeof o.phone !== 'string'
      || !o.measurements || typeof o.measurements !== 'object' || Object.values(o.measurements).some(v=>!numeric(v))
      || !numeric(o.totalAmount) || !numeric(o.advanceAmount) || o.advanceAmount>o.totalAmount
      || !Number.isInteger(o.suitCount) || o.suitCount<1
      || !['pending','stitching','ready','delivered'].includes(o.status)
      || !Number.isFinite(Date.parse(o.orderDate)) || !Number.isFinite(Date.parse(o.deliveryDate))
      || (o.payments !== undefined && !Array.isArray(o.payments)))
      throw new Error(bi('m_invalid_order_fields'));
    const ledger = paymentHistory(o);
    if (ledger.some(p=>!p || typeof p.id !== 'string' || !numeric(p.amount) || !PAYMENT_METHODS.includes(p.method) || !Number.isFinite(Date.parse(p.date)))
      || Math.abs(ledger.reduce((sum,p)=>sum+p.amount,0)-o.advanceAmount)>0.01)
      throw new Error(bi('m_invalid_payment_ledger'));
    if (o.items !== undefined) {
      if (!Array.isArray(o.items)) throw new Error(bi('m_invalid_garment_list'));
      validateItems(o.items);
      if (Math.abs(itemsTotal(o.items)-o.totalAmount)>0.01 || o.suitCount!==o.items.reduce((s,i)=>s+i.quantity,0))
        throw new Error(bi('m_garment_prices_quantities_must_match_ord'));
    }
    if (o.fabricPhotoId !== undefined && typeof o.fabricPhotoId !== 'string') throw new Error(bi('m_invalid_photo_reference'));
  }
  if (new Set(value.map(o=>o.id)).size !== value.length) throw new Error(bi('m_duplicate_order_ids'));
}
export function validateCustomers(value: unknown): asserts value is Customer[] {
  if (!Array.isArray(value)) throw new Error(bi('m_invalid_customers_backup'));
  for (const c of value as Customer[]) {
    if (!c || typeof c.id!=='string' || typeof c.name!=='string' || typeof c.phone!=='string' || typeof c.notes!=='string'
      || !Array.isArray(c.profiles) || !Number.isFinite(Date.parse(c.createdAt)) || !Number.isFinite(Date.parse(c.updatedAt)))
      throw new Error(bi('m_invalid_customer'));
    for (const p of c.profiles) {
      if (!p || typeof p.id!=='string' || typeof p.name!=='string') throw new Error(bi('m_invalid_measurement_profile'));
      validateItems([{id:p.id,garmentType:p.garmentType,quantity:1,unitPrice:0,measurements:p.measurements}]);
    }
  }
  if (new Set(value.map(c=>c.id)).size!==value.length) throw new Error(bi('m_duplicate_customer_ids'));
}
