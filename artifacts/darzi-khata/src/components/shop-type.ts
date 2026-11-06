import type { ShopSettings } from '../hooks/use-settings';
export const SHOP_TYPES: { value: NonNullable<ShopSettings['shopType']>; en: string; ur: string }[] = [
  { value: 'shop', en: 'Shop', ur: 'دکان' },
  { value: 'home-based', en: 'Home-based', ur: 'گھر سے کام' },
  { value: 'women-home-tailor', en: 'Woman home tailor', ur: 'خاتون درزی (گھر)' },
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
