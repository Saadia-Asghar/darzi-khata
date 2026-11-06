import { DICT, fill, money, shortDate, type DictKey, type Lang, type Vars } from './i18n';
import { garment } from './garments';
import { balance, paymentDetailsText, type PaymentDetails } from './payments';
import type { Order } from '../types/order';

export interface ReceiptSettings extends PaymentDetails {
  shopNameUrdu?: string;
  thankYouMessage?: string;
  address: string;
  phone: string;
}

const styleKeys: DictKey[] = [
  'collar_normal', 'collar_ban', 'collar_kurta', 'collar_round',
  'daman_square', 'daman_round', 'pocket_front', 'pocket_1side',
  'pocket_2side', 'pocket_zip', 'cuff_simple', 'cuff_button', 'cuff_cut',
];
export function receiptStyle(value: string, lang: Lang): string {
  const key = styleKeys.find(key => DICT[key].en === value || DICT[key].ur === value);
  return key ? DICT[key][lang] : value;
}
export function receiptShopName(settings: ReceiptSettings, lang: Lang): string {
  return lang === 'ur' && settings.shopNameUrdu ? settings.shopNameUrdu : settings.shopName;
}
export function receiptThanks(settings: ReceiptSettings, lang: Lang): string {
  // Recognize the historical default without changing users' stored custom text.
  const legacyDefault = 'Shukriya! Delivery ki tareekh par rabta farmaiye ga.';
  return settings.thankYouMessage && settings.thankYouMessage !== legacyDefault
    ? settings.thankYouMessage : DICT.receipt_thanks[lang];
}
export function receiptMessage(order: Order, settings: ReceiptSettings, lang: Lang): string {
  const t = (key: DictKey, vars?: Vars) => fill(DICT[key][lang], vars, lang);
  const remaining = balance(order);
  const details = paymentDetailsText(settings, lang);
  const items = order.items?.length ? order.items : [{
    garmentType: 'gents' as const, quantity: order.suitCount,
    measurements: order.measurements as unknown as Record<string, number>,
  }];
  return t('receipt_message', {
    shop: receiptShopName(settings, lang),
    serial: `${t('receipt_number')} ${order.serialNumber || order.id}`,
    customer: order.customerName,
    phone: order.phone,
    date: shortDate(order.deliveryDate, lang),
    urgent: order.urgent ? t('urgent_chip') : '',
    garments: items.map(item => `${item.quantity} ${t(garment(item.garmentType).tk)}`).join(', '),
    fabric: order.fabric,
    measurements: items.map(item => `${t(garment(item.garmentType).tk)}\n${garment(item.garmentType).fields.map(field => `${t(field.tk)}: ${item.measurements[field.key] ?? 0}`).join(' · ')}`).join('\n'),
    style: [order.collarType, order.damanType, order.pockets, order.cuffType]
      .map(value => receiptStyle(value, lang)).join(' · '),
    notes: order.specialNotes || '',
    total: money(order.totalAmount), collected: money(order.advanceAmount), balance: money(remaining),
    payment: details && remaining > 0 ? `${t('receipt_pay_online')}\n${details}\n${t('receipt_reference', { ref: order.serialNumber || order.id, amount: remaining })}\n${t('receipt_share_screenshot')}` : '',
    thanks: receiptThanks(settings, lang),
    address: settings.address,
    shopPhone: settings.phone,
  });
}
