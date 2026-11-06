import { afterEach, describe, expect, it } from 'vitest';
import { DICT, fill, setCurrentLang, shortDate, tl, tr, type Lang } from './i18n';
import { receiptMessage, receiptShopName, receiptStyle, receiptThanks } from './receipt-message';
import type { Order } from '../types/order';

const order: Order = {
  id: 'proof-order', serialNumber: 'DK-007', customerName: 'Test customer',
  phone: '03001234567', orderDate: '2026-11-06T00:00:00Z',
  deliveryDate: '2026-11-10T00:00:00Z', createdAt: '2026-11-06T00:00:00Z',
  urgent: true, suitCount: 1, fabric: 'Cotton', status: 'pending',
  collarType: 'Normal Collar', damanType: 'Choras (Square)', cuffType: 'Simple',
  pockets: 'Front Pocket', specialNotes: '', totalAmount: 2500, advanceAmount: 500,
  measurements: { kameezLambai: 40, teera: 18, bazu: 24, gala: 16, chhaati: 42,
    kamar: 40, ghera: 24, shalwarLambai: 40, paincha: 8, asan: 14, shalwarGhera: 28 },
};
const settings = { shopName: 'Test Tailors', shopNameUrdu: 'آزمائشی درزی',
  phone: '03001234567', address: 'Shop 1', zindigiWallet: '03001234567', accountTitle: 'Test account' };
afterEach(() => setCurrentLang('en'));

describe('single-language interface', () => {
  it.each(['en', 'ur'] as Lang[])('tl and tr select only %s', lang => {
    setCurrentLang(lang);
    expect(tl('auth_login')).toBe(DICT.auth_login[lang]);
    expect(tr('auth_login', lang === 'ur')).toBe(DICT.auth_login[lang]);
    expect(tl('auth_login')).not.toContain(' / ');
  });
  it('switches immediately without retaining the previous language', () => {
    setCurrentLang('ur'); expect(tl('name')).toBe(DICT.name.ur);
    setCurrentLang('en'); expect(tl('name')).toBe(DICT.name.en);
  });
  it('fills Urdu numbers and variables without changing identifiers', () => {
    expect(fill('{n} {ref}', { n: 3, ref: 'DK-007' }, 'ur')).toBe('۳ DK-007');
  });
  it.each(['en', 'ur'] as Lang[])('formats the delivery date for %s', lang => {
    expect(shortDate(order.deliveryDate, lang)).toBeTruthy();
    expect(shortDate(order.deliveryDate, lang)).not.toContain('Invalid');
  });
});
describe('localized WhatsApp and printed parchi copy', () => {
  it('English receipt has no Urdu UI text, including payment details', () => {
    const message = receiptMessage(order, settings, 'en');
    expect(message).toContain('Customer: Test customer');
    expect(message).toContain('Balance: Rs 2,000');
    expect(message).toContain('Reference: DK-007');
    expect(message).toContain('Normal Collar');
    expect(message).not.toMatch(/[\u0600-\u06ff]/);
  });
  it('Urdu receipt translates field, style and payment labels', () => {
    const message = receiptMessage(order, settings, 'ur');
    expect(message).toContain('گاہک: Test customer');
    expect(message).toContain('آزمائشی درزی');
    expect(message).toContain('عام کالر');
    expect(message).toContain('حوالہ: DK-007');
    expect(message).not.toMatch(/Customer:|Delivery:|Measurements|Normal Collar|Pay online|Reference:/);
  });
  it.each(['en', 'ur'] as Lang[])('round-trips WhatsApp URL encoding in %s', lang => {
    const message = receiptMessage(order, settings, lang);
    expect(decodeURIComponent(encodeURIComponent(message))).toBe(message);
    expect(message).not.toMatch(/\{\w+\}/);
  });
  it('uses the same localized shop and style in messages and parchi', () => {
    expect(receiptShopName(settings, 'ur')).toBe(settings.shopNameUrdu);
    expect(receiptStyle('Normal Collar', 'ur')).toBe(DICT.collar_normal.ur);
    expect(receiptStyle('Custom design', 'ur')).toBe('Custom design');
  });
  it('localizes the historical default without overwriting custom messages', () => {
    const legacy = { ...settings, thankYouMessage: 'Shukriya! Delivery ki tareekh par rabta farmaiye ga.' };
    expect(receiptThanks(legacy, 'ur')).toBe(DICT.receipt_thanks.ur);
    expect(receiptThanks({ ...settings, thankYouMessage: 'My custom note' }, 'ur')).toBe('My custom note');
  });
});
