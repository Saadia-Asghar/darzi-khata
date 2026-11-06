import type { Order } from '../types/order';
import { balance, paymentHistory } from './payments';
import { dayDiff } from './i18n';

export const EXPENSE_CATEGORIES = ['thread', 'buttons', 'lining', 'wages', 'rent', 'other'] as const;
export type ExpenseCategory = typeof EXPENSE_CATEGORIES[number];
export interface Expense { id: string; category: ExpenseCategory; amount: number; date: string; note: string }
export interface SavingsGoal {
  name: string; target: number; percent: number;
  contributions: { id: string; amount: number; date: string }[];
}
export function validateExpense(expense: Expense) {
  if (!EXPENSE_CATEGORIES.includes(expense.category) || !Number.isFinite(expense.amount) || expense.amount <= 0
    || !/^\d{4}-\d{2}-\d{2}$/.test(expense.date) || !Number.isFinite(Date.parse(expense.date))
    || expense.date > localDate(new Date()) || typeof expense.note !== 'string' || expense.note.length > 500) return false;
  return true;
}
export function localDate(now: Date) {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}
const sameMonth = (date: string, now: Date) => {
  const d = new Date(date);
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
};
export function profitSummary(orders: Order[], expenses: Expense[], now = new Date()) {
  const income = orders.flatMap(paymentHistory).filter(p => sameMonth(p.date, now)).reduce((sum, p) => sum + p.amount, 0);
  const spending = expenses.filter(e => sameMonth(e.date, now)).reduce((sum, e) => sum + e.amount, 0);
  return { income, spending, profit: income - spending };
}
export function recoveryCustomers(orders: Order[], now = new Date()) {
  const groups = new Map<string, { id: string; name: string; phone: string; amount: number; age: number; orders: Order[] }>();
  for (const order of orders.filter(o => balance(o) > 0)) {
    // Never join modern customers on shared contact numbers.
    const id = order.customerId || order.id;
    const group = groups.get(id) || { id, name: order.customerName, phone: order.phone, amount: 0, age: 0, orders: [] };
    group.amount += balance(order);
    group.age = Math.max(group.age, Math.max(0, -dayDiff(order.orderDate, now)));
    group.orders.push(order);
    groups.set(id, group);
  }
  return [...groups.values()].sort((a, b) => b.amount - a.amount || b.age - a.age);
}
export function recoveredThisMonth(orders: Order[], now = new Date()) {
  // Recovery is money collected after the order's calendar date, not a new-order advance.
  return orders.reduce((sum, order) => sum + paymentHistory(order)
    .filter(p => sameMonth(p.date, now) && localDate(new Date(p.date)) > localDate(new Date(order.orderDate)))
    .reduce((s, p) => s + p.amount, 0), 0);
}
export function rushCapacity(orders: Order[], deadline: string, workers: number, dailyPerKarigar: number, now = new Date()) {
  const days = Math.max(0, dayDiff(deadline, now) + 1);
  const daily = Math.max(0, Math.floor(workers)) * Math.max(0, Math.floor(dailyPerKarigar));
  const active = orders.filter(o => !['ready', 'delivered'].includes(o.status) && o.deliveryDate.slice(0, 10) <= deadline);
  const suits = active.reduce((sum, o) => sum + (o.items?.reduce((s, i) => s + i.quantity, 0) ?? o.suitCount), 0);
  const capacity = daily * days;
  const bufferDays = daily ? Math.ceil(suits / daily) : days;
  const cutOff = new Date(`${deadline}T12:00:00`);
  cutOff.setDate(cutOff.getDate() - bufferDays);
  const byKarigar = [...new Set(active.map(o => o.karigar || ''))].map(name => ({
    name, suits: active.filter(o => (o.karigar || '') === name).reduce((s, o) => s + (o.items?.reduce((n, i) => n + i.quantity, 0) ?? o.suitCount), 0),
  }));
  return { days, suits, capacity, shortfall: Math.max(0, suits - capacity), cutOff: localDate(cutOff), byKarigar };
}
export function savingsSuggestion(orders: Order[], goal?: SavingsGoal) {
  if (!goal) return { suggested: 0, saved: 0, remaining: 0 };
  const digital = orders.flatMap(paymentHistory).filter(p => p.method !== 'cash').reduce((s, p) => s + p.amount, 0);
  const saved = goal.contributions.reduce((s, c) => s + c.amount, 0);
  return { suggested: Math.max(0, Math.min(goal.target - saved, digital * goal.percent / 100 - saved)), saved, remaining: Math.max(0, goal.target - saved) };
}
