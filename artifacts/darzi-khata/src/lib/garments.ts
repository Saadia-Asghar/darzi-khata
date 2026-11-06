import type { GarmentType, Measurements, OrderItem } from '../types/order';
export interface GarmentField { key: string; en: string; ur: string; default: number }
const f = (key: string, en: string, ur: string, value: number): GarmentField => ({ key, en, ur, default: value });
export const GARMENTS: { value: GarmentType; en: string; ur: string; fields: GarmentField[] }[] = [
  { value: 'gents', en: 'Gents Shalwar Kameez', ur: 'مردانہ شلوار قمیض', fields: [
    f('kameezLambai','Length','لمبائی',40),f('teera','Shoulder','تیرا',18),f('bazu','Sleeve','بازو',24),f('gala','Neck','گلا',15),
    f('chhaati','Chest','چھاتی',22),f('kamar','Waist','کمر',21),f('ghera','Hem','گھیرا',23),f('shalwarLambai','Shalwar length','شلوار لمبائی',38),
    f('paincha','Ankle','پائنچہ',7.5),f('asan','Rise','آسن',16),f('shalwarGhera','Shalwar width','شلوار گھیرا',40)] },
  { value: 'ladies-shirt', en: 'Ladies Shirt / Kameez', ur: 'زنانہ قمیض', fields: [
    f('length','Length','لمبائی',38),f('shoulder','Shoulder','کندھا',14),f('bust','Bust','چھاتی',19),f('waist','Waist','کمر',17),
    f('hip','Hip','کولہا',21),f('sleeve','Sleeve','بازو',21),f('armhole','Armhole','بغل',8),f('neckDepth','Neck depth','گلا گہرائی',6)] },
  { value: 'ladies-trouser', en: 'Ladies Trouser / Shalwar', ur: 'زنانہ شلوار / پاجامہ', fields: [
    f('length','Length','لمبائی',38),f('waist','Waist','کمر',30),f('hip','Hip','کولہا',40),f('rise','Rise','آسن',12),f('ankle','Ankle','پائنچہ',7)] },
  { value: 'waistcoat', en: 'Waistcoat', ur: 'واسکٹ', fields: [
    f('length','Length','لمبائی',27),f('shoulder','Shoulder','کندھا',17),f('chest','Chest','چھاتی',22),f('waist','Waist','کمر',21),f('neck','Neck','گلا',15)] },
  { value: 'pant-shirt', en: 'Pant–Shirt', ur: 'پینٹ شرٹ', fields: [
    f('shirtLength','Shirt length','شرٹ لمبائی',30),f('chest','Chest','چھاتی',22),f('shoulder','Shoulder','کندھا',18),f('sleeve','Sleeve','بازو',24),
    f('pantLength','Pant length','پینٹ لمبائی',40),f('waist','Waist','کمر',32),f('inseam','Inseam','اندرونی لمبائی',30),f('ankle','Ankle','پائنچہ',8)] },
  { value: 'kids', en: 'Kids', ur: 'بچوں کے کپڑے', fields: [
    f('length','Length','لمبائی',24),f('shoulder','Shoulder','کندھا',11),f('chest','Chest','چھاتی',14),f('sleeve','Sleeve','بازو',14),
    f('trouserLength','Trouser length','شلوار لمبائی',23),f('waist','Waist','کمر',22)] },
];
export const garment = (type: GarmentType) => GARMENTS.find(g => g.value === type) || GARMENTS[0];
export const defaultMeasurements = (type: GarmentType) => Object.fromEntries(garment(type).fields.map(f => [f.key, f.default]));
export const LEGACY_MEASUREMENTS = defaultMeasurements('gents') as unknown as Measurements;
export function newItem(type: GarmentType = 'gents'): OrderItem {
  return { id: crypto.randomUUID(), garmentType: type, quantity: 1, unitPrice: 1500, measurements: defaultMeasurements(type) };
}
export function itemsTotal(items: OrderItem[]) {
  return Math.round(items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0) * 100) / 100;
}
export function validateItems(items: OrderItem[]) {
  if (!items.length || items.length > 50) throw new Error('Add 1–50 garments / ایک سے پچاس کپڑے شامل کریں');
  for (const item of items) {
    if (!GARMENTS.some(g => g.value === item.garmentType) || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 50
      || !Number.isFinite(item.unitPrice) || item.unitPrice < 0 || !item.measurements
      || garment(item.garmentType).fields.some(f => !Number.isFinite(item.measurements[f.key]) || item.measurements[f.key] <= 0 || item.measurements[f.key] > 120))
      throw new Error('Invalid garment price or measurements / کپڑے کی قیمت یا ناپ درست کریں');
  }
}
