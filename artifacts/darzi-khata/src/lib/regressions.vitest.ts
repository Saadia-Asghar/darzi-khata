import { afterEach, describe, expect, it } from 'vitest';
import { migrateRegister } from './migrations';
import { LEGACY_MEASUREMENTS, newItem } from './garments';
import { bi, setCurrentLang } from './i18n';
import type { Customer, Order } from '../types/order';

const customer = (id: string): Customer => ({
  id, name: id, phone: '03001234567', notes: '', createdAt: '2026-01-01',
  updatedAt: '2026-01-01', profiles: [],
});
const order = (id: string): Order => ({
  id, customerId: id, customerName: id, phone: '03001234567', orderDate: '2026-01-02',
  deliveryDate: '2026-12-01', createdAt: '2026-01-02', urgent: false, suitCount: 1,
  fabric: 'Cotton', measurements: { ...LEGACY_MEASUREMENTS }, items: [newItem()],
  collarType: 'Normal Collar', damanType: 'Choras (Square)', cuffType: 'Simple',
  pockets: 'Front Pocket', specialNotes: '', totalAmount: 1500, advanceAmount: 0, status: 'pending',
});
afterEach(() => setCurrentLang('en'));
describe('BUG 2: customer identity and isolated measurements', () => {
  it('never merges separate legacy customers using invalid contact numbers', () => {
    const a = { ...order('A'), customerId: undefined, phone: '123' };
    const b = { ...order('B'), customerId: undefined, phone: '123' };
    const result = migrateRegister([a, b]);
    expect(result.customers).toHaveLength(2);
    expect(result.orders[0].customerId).not.toBe(result.orders[1].customerId);
  });
  it('preserves explicit customer IDs even when normalized phones are identical', () => {
    const result = migrateRegister([order('A'), order('B')], [customer('A'), customer('B')]);
    expect(result.orders.map(o => o.customerId)).toEqual(['A', 'B']);
    expect(result.customers.map(c => c.name)).toEqual(['A', 'B']);
  });
  it('returns detached profiles, measurements, items and payments, not live references', () => {
    const input = [order('A'), order('B')];
    const existing = [customer('A'), customer('B')];
    const before = JSON.stringify({ input, existing });
    const result = migrateRegister(input, existing);
    result.orders[0].items![0].measurements.teera = 99;
    result.orders[0].measurements.teera = 90;
    result.customers[0].name = 'Edited A';
    expect(JSON.stringify({ input, existing })).toBe(before);
    expect(result.orders[1].items![0].measurements.teera).not.toBe(99);
    expect(Object.isFrozen(LEGACY_MEASUREMENTS)).toBe(true);
  });
});
describe('BUG 3: translated errors', () => {
  for (const lang of ['en', 'ur'] as const) it(`does not concatenate both languages in ${lang}`, () => {
    setCurrentLang(lang);
    const message = bi('m_name_and_valid_phone_required');
    expect(message).not.toMatch(/ \/ .*[\u0600-\u06ff]/);
    if (lang === 'en') expect(message).not.toMatch(/[\u0600-\u06ff]/);
    else expect(message).not.toMatch(/[A-Za-z]/);
  });
});
