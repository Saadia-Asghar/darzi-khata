import type { Customer, Order } from '../types/order';
import { itemsTotal, validateItems } from './garments';
import { paymentHistory, PAYMENT_METHODS } from './payments';
const numeric = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0;
export function validateOrders(value: unknown): asserts value is Order[] {
  if (!Array.isArray(value) || value.length > 50000) throw new Error('Invalid orders backup / آرڈر بیک اپ درست نہیں');
  for (const o of value as Order[]) {
    if (!o || typeof o.id !== 'string' || !o.id || typeof o.customerName !== 'string' || typeof o.phone !== 'string'
      || !o.measurements || typeof o.measurements !== 'object' || Object.values(o.measurements).some(v=>!numeric(v))
      || !numeric(o.totalAmount) || !numeric(o.advanceAmount) || o.advanceAmount>o.totalAmount
      || !Number.isInteger(o.suitCount) || o.suitCount<1
      || !['pending','stitching','ready','delivered'].includes(o.status)
      || !Number.isFinite(Date.parse(o.orderDate)) || !Number.isFinite(Date.parse(o.deliveryDate))
      || (o.payments !== undefined && !Array.isArray(o.payments)))
      throw new Error('Invalid order fields / آرڈر کی تفصیل درست نہیں');
    const ledger = paymentHistory(o);
    if (ledger.some(p=>!p || typeof p.id !== 'string' || !numeric(p.amount) || !PAYMENT_METHODS.includes(p.method) || !Number.isFinite(Date.parse(p.date)))
      || Math.abs(ledger.reduce((sum,p)=>sum+p.amount,0)-o.advanceAmount)>0.01)
      throw new Error('Invalid payment ledger / ادائیگی کھاتہ درست نہیں');
    if (o.items !== undefined) {
      if (!Array.isArray(o.items)) throw new Error('Invalid garment list / کپڑوں کی فہرست غلط ہے');
      validateItems(o.items);
      if (Math.abs(itemsTotal(o.items)-o.totalAmount)>0.01 || o.suitCount!==o.items.reduce((s,i)=>s+i.quantity,0))
        throw new Error('Garment prices/quantities must match order / کپڑوں کی قیمت اور تعداد آرڈر کے مطابق ہو');
    }
    if (o.fabricPhotoId !== undefined && typeof o.fabricPhotoId !== 'string') throw new Error('Invalid photo reference / تصویر غلط ہے');
  }
  if (new Set(value.map(o=>o.id)).size !== value.length) throw new Error('Duplicate order IDs / آرڈر دوبارہ موجود ہے');
}
export function validateCustomers(value: unknown): asserts value is Customer[] {
  if (!Array.isArray(value)) throw new Error('Invalid customers backup / گاہک بیک اپ غلط ہے');
  for (const c of value as Customer[]) {
    if (!c || typeof c.id!=='string' || typeof c.name!=='string' || typeof c.phone!=='string' || typeof c.notes!=='string'
      || !Array.isArray(c.profiles) || !Number.isFinite(Date.parse(c.createdAt)) || !Number.isFinite(Date.parse(c.updatedAt)))
      throw new Error('Invalid customer / گاہک کی تفصیل غلط ہے');
    for (const p of c.profiles) {
      if (!p || typeof p.id!=='string' || typeof p.name!=='string') throw new Error('Invalid measurement profile / ناپ پروفائل غلط ہے');
      validateItems([{id:p.id,garmentType:p.garmentType,quantity:1,unitPrice:0,measurements:p.measurements}]);
    }
  }
  if (new Set(value.map(c=>c.id)).size!==value.length) throw new Error('Duplicate customer IDs / گاہک دوبارہ موجود ہے');
}
