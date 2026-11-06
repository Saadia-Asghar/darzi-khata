import { bi } from './i18n';
import type { Customer, Order } from '../types/order';
import type { ShopSettings } from '../hooks/use-settings';
import { validateExpense, type Expense, type SavingsGoal } from './shop-tools';
import type { MeasurementTemplate } from '../hooks/use-templates';
import { importPhotos, deleteFabricPhoto, type PhotoBackup } from './photos';
import { validateCustomers, validateOrders } from './order-validation';
import { SCHEMA_VERSION, migrateRegister, highestSerial } from './migrations';
import { readJSON } from './storage';
import { writeStorageBatch } from './local-store';
import { registerSnapshot } from './backup-reminder';
export interface PendingBackupSave { snapshot: string; exportedAt: string }
/** A download request is not proof of a saved file. Return a confirmation token only. */
export async function requestBackupDownload(
  scope: string, build: () => Promise<unknown>, isCurrent: () => boolean,
  download: (payload: unknown) => void,
): Promise<PendingBackupSave | null> {
  const snapshot = registerSnapshot(scope);
  const exportedAt = new Date().toISOString();
  const payload = await build();
  if (!isCurrent()) return null;
  download(payload);
  return { snapshot, exportedAt };
}
export interface ParsedBackup {
  orders: Order[];
  customers?: Customer[];
  photos: PhotoBackup[];
  settings?: Partial<ShopSettings>;
  templates?: MeasurementTemplate[];
  karigars?: string[];
}
const SECRET_KEYS = new Set(['pin','pinhash','pinsalt','password','passwordhash','salt','hash']);
// Filter recursively: imported/legacy records can contain extra fields, not just settings.
export function stripSecrets<T>(value: T): T {
  if (Array.isArray(value)) return value.map(stripSecrets) as T;
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value)
      .filter(([key]) => !SECRET_KEYS.has(key.toLowerCase()))
      .map(([key, child]) => [key, stripSecrets(child)])) as T;
  }
  return value;
}
export function validateBackup(raw: unknown): ParsedBackup {
  if (!raw || typeof raw!=='object') throw new Error(bi('m_not_a_khata_backup'));
  const d = raw as Record<string,unknown>;
  if (d.schemaVersion !== undefined && (!Number.isInteger(d.schemaVersion) || Number(d.schemaVersion)>SCHEMA_VERSION))
    throw new Error(bi('m_backup_is_from_a_newer_app_version'));
  validateOrders(d.orders);
  if (d.customers!==undefined)validateCustomers(d.customers);
  if (d.photos!==undefined&&!Array.isArray(d.photos))throw new Error(bi('m_invalid_photo_list'));
  const photos=(d.photos||[]) as PhotoBackup[];
  if (photos.length>1000 || new Set(photos.map(p=>p?.id)).size!==photos.length || photos.some(p=>!p || typeof p.id!=='string' || typeof p.data!=='string'
    || p.data.length>270000 || !/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(p.data)))
    throw new Error(bi('m_invalid_photo_backup'));
  for(const p of photos) {
    const bytes=atob(p.data.split(',')[1]);
    if(!bytes.length||bytes.length>=200000)throw new Error(bi('m_photo_exceeds_200_kb'));
  }
  const ids=new Set(photos.map(p=>p.id));
  if(d.orders.some(o=>o.fabricPhotoId&&!ids.has(o.fabricPhotoId)))throw new Error(bi('m_backup_is_missing_fabric_photos'));
  if(d.settings!==undefined) {
    if(!d.settings||typeof d.settings!=='object'||Array.isArray(d.settings))throw new Error(bi('m_invalid_shop_settings'));
    const s=d.settings as Record<string,unknown>;
    if(s.hideShopPhone!==undefined&&typeof s.hideShopPhone!=='boolean')throw new Error(bi('m_invalid_shop_settings'));
    if(s.expenses!==undefined&&(!Array.isArray(s.expenses)||s.expenses.length>50000||s.expenses.some(e=>!e||!validateExpense(e as Expense))))throw new Error(bi('m_invalid_shop_settings'));
    if(s.savings!==undefined) {
      const goal=s.savings as SavingsGoal;
      if(!goal||typeof goal.name!=='string'||!Number.isFinite(goal.target)||goal.target<=0||!Number.isFinite(goal.percent)||goal.percent<0||goal.percent>100
        ||!Array.isArray(goal.contributions)||goal.contributions.length>50000
        ||goal.contributions.some(c=>!c||typeof c.id!=='string'||!Number.isFinite(c.amount)||c.amount<=0||!Number.isFinite(Date.parse(c.date)))
        ||goal.contributions.reduce((sum,c)=>sum+c.amount,0)>goal.target)throw new Error(bi('m_invalid_shop_settings'));
    }
    if(s.rushPlan!==undefined) {
      const plan=s.rushPlan as NonNullable<ShopSettings['rushPlan']>;
      if(!plan||!Number.isFinite(Date.parse(plan.deadline))||!Number.isInteger(plan.workers)||plan.workers<1||plan.workers>100||!Number.isInteger(plan.dailyPerKarigar)||plan.dailyPerKarigar<1||plan.dailyPerKarigar>100)throw new Error(bi('m_invalid_shop_settings'));
    }
    for(const k of ['shopName','shopNameUrdu','address','phone','thankYouMessage','zindigiWallet','raastId','accountTitle'])
      if(s[k]!==undefined&&typeof s[k]!=='string')throw new Error(bi('m_invalid_shop_settings'));
    if(s.darkMode!==undefined&&typeof s.darkMode!=='boolean')throw new Error(bi('m_invalid_theme'));
    if(s.language!==undefined&&!['ur','en'].includes(String(s.language)))throw new Error(bi('m_invalid_language'));
    if(s.fontSize!==undefined&&!['normal','large'].includes(String(s.fontSize)))throw new Error(bi('m_invalid_font'));
    if(s.shopType!==undefined&&!['shop','home-based','women-home-tailor'].includes(String(s.shopType)))throw new Error(bi('m_invalid_shop_type'));
  }
  if(d.karigars!==undefined&&(!Array.isArray(d.karigars)||d.karigars.some(v=>typeof v!=='string')))throw new Error(bi('m_invalid_team_list'));
  if(d.templates!==undefined) {
    if(!Array.isArray(d.templates)||d.templates.some(t=>!t||typeof t.id!=='string'||typeof t.name!=='string'||!t.measurements
      || Object.values(t.measurements).some(v=>typeof v!=='number'||!Number.isFinite(v)||v<0)))throw new Error(bi('m_invalid_templates'));
  }
  return {orders:d.orders,customers:d.customers as Customer[]|undefined,photos,settings:d.settings?stripSecrets(d.settings as Partial<ShopSettings>):undefined,
    templates:d.templates as MeasurementTemplate[]|undefined,karigars:d.karigars as string[]|undefined};
}
export async function restoreBackup(raw: unknown, scope: string) {
  const data = validateBackup(raw);
  const version = readJSON<{schemaVersion:number}|null>(`darzi-khata-schema-${scope}`,null);
  if(version && version.schemaVersion>SCHEMA_VERSION)throw new Error(bi('m_update_app_before_restoring'));
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
