import type { Customer, Order } from '../types/order';
import type { ShopSettings } from '../hooks/use-settings';
import type { MeasurementTemplate } from '../hooks/use-templates';
import { importPhotos, deleteFabricPhoto, type PhotoBackup } from './photos';
import { validateCustomers, validateOrders } from './order-validation';
import { SCHEMA_VERSION, migrateRegister, highestSerial } from './migrations';
import { readJSON } from './storage';
import { writeStorageBatch } from './local-store';
export interface ParsedBackup {
  orders: Order[];
  customers?: Customer[];
  photos: PhotoBackup[];
  settings?: Partial<ShopSettings>;
  templates?: MeasurementTemplate[];
  karigars?: string[];
}
const SECRET_KEYS = ['pin','pinHash','pinSalt','password','passwordHash','salt','hash'];
export const stripSecrets = <T extends object>(o:T):T => Object.fromEntries(Object.entries(o).filter(([k])=>!SECRET_KEYS.includes(k))) as T;
export function validateBackup(raw: unknown): ParsedBackup {
  if (!raw || typeof raw!=='object') throw new Error('Not a khata backup / کھاتہ بیک اپ نہیں');
  const d = raw as Record<string,unknown>;
  if (d.schemaVersion !== undefined && (!Number.isInteger(d.schemaVersion) || Number(d.schemaVersion)>SCHEMA_VERSION))
    throw new Error('Backup is from a newer app version / پہلے ایپ اپ ڈیٹ کریں');
  validateOrders(d.orders);
  if (d.customers!==undefined)validateCustomers(d.customers);
  if (d.photos!==undefined&&!Array.isArray(d.photos))throw new Error('Invalid photo list / تصویر فہرست غلط ہے');
  const photos=(d.photos||[]) as PhotoBackup[];
  if (photos.length>1000 || new Set(photos.map(p=>p?.id)).size!==photos.length || photos.some(p=>!p || typeof p.id!=='string' || typeof p.data!=='string'
    || p.data.length>270000 || !/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(p.data)))
    throw new Error('Invalid photo backup / تصویر بیک اپ غلط ہے');
  for(const p of photos) {
    const bytes=atob(p.data.split(',')[1]);
    if(!bytes.length||bytes.length>=200000)throw new Error('Photo exceeds 200 KB / تصویر بڑی ہے');
  }
  const ids=new Set(photos.map(p=>p.id));
  if(d.orders.some(o=>o.fabricPhotoId&&!ids.has(o.fabricPhotoId)))throw new Error('Backup is missing fabric photos / بیک اپ میں تصاویر موجود نہیں');
  if(d.settings!==undefined) {
    if(!d.settings||typeof d.settings!=='object'||Array.isArray(d.settings))throw new Error('Invalid shop settings / دکان سیٹنگ غلط ہے');
    const s=d.settings as Record<string,unknown>;
    for(const k of ['shopName','shopNameUrdu','address','phone','thankYouMessage','zindigiWallet','raastId','accountTitle'])
      if(s[k]!==undefined&&typeof s[k]!=='string')throw new Error('Invalid shop settings / دکان سیٹنگ غلط ہے');
    if(s.darkMode!==undefined&&typeof s.darkMode!=='boolean')throw new Error('Invalid theme / تھیم غلط ہے');
    if(s.language!==undefined&&!['ur','en'].includes(String(s.language)))throw new Error('Invalid language / زبان غلط ہے');
    if(s.fontSize!==undefined&&!['normal','large'].includes(String(s.fontSize)))throw new Error('Invalid font / حروف غلط ہیں');
    if(s.shopType!==undefined&&!['shop','home-based','women-home-tailor'].includes(String(s.shopType)))throw new Error('Invalid shop type / دکان کی قسم غلط ہے');
  }
  if(d.karigars!==undefined&&(!Array.isArray(d.karigars)||d.karigars.some(v=>typeof v!=='string')))throw new Error('Invalid team list / ٹیم فہرست غلط ہے');
  if(d.templates!==undefined) {
    if(!Array.isArray(d.templates)||d.templates.some(t=>!t||typeof t.id!=='string'||typeof t.name!=='string'||!t.measurements
      || Object.values(t.measurements).some(v=>typeof v!=='number'||!Number.isFinite(v)||v<0)))throw new Error('Invalid templates / ناپ سانچے غلط ہیں');
  }
  return {orders:d.orders,customers:d.customers as Customer[]|undefined,photos,settings:d.settings?stripSecrets(d.settings as Partial<ShopSettings>):undefined,
    templates:d.templates as MeasurementTemplate[]|undefined,karigars:d.karigars as string[]|undefined};
}
export async function restoreBackup(raw: unknown, scope: string) {
  const data = validateBackup(raw);
  const version = readJSON<{schemaVersion:number}|null>(`darzi-khata-schema-${scope}`,null);
  if(version && version.schemaVersion>SCHEMA_VERSION)throw new Error('Update app before restoring / بحالی سے پہلے ایپ اپ ڈیٹ کریں');
  const photoMap = await importPhotos(data.photos,scope);
  try {
    const orders = data.orders.map(o=>o.fabricPhotoId?{...o,fabricPhotoId:photoMap.get(o.fabricPhotoId)}:o);
    const migrated = migrateRegister(orders,data.customers||[]);
    const entries: [string,unknown][] = [
      [`darzi-khata-orders-${scope}`,migrated.orders],
      [`darzi-khata-customers-${scope}`,migrated.customers],
      [`darzi-khata-serial-${scope}`,highestSerial(migrated.orders)],
      [`darzi-khata-schema-${scope}`,{schemaVersion:SCHEMA_VERSION}],
    ];
    if(data.settings)entries.push([`darzi-khata-settings-${scope}`,{...readJSON(`darzi-khata-settings-${scope}`,{}),...data.settings}]);
    if(data.templates)entries.push([`darzi-khata-templates-${scope}`,data.templates]);
    if(data.karigars)entries.push([`darzi-khata-karigars-${scope}`,data.karigars]);
    writeStorageBatch(entries);
    return migrated.orders.length;
  } catch(error) {
    await Promise.all([...photoMap.values()].map(id=>deleteFabricPhoto(id).catch(()=>undefined)));
    throw error;
  }
}
