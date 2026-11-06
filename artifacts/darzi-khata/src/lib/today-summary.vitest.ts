import { describe, expect, it } from 'vitest';
import { todaySummary } from './today-summary';
import { createFinancialDemo } from './demo-data';
import { DICT, demoText, fabricName } from './i18n';
const now = new Date(2026, 10, 7, 15);
const base = createFinancialDemo(now)[0];
const order = (id: string, days: number, status = 'pending', paid = 0) => ({
  ...base, id, status, deliveryDate: new Date(2026, 10, 7 + days, 9).toISOString(),
  totalAmount: 1000, advanceAmount: paid, payments: [],
}) as typeof base;
describe('Today summary definitions', () => {
  it('counts today only, sums today/ready/overdue once and excludes delivered', () => {
    const result = todaySummary([
      order('today', 0), order('today-ready', 0, 'ready', 200),
      order('late', -2, 'stitching', 400), order('ready-future', 3, 'ready', 100),
      order('later', 3), order('delivered', -2, 'delivered'),
      order('paid-late', -1, 'pending', 1000),
    ], now);
    expect(result).toEqual({ deliveries: 2, collect: 3300, overdue: 2 });
  });
  it('recomputes collection after payments without changing delivery count', () => {
    expect(todaySummary([order('one', 0, 'ready', 300)], now)).toEqual({ deliveries: 1, collect: 700, overdue: 0 });
    expect(todaySummary([order('one', 0, 'ready', 1000)], now)).toEqual({ deliveries: 1, collect: 0, overdue: 0 });
  });
  it('returns true zeros for an empty register and unpaid future work', () => {
    expect(todaySummary([], now)).toEqual({ deliveries: 0, collect: 0, overdue: 0 });
    expect(todaySummary([order('future', 1)], now).collect).toBe(0);
  });
  it('uses local calendar dates across midnight', () => {
    const today = order('today', 0); today.deliveryDate = new Date(2026, 10, 7, 0, 1).toISOString();
    expect(todaySummary([today], new Date(2026, 10, 7, 23, 59)).deliveries).toBe(1);
  });
});
describe('single-language built-in and legacy data', () => {
  it('translates canonical/legacy fabrics without editing custom descriptions', () => {
    expect(fabricName('Boski / بوسکی', 'en')).toBe('Boski');
    expect(fabricName('Cotton / کاٹن', 'ur')).toBe('کاٹن');
    expect(fabricName('Wash & Wear', 'ur')).toBe('واش اینڈ ویئر');
    expect(fabricName('Blue cloth from customer', 'ur')).toBe('Blue cloth from customer');
    expect(demoText('Working on this order / اس آرڈر پر کام جاری ہے', 'en')).toBe('Working on this order');
  });
  it('rejects Roman Urdu time/instruction words in English dictionary values', () => {
    for (const pair of Object.values(DICT)) expect(pair.en).not.toMatch(/\b(kal|din|naap|kapra|jora|aaj|ada|aapka)\b/i);
  });
});
