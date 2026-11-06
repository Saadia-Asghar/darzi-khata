import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createFinancialDemo } from './demo-data';
import { appendPayment, balance, buildPaymentPayload, migrateOrder, paymentHistory, paymentShare } from './payments';
import { computeCreditScore } from './credit-score';
import { normalizePakistaniPhone, pendingReminders, reminderText, whatsappReminder } from './reminders';
import { parseSpokenNumber, parseVoiceMeasurements } from './voice-parse';
import { claimLegacyShop } from './local-store';

const now = new Date('2026-11-06T12:00:00Z');
const demo = createFinancialDemo(now);
const legacy = { ...demo[0], payments: undefined, totalAmount: 3000, advanceAmount: 1000 };

test('150 synthetic orders across six calendar months with a growing book', () => {
  assert.equal(demo.length, 150);
  const profile = computeCreditScore(demo, now);
  assert.equal(profile.monthly.length, 6);
  assert.deepEqual(profile.monthly.map(m => m.orders), [15, 19, 23, 27, 31, 35]);
  assert.ok(profile.score > 0 && profile.score <= 100);
  assert.equal(profile.factors.reduce((sum, f) => sum + f.weight, 0), 100);
  assert.ok(profile.eligibleLoan > 0 && profile.eligibleLoan <= 300000);
  assert.equal(new Set(demo.map(o => o.id)).size, 150);
  assert.ok(demo.every(o => o.payments!.reduce((sum, p) => sum + p.amount, 0) === o.advanceAmount));
  assert.ok(demo.some(o => o.status !== 'delivered' && Date.parse(o.deliveryDate) < now.getTime()));
});
test('legacy advance migrates once to cash without changing existing fields', () => {
  const migrated = migrateOrder(legacy);
  assert.deepEqual(paymentHistory(migrated), paymentHistory(migrateOrder(migrated)));
  assert.equal(migrated.payments![0].method, 'cash');
  assert.equal(migrated.payments![0].amount, 1000);
  assert.deepEqual(migrated.measurements, legacy.measurements);
  assert.equal(legacy.payments, undefined);
});
test('incremental payments preserve ledger and settle only remaining balance', () => {
  const updated = appendPayment(legacy, 500, 'raast', now.toISOString());
  assert.equal(updated.advanceAmount, 1500);
  assert.equal(updated.payments!.length, 2);
  assert.equal(balance(updated), 1500);
  const settled = appendPayment(updated, 1500, 'zindigi', now.toISOString(), true);
  assert.equal(balance(settled), 0);
  assert.equal(settled.payments!.at(-1)!.demo, true);
});
for (const amount of [0, -1, 2001, NaN, Infinity]) {
  test(`reject invalid payment amount ${amount}`, () =>
    assert.throws(() => appendPayment(legacy, amount, 'cash', now.toISOString())));
}
test('reject invalid payment dates and payment methods', () => {
  assert.throws(() => appendPayment(legacy, 10, 'cash', 'invalid'));
  assert.throws(() => appendPayment(legacy, 10, 'unknown' as never, now.toISOString()));
});
test('QR cannot be mistaken for an actual merchant payload', () => {
  const payload = JSON.parse(buildPaymentPayload(legacy, { shopName: 'Shop', raastId: 'DEMO' }));
  assert.equal(payload.type, 'DARZI_KHATA_DEMO_NOT_A_BANK_QR');
  assert.equal(payload.amount, 2000);
  assert.equal(payload.currency, 'PKR');
  assert.ok(!JSON.stringify(payload).includes(legacy.customerName));
});
test('digital share uses recorded payment dates rather than order dates', () => {
  const orders = [{ ...legacy, advanceAmount: 1500, payments: [
    { id: '1', amount: 1000, method: 'cash' as const, date: '2026-10-01' },
    { id: '2', amount: 500, method: 'raast' as const, date: '2026-11-01' },
  ] }];
  const share = paymentShare(orders, now);
  assert.equal(share.cash, 0);
  assert.equal(share.digital, 500);
  assert.equal(share.digitalPercent, 100);
});
test('empty credit profile has safe numbers and no loan', () => {
  const profile = computeCreditScore([], now);
  assert.equal(profile.score, 0);
  assert.equal(profile.enoughData, false);
  assert.equal(profile.eligibleLoan, 0);
  assert.ok(Number.isFinite(profile.averageMonthlyRevenue));
});
test('old delivered records without completion timestamps do not invent on-time data', () => {
  const profile = computeCreditScore([{ ...legacy, status: 'delivered', deliveredAt: undefined }], now);
  assert.equal(profile.observedDeliveries, 0);
  assert.equal(profile.onTimePercent, 0);
});
test('one late and one on-time observed delivery produce 50 percent', () => {
  const profile = computeCreditScore([
    { ...legacy, status: 'delivered', deliveryDate: '2026-10-05', deliveredAt: '2026-10-04' },
    { ...legacy, status: 'delivered', deliveryDate: '2026-10-05', deliveredAt: '2026-10-06' },
  ], now);
  assert.equal(profile.onTimePercent, 50);
});
test('single-month business cannot get an indicative loan yet', () => {
  const profile = computeCreditScore(Array.from({length: 10}, () => ({ ...legacy, orderDate: '2026-11-01' })), now);
  assert.equal(profile.enoughData, false);
  assert.equal(profile.eligibleLoan, 0);
});
test('future orders do not inflate credit score', () => {
  assert.equal(computeCreditScore([{ ...legacy, orderDate: '2099-01-01' }], now).totalOrders, 0);
});
for (const input of ['03001234567', '+92 300 1234567', '00923001234567', '3001234567']) {
  test(`normalize Pakistani phone ${input}`, () => assert.equal(normalizePakistaniPhone(input), '923001234567'));
}
test('WhatsApp reminder encodes bilingual text and payment account', () => {
  const settings = { shopName: 'Darzi', raastId: '03000000000', accountTitle: 'Example' };
  const text = reminderText(legacy, 'payment', settings);
  assert.ok(text.includes('2,000') && text.includes('03000000000'));
  assert.ok(whatsappReminder(legacy, 'ready', settings).includes('text='));
});
test('pending reminders use actual readyAt, not order age', () => {
  const list = pendingReminders([
    { ...legacy, id: 'a', status: 'ready', readyAt: '2026-11-01' },
    { ...legacy, id: 'b', status: 'ready', readyAt: '2026-11-06' },
    { ...legacy, id: 'c', status: 'ready', readyAt: undefined },
    { ...legacy, id: 'd', status: 'delivered' },
  ], now);
  assert.deepEqual(list.map(o => o.id), ['a', 'd']);
});
test('Roman Urdu voice example', () => assert.deepEqual(
  parseVoiceMeasurements('lambai chalees, chaati baees, bazu teis'),
  { kameezLambai: 40, chhaati: 22, bazu: 23 },
));
test('English voice example', () => assert.deepEqual(
  parseVoiceMeasurements('length 40 chest 22 sleeve 23'),
  { kameezLambai: 40, chhaati: 22, bazu: 23 },
));
test('Urdu voice with digits and half', () => assert.deepEqual(
  parseVoiceMeasurements('لمبائی چالیس چھاتی ساڑھے بائیس بازو ۲۳'),
  { kameezLambai: 40, chhaati: 22.5, bazu: 23 },
));
test('half words before/after, English compound, decimal and specific shalwar fields', () => {
  assert.equal(parseSpokenNumber('saadhe baees'), 22.5);
  assert.equal(parseSpokenNumber('twenty two and a half'), 22.5);
  assert.deepEqual(parseVoiceMeasurements('shalwar length forty two paincha 7.5 chest twenty two'), { shalwarLambai: 42, paincha: 7.5, chhaati: 22 });
});
test('all canonical Roman and Urdu numbers 1 through 60', () => {
  const roman = 'ek do teen char paanch chhe saat aath nau das gyarah barah terah chaudah pandrah solah satrah atharah unnees bees ikkees baees teis chaubees pachees chhabbees sattaees atthaees untees tees ikattees battees taintees chauntees paintees chhattees saintees arthees untalees chalees iktalees bayalees taintalees chawalees paintalees chiyalees saintalees artalees unchas pachas ikyawan bawan tirpan chauwan pachpan chhappan sattawan atthawan unsath saath'.split(' ');
  const urdu = 'ایک دو تین چار پانچ چھ سات آٹھ نو دس گیارہ بارہ تیرہ چودہ پندرہ سولہ سترہ اٹھارہ انیس بیس اکیس بائیس تئیس چوبیس پچیس چھبیس ستائیس اٹھائیس انتیس تیس اکتیس بتیس تینتیس چونتیس پینتیس چھتیس سینتیس اڑتیس انتالیس چالیس اکتالیس بیالیس تینتالیس چوالیس پینتالیس چھیالیس سینتالیس اڑتالیس انچاس پچاس اکیاون باون ترپن چون پچپن چھپن ستاون اٹھاون انسٹھ ساٹھ'.split(' ');
  roman.forEach((word, i) => assert.equal(parseSpokenNumber(word), i + 1, word));
  urdu.forEach((word, i) => assert.equal(parseSpokenNumber(word), i + 1, word));
});
test('unrecognized or invalid measurements do not overwrite manual entries', () => {
  assert.deepEqual(parseVoiceMeasurements('hello bazu unknown lambai 500'), {});
  assert.equal(parseSpokenNumber('0'), undefined);
});
test('legacy shop migrates as a unit once and retains recovery sources', () => {
  const entries = new Map<string, string>([
    ['darzi-khata-orders', JSON.stringify([legacy])],
    ['darzi-khata-settings', JSON.stringify({ shopName: 'Original shop' })],
    ['darzi-khata-templates', JSON.stringify([{ name: 'Existing template' }])],
    ['darzi-khata-karigars', JSON.stringify(['Original worker'])],
    ['darzi-khata-serial-counter', '88'],
  ]);
  const storeDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  const windowDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'window');
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
    getItem: (key: string) => entries.get(key) ?? null,
    setItem: (key: string, value: string) => { entries.set(key, value); },
  } });
  Object.defineProperty(globalThis, 'window', { configurable: true, value: new EventTarget() });
  try {
    claimLegacyShop('demo-account');
    assert.equal(entries.has('darzi-khata-legacy-claimed'), false);
    claimLegacyShop('owner-a');
    assert.equal(entries.get('darzi-khata-settings-owner-a'), '{"shopName":"Original shop"}');
    assert.equal(entries.get('darzi-khata-serial-owner-a'), '88');
    assert.ok(entries.has('darzi-khata-orders'));
    claimLegacyShop('owner-b');
    assert.equal(entries.has('darzi-khata-orders-owner-b'), false);
  } finally {
    if (storeDescriptor) Object.defineProperty(globalThis, 'localStorage', storeDescriptor);
    else Reflect.deleteProperty(globalThis, 'localStorage');
    if (windowDescriptor) Object.defineProperty(globalThis, 'window', windowDescriptor);
    else Reflect.deleteProperty(globalThis, 'window');
  }
});
