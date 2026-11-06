import { beforeEach, describe, expect, it } from 'vitest';
import 'fake-indexeddb/auto';
import { migrateRegister, highestSerial, SCHEMA_VERSION } from './migrations';
import { createFinancialDemo } from './demo-data';
import { computeCreditScore } from './credit-score';
import { normalizePakistaniPhone } from './reminders';
import { parseVoiceMeasurements } from './voice-parse';
import { defaultMeasurements, itemsTotal, newItem, validateItems, GARMENTS } from './garments';
import { attemptResult, createPinLock, migrateLegacyPin, pinKey, unlockPin, verifyPin } from './pin';
import { noteSchema } from './storage';
import { clearPhotos, getFabricPhoto, importPhotos } from './photos';
import { restoreBackup, validateBackup } from './backup';
import { writeStorageBatch } from './local-store';

beforeEach(() => {
  const data = new Map<string,string>();
  Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{
    getItem:(key:string)=>data.get(key)??null,
    setItem:(key:string,value:string)=>data.set(key,String(value)),
    removeItem:(key:string)=>data.delete(key),
  }});
  Object.defineProperty(globalThis,'window',{configurable:true,value:new EventTarget()});
});
const now = new Date('2026-11-06T09:00:00Z');
const legacy = () => {
  const order = createFinancialDemo(now)[0];
  delete order.items; delete order.customerId;
  return order;
};
describe('versioned, non-destructive khata migration',()=>{
  it('adds one legacy garment and preserves every historical field',()=>{
    const before = legacy(), snapshot = JSON.stringify(before);
    const {orders,customers}=migrateRegister([before]);
    expect(JSON.stringify(before)).toBe(snapshot);
    expect(orders[0]).toMatchObject(before);
    expect(orders[0].items).toHaveLength(1);
    expect(itemsTotal(orders[0].items!)).toBeCloseTo(before.totalAmount,2);
    expect(customers[0].id).toBe(orders[0].customerId);
    expect(customers[0].profiles[0].measurements).toEqual(before.measurements);
  });
  it('groups formatted Pakistani numbers under one customer',()=>{
    const first=legacy(),second={...first,id:'another',phone:'+92 300 1000025'};
    first.phone='03001000025';
    const result=migrateRegister([first,second]);
    expect(result.customers).toHaveLength(1);
    expect(result.orders[0].customerId).toBe(result.orders[1].customerId);
  });
  it('is idempotent, retains notes and saved profiles',()=>{
    const first=migrateRegister([legacy()]);
    first.customers[0].notes='Keep neckline modest';
    const second=migrateRegister(first.orders,first.customers);
    expect(second).toEqual(first);
  });
  it('repairs high serials from restored orders without trusting array order',()=>{
    expect(highestSerial([{serialNumber:'DK-008'},{serialNumber:'DK-912'},{serialNumber:undefined},{serialNumber:'other-9999'}])).toBe(912);
  });
  it('does not replace a future schema with an older one',()=>{
    localStorage.setItem('darzi-khata-schema-example',JSON.stringify({schemaVersion:SCHEMA_VERSION+1}));
    expect(()=>noteSchema('example')).toThrow('Newer');
    expect(JSON.parse(localStorage.getItem('darzi-khata-schema-example')!).schemaVersion).toBe(SCHEMA_VERSION+1);
  });
});
describe('garments and offline credit helpers',()=>{
  it.each(GARMENTS.map(g=>g.value))('validates independent %s measurement fields',type=>{
    const item=newItem(type);expect(()=>validateItems([item])).not.toThrow();
    expect(item.measurements).toEqual(defaultMeasurements(type));
  });
  it('computes mixed ladies garments with separate prices and quantities',()=>{
    const shirt={...newItem('ladies-shirt'),quantity:2,unitPrice:1200};
    const trouser={...newItem('ladies-trouser'),quantity:1,unitPrice:600};
    expect(itemsTotal([shirt,trouser])).toBe(3000);
    expect(()=>validateItems([{...shirt,measurements:{...shirt.measurements,bust:0}}])).toThrow();
  });
  it('keeps multi-item order data through migration',()=>{
    const item=newItem('kids');
    const old=legacy();const order={...old,items:[item],totalAmount:item.unitPrice};
    expect(migrateRegister([order]).orders[0].items).toEqual([item]);
  });
  it('handles empty credit and a meaningful six-month demo',()=>{
    expect(computeCreditScore([],now).enoughData).toBe(false);
    const credit=computeCreditScore(createFinancialDemo(now),now);
    expect(credit.factors).toHaveLength(6);expect(credit.score).toBeGreaterThan(0);
  });
  it('normalizes numbers and parses bilingual measurements',()=>{
    expect(normalizePakistaniPhone('0300 1234567')).toBe('923001234567');
    expect(parseVoiceMeasurements('length 40 chest 22 sleeve 23')).toMatchObject({kameezLambai:40,chhaati:22,bazu:23});
    expect(parseVoiceMeasurements('lambai chalees chaati baees bazu teis')).toMatchObject({kameezLambai:40,chhaati:22,bazu:23});
  });
});
describe('optional local PIN privacy lock',()=>{
  it('stores a randomly salted SHA-256 hash, never plaintext',async()=>{
    const a=await createPinLock('1234'),b=await createPinLock('1234');
    expect(a.hash).toHaveLength(64);expect(a.hash).not.toBe(b.hash);
    expect(JSON.stringify(a)).not.toContain('"1234"');
    expect(await verifyPin(a,'1234')).toBe(true);expect(await verifyPin(a,'5678')).toBe(false);
  });
  it('locks after five wrong attempts and resets after thirty seconds',async()=>{
    let lock=await createPinLock('2468');
    for(let i=0;i<5;i++)lock=attemptResult(lock,false,1000).lock;
    expect(lock.lockedUntil).toBe(31000);
    expect(attemptResult(lock,true,1001).unlocked).toBe(false);
    expect(attemptResult(lock,true,31001).unlocked).toBe(true);
    expect(attemptResult(lock,false,31001).lock.failures).toBe(1);
  });
  it('migrates owned legacy PINs and keeps the old PIN usable',async()=>{
    localStorage.setItem('darzi-khata-legacy-claimed','"owner"');
    for(const key of ['darzi-khata-settings-owner','darzi-khata-settings'])
      localStorage.setItem(key,JSON.stringify({shopName:'Preserved shop',pin:'9876',darkMode:true}));
    await migrateLegacyPin('owner');
    expect(await unlockPin('owner','9876')).toBe(true);
    expect(localStorage.getItem('darzi-khata-settings-owner')).not.toContain('9876');
    expect(localStorage.getItem('darzi-khata-settings')).not.toContain('9876');
    expect(JSON.parse(localStorage.getItem('darzi-khata-settings-owner')!)).toMatchObject({shopName:'Preserved shop',darkMode:true});
    expect(localStorage.getItem(pinKey('owner'))).toBeTruthy();
  });
});
describe('IndexedDB fabric photo isolation',()=>{
  it('imports compressed bytes in target scope without touching original namespace',async()=>{
    const data='data:image/jpeg;base64,'+Buffer.from([255,216,255,217]).toString('base64');
    const real=await importPhotos([{id:'old-photo',data}],'real-shop');
    const demo=await importPhotos([{id:'old-photo',data}],'financial-demo-real-shop');
    expect(real.get('old-photo')).not.toBe(demo.get('old-photo'));
    expect((await getFabricPhoto(real.get('old-photo')!))?.size).toBe(4);
    await clearPhotos('financial-demo-real-shop');
    expect(await getFabricPhoto(demo.get('old-photo')!)).toBeUndefined();
    expect(await getFabricPhoto(real.get('old-photo')!)).toBeDefined();
  });
  it('rejects oversized and non-image payloads before storage',async()=>{
    await expect(importPhotos([{id:'bad',data:'data:text/html;base64,PGh0bWw+'}],'shop')).rejects.toThrow();
    await expect(importPhotos([{id:'big',data:'data:image/jpeg;base64,'+Buffer.alloc(200001).toString('base64')}],'shop')).rejects.toThrow();
  });
});
describe('safe backup and recovery',()=>{
  it('restores old JSON backups, migrates customers and repairs serial counter',async()=>{
    const order={...legacy(),serialNumber:'DK-789'};
    localStorage.setItem('darzi-khata-serial-test-shop','2');
    await restoreBackup({orders:[order],settings:{shopName:'Restored shop',pin:'1234',pinHash:'private-hash',pinSalt:'private-salt'},templates:[],karigars:['Existing worker']},'test-shop');
    expect(JSON.parse(localStorage.getItem('darzi-khata-orders-test-shop')!)[0].customerId).toBeTruthy();
    expect(JSON.parse(localStorage.getItem('darzi-khata-customers-test-shop')!)).toHaveLength(1);
    expect(localStorage.getItem('darzi-khata-serial-test-shop')).toBe('789');
    expect(localStorage.getItem('darzi-khata-settings-test-shop')).not.toContain('1234');
    expect(localStorage.getItem('darzi-khata-settings-test-shop')).not.toContain('private-');
    expect(localStorage.getItem('darzi-khata-karigars-test-shop')).toContain('Existing worker');
  });
  it('rejects corrupt payment or garment data without replacing saved orders',async()=>{
    localStorage.setItem('darzi-khata-orders-protected','["original"]');
    await expect(restoreBackup({orders:[{...legacy(),advanceAmount:999999}]},'protected')).rejects.toThrow();
    expect(localStorage.getItem('darzi-khata-orders-protected')).toBe('["original"]');
    expect(()=>validateBackup({orders:[{...legacy(),items:[{...newItem(),unitPrice:999999}]}]})).toThrow();
  });
  it('rejects a backup missing its referenced fabric photo',()=>{
    expect(()=>validateBackup({orders:[{...legacy(),fabricPhotoId:'missing'}]})).toThrow('missing fabric');
  });
  it('rolls back an entire register batch if storage quota is exceeded',()=>{
    localStorage.setItem('one','"original-one"');localStorage.setItem('two','"original-two"');
    const original=localStorage.setItem.bind(localStorage);
    let failed=false;
    localStorage.setItem=(key,value)=>{
      if(key==='two'&&!failed){failed=true;throw new DOMException('quota','QuotaExceededError');}
      original(key,value);
    };
    expect(()=>writeStorageBatch([['one','updated'],['two','updated']])).toThrow();
    expect(localStorage.getItem('one')).toBe('"original-one"');expect(localStorage.getItem('two')).toBe('"original-two"');
  });
});
