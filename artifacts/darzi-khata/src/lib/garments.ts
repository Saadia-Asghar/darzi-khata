import { entry, bi, type DictKey } from './i18n';
import type { GarmentType, Measurements, OrderItem } from '../types/order';
export interface GarmentField { key: string; tk: DictKey; en: string; ur: string; default: number }
const f = (key: string, e: { tk: DictKey; en: string; ur: string }, value: number): GarmentField => ({ key, ...e, default: value });
export const GARMENTS: { value: GarmentType; tk: DictKey; en: string; ur: string; fields: GarmentField[] }[] = [
  { value: 'gents', ...entry('d_gents_shalwar_kameez'), fields: [
    f('kameezLambai',entry('d_length'),40),f('teera',entry('d_shoulder'),18),f('bazu',entry('d_sleeve'),24),f('gala',entry('d_neck'),15),
    f('chhaati',entry('d_chest'),22),f('kamar',entry('d_waist'),21),f('ghera',entry('d_hem'),23),f('shalwarLambai',entry('d_shalwar_length'),38),
    f('paincha',entry('d_ankle'),7.5),f('asan',entry('d_rise'),16),f('shalwarGhera',entry('d_shalwar_width'),40)] },
  { value: 'ladies-shirt', ...entry('d_ladies_shirt_kameez'), fields: [
    f('length',entry('d_length'),38),f('shoulder',entry('d_shoulder_2'),14),f('bust',entry('d_bust'),19),f('waist',entry('d_waist'),17),
    f('hip',entry('d_hip'),21),f('sleeve',entry('d_sleeve'),21),f('armhole',entry('d_armhole'),8),f('neckDepth',entry('d_neck_depth'),6)] },
  { value: 'ladies-trouser', ...entry('d_ladies_trouser_shalwar'), fields: [
    f('length',entry('d_length'),38),f('waist',entry('d_waist'),30),f('hip',entry('d_hip'),40),f('rise',entry('d_rise'),12),f('ankle',entry('d_ankle'),7)] },
  { value: 'waistcoat', ...entry('d_waistcoat'), fields: [
    f('length',entry('d_length'),27),f('shoulder',entry('d_shoulder_2'),17),f('chest',entry('d_chest'),22),f('waist',entry('d_waist'),21),f('neck',entry('d_neck'),15)] },
  { value: 'pant-shirt', ...entry('d_pant_shirt'), fields: [
    f('shirtLength',entry('d_shirt_length'),30),f('chest',entry('d_chest'),22),f('shoulder',entry('d_shoulder_2'),18),f('sleeve',entry('d_sleeve'),24),
    f('pantLength',entry('d_pant_length'),40),f('waist',entry('d_waist'),32),f('inseam',entry('d_inseam'),30),f('ankle',entry('d_ankle'),8)] },
  { value: 'kids', ...entry('d_kids'), fields: [
    f('length',entry('d_length'),24),f('shoulder',entry('d_shoulder_2'),11),f('chest',entry('d_chest'),14),f('sleeve',entry('d_sleeve'),14),
    f('trouserLength',entry('d_trouser_length'),23),f('waist',entry('d_waist'),22)] },
];
export const garment = (type: GarmentType) => GARMENTS.find(g => g.value === type) || GARMENTS[0];
export const defaultMeasurements = (type: GarmentType) => Object.fromEntries(garment(type).fields.map(f => [f.key, f.default]));
export const LEGACY_MEASUREMENTS = Object.freeze(defaultMeasurements('gents')) as unknown as Measurements;
export function newItem(type: GarmentType = 'gents'): OrderItem {
  return { id: crypto.randomUUID(), garmentType: type, quantity: 1, unitPrice: 1500, measurements: defaultMeasurements(type) };
}
export function itemsTotal(items: OrderItem[]) {
  return Math.round(items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0) * 100) / 100;
}
export function validateItems(items: OrderItem[]) {
  if (!items.length || items.length > 50) throw new Error(bi('m_add_1_50_garments'));
  for (const item of items) {
    if (!GARMENTS.some(g => g.value === item.garmentType) || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 50
      || !Number.isFinite(item.unitPrice) || item.unitPrice < 0 || !item.measurements
      || garment(item.garmentType).fields.some(f => !Number.isFinite(item.measurements[f.key]) || item.measurements[f.key] <= 0 || item.measurements[f.key] > 120))
      throw new Error(bi('m_invalid_garment_price_or_measurements'));
  }
}
