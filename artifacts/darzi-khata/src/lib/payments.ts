import { bi, DICT, fill, getCurrentLang, type Lang } from './i18n';
import type { Order, Payment, PaymentMethod } from '../types/order';

export interface PaymentDetails {
  shopName: string;
  zindigiWallet?: string;
  raastId?: string;
  accountTitle?: string;
}

export const PAYMENT_METHODS: PaymentMethod[] = ['cash', 'zindigi', 'raast', 'bank'];
export const balance = (order: Order) => Math.max(0, order.totalAmount - order.advanceAmount);
export function paymentHistory(order: Order): Payment[] {
  if (Array.isArray(order.payments)) return order.payments;
  return order.advanceAmount > 0 ? [{
    id: `legacy-${order.id}`, amount: order.advanceAmount, method: 'cash',
    date: order.orderDate || order.createdAt,
  }] : [];
}
export function migrateOrder(order: Order): Order {
  // Existing delivered orders have no observed completion timestamp. Never invent one.
  return { ...order, payments: paymentHistory(order) };
}
export function appendPayment(order: Order, amount: number, method: PaymentMethod, date: string, demo = false): Order {
  if (!Number.isFinite(amount) || amount <= 0 || amount > balance(order))
    throw new Error(bi('m_amount_must_be_positive_and_no_greater_t'));
  const endOfToday = new Date(); endOfToday.setHours(23, 59, 59, 999);
  if (!PAYMENT_METHODS.includes(method) || !Number.isFinite(Date.parse(date)) || Date.parse(date) > endOfToday.getTime())
    throw new Error(bi('m_invalid_payment_method_or_date'));
  const payment: Payment = { id: crypto.randomUUID(), amount, method, date, ...(demo ? { demo: true } : {}) };
  return { ...order, payments: [...paymentHistory(order), payment], advanceAmount: order.advanceAmount + amount };
}
export function buildPaymentPayload(order: Order, details: PaymentDetails): string {
  // PLACEHOLDER ONLY: not EMVCo / Raast merchant QR and not accepted by banking apps.
  // Replace this one builder with an authorized Zindigi/Raast merchant API payload.
  return JSON.stringify({
    type: 'DARZI_KHATA_DEMO_NOT_A_BANK_QR', currency: 'PKR',
    shop: details.shopName, title: details.accountTitle || '',
    account: details.raastId || details.zindigiWallet || '', amount: balance(order),
    reference: order.serialNumber || order.id,
  });
}
export function paymentDetailsText(details: PaymentDetails, lang: Lang = getCurrentLang()): string {
  return [
    details.accountTitle && fill(DICT.m_account_title[lang], { accountTitle: details.accountTitle }, lang),
    details.zindigiWallet && fill(DICT.m_zindigi[lang], { zindigiWallet: details.zindigiWallet }, lang),
    details.raastId && fill(DICT.m_raast[lang], { raastId: details.raastId }, lang),
  ].filter(Boolean).join('\n');
}
export function paymentShare(orders: Order[], month?: Date) {
  let cash = 0, digital = 0;
  for (const order of orders) for (const payment of paymentHistory(order)) {
    const date = new Date(payment.date);
    if (month && (date.getFullYear() !== month.getFullYear() || date.getMonth() !== month.getMonth())) continue;
    if (payment.method === 'cash') cash += payment.amount;
    else digital += payment.amount;
  }
  return { cash, digital, total: cash + digital, digitalPercent: cash + digital ? digital / (cash + digital) * 100 : 0 };
}
