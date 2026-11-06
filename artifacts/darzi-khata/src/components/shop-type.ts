import { entry, type DictKey } from '../lib/i18n';
import type { ShopSettings } from '../hooks/use-settings';
export const SHOP_TYPES: { value: NonNullable<ShopSettings['shopType']>; tk: DictKey; en: string; ur: string }[] = [
  { value: 'shop', ...entry('d_shop') },
  { value: 'home-based', ...entry('d_home_based') },
  { value: 'women-home-tailor', ...entry('d_woman_home_tailor') },
];
export const shopTypeLabel = (t?: ShopSettings['shopType']) => {
  const s = SHOP_TYPES.find((x) => x.value === (t || 'shop')) || SHOP_TYPES[0];
  return `${s.en} / ${s.ur}`;
};
export const pkr = (n: number) => `Rs ${Math.round(n).toLocaleString('en-PK')}`;
export const monthLabel = (ym: string) => {
  const [y, m] = ym.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-PK', { month: 'short', year: '2-digit' });
};
