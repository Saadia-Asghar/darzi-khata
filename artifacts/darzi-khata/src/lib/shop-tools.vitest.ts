import { describe, it, expect } from 'vitest';
import { createFinancialDemo } from './demo-data';
import { profitSummary, recoveryCustomers, recoveredThisMonth, rushCapacity, savingsSuggestion, validateExpense } from './shop-tools';
import { computeCreditScore } from './credit-score';
import { signSnapshot, verifySnapshot, type TrackingSnapshot, type LenderSnapshot } from './public-token';
import { validateBackup } from './backup';
import { createPitchDemo } from './pitch-data';
import { appendPayment } from './payments';
const now = new Date('2026-11-06T09:00:00Z');
const orders = createFinancialDemo(now);
const expense = { id: 'expense', category: 'thread' as const, amount: 300, date: '2026-11-01', note: '' };
describe('shop tools use real scoped records', () => {
  it('pitch collection raises the actual shared credit model', () => {
    const base = createPitchDemo(now);
    const order = { ...orders[0], id: 'pitch-new', orderDate: now.toISOString(), totalAmount: 1500, advanceAmount: 0, payments: [] };
    const before = computeCreditScore([...base, order], now).score;
    const after = computeCreditScore([...base, appendPayment(order, 1500, 'zindigi', now.toISOString(), true)], now).score;
    expect(after).toBeGreaterThan(before);
  });
  it('profit equals received income minus costs', () => {
    const p = profitSummary(orders, [expense], now);
    expect(p.profit).toBe(p.income - 300); expect(p.spending).toBe(300);
  });
  it('validates expense amounts, categories and dates', () => {
    expect(validateExpense(expense)).toBe(true);
    for (const amount of [0, -1, NaN, Infinity]) expect(validateExpense({ ...expense, amount })).toBe(false);
    expect(validateExpense({ ...expense, date: '2099-01-01' })).toBe(false);
  });
  it('keeps customers with a shared contact separate and sorts amount first', () => {
    const groups = recoveryCustomers([{ ...orders[0], customerId: 'A', phone: '03000000000', totalAmount: 2000, advanceAmount: 0 },
      { ...orders[1], customerId: 'B', phone: '03000000000', totalAmount: 4000, advanceAmount: 0 }], now);
    expect(groups.map(x => x.id)).toEqual(['B', 'A']);
  });
  it('recovery excludes advances on the order date', () => {
    const order = { ...orders[0], orderDate: '2026-11-01T09:00:00Z', payments: [
      { id: 'a', amount: 100, method: 'cash' as const, date: '2026-11-01T10:00:00Z' },
      { id: 'b', amount: 250, method: 'raast' as const, date: '2026-11-04T09:00:00Z' },
    ] };
    expect(recoveredThisMonth([order], now)).toBe(250);
  });
  it('counts remaining suits against days and workers, not ready orders', () => {
    const plan = rushCapacity([{ ...orders[0], status: 'stitching', deliveryDate: '2026-11-10', suitCount: 42, items: undefined },
      { ...orders[1], status: 'ready', deliveryDate: '2026-11-10', suitCount: 100 }], '2026-11-10', 3, 2, now);
    expect(plan.suits).toBe(42); expect(plan.capacity).toBe(30); expect(plan.shortfall).toBe(12);
  });
  it('suggests saving a share but never creates a money transfer', () => {
    const goal = { name: 'Machine', target: 60000, percent: 5, contributions: [{ id: '1', amount: 500, date: '2026-11-01' }] };
    const result = savingsSuggestion(orders, goal);
    expect(result.saved).toBe(500); expect(result.remaining).toBe(59500); expect(goal.contributions).toHaveLength(1);
  });
  it('expense records affect score without silently changing old scoring', () => {
    expect(computeCreditScore(orders, now).factors).toHaveLength(6);
    const p = computeCreditScore(orders, now, [expense]);
    expect(p.factors).toHaveLength(7); expect(p.factors.reduce((s, f) => s + f.weight, 0)).toBe(100);
    expect(computeCreditScore(orders, now, [{ ...expense, amount: 1e9 }]).score).toBeLessThan(p.score);
  });
  it('validates and preserves financial settings in portable backups', () => {
    const result = validateBackup({ orders: [], settings: { expenses: [expense], savings: { name: 'Machine', target: 60000, percent: 5, contributions: [] }, hideShopPhone: true } });
    expect(result.settings?.expenses?.[0].amount).toBe(300);
    expect(() => validateBackup({ orders: [], settings: { expenses: [{ ...expense, amount: -1 }] } })).toThrow();
  });
});
describe('consented public snapshots', () => {
  const snapshot: TrackingSnapshot = { kind: 'track', lang: 'ur', shop: 'Test shop', reference: 'DK-001', status: 'stitching',
    deliveryDate: '2026-11-10', issuedAt: now.getTime(), expiresAt: now.getTime() + 7 * 86400000 };
  it('opens without a login or locally saved accounts', async () => {
    const token = await signSnapshot(snapshot);
    expect(await verifySnapshot(token, 'track', now.getTime())).toEqual(snapshot);
  });
  it('rejects expired, tampered and wrong-kind links', async () => {
    const token = await signSnapshot(snapshot);
    await expect(verifySnapshot(token, 'track', snapshot.expiresAt)).rejects.toThrow('expired');
    await expect(verifySnapshot(token, 'lender', now.getTime())).rejects.toThrow('invalid');
    const [data, pub, sig] = token.split('.');
    const changed = (data.startsWith('A') ? 'B' : 'A') + data.slice(1);
    await expect(verifySnapshot(`${changed}.${pub}.${sig}`, 'track', now.getTime())).rejects.toThrow();
  });
  it('rejects expiry longer than seven days', async () => {
    const token = await signSnapshot({ ...snapshot, expiresAt: snapshot.expiresAt + 1 });
    await expect(verifySnapshot(token, 'track', now.getTime())).rejects.toThrow('invalid');
  });
  it('lender profile contains summary, never customer contacts or measurements', async () => {
    const data: LenderSnapshot = { kind: 'lender', lang: 'en', shop: 'Test shop', demo: true, homeBased: false,
      profile: computeCreditScore(orders, now), expenses: 0, profit: 1000, issuedAt: snapshot.issuedAt, expiresAt: snapshot.expiresAt };
    const token = await signSnapshot(data);
    const verified = await verifySnapshot(token, 'lender', now.getTime());
    expect(JSON.stringify(verified)).not.toMatch(/phone|measurements|customerName|password|pinHash/);
  });
});
