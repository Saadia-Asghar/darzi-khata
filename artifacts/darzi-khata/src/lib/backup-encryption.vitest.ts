import { beforeEach, describe, expect, it, vi } from 'vitest';
import 'fake-indexeddb/auto';
import { encryptBackup, decryptBackup, isEncryptedBackup, validateEncryptedBackup } from './backup-encryption';
import { restoreBackup, stripSecrets, validateBackup } from './backup';
import { createFinancialDemo } from './demo-data';
import { SCHEMA_VERSION, migrateRegister } from './migrations';
import { getFabricPhoto } from './photos';

const passphrase = 'a unique backup phrase درزی';
const fixture = () => {
  const migrated = migrateRegister([{ ...createFinancialDemo(new Date('2026-11-06T09:00:00Z'))[0], serialNumber: 'DK-789', fabricPhotoId: 'photo' }]);
  migrated.customers[0].notes = 'Keep the saved measurement profile';
  return ({
  schemaVersion: SCHEMA_VERSION,
  ...migrated,
  photos: [{ id: 'photo', data: 'data:image/jpeg;base64,/9j/2Q==' }],
  settings: { shopName: 'خیاط Tailor', language: 'ur', darkMode: true, passwordHash: 'private-account', pinHash: 'private-pin', pinSalt: 'private-salt' },
  templates: [{ id: 'template', name: 'بچوں کا ناپ', measurements: { chest: 20 }, createdAt: '2026-11-06' }],
  karigars: ['کاریگر'],
  });
};
beforeEach(() => {
  const data = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => data.set(key, String(value)),
    removeItem: (key: string) => data.delete(key),
  });
  vi.stubGlobal('window', new EventTarget());
});
describe('optional authenticated backup encryption', () => {
  it('round trips bilingual records, photos, settings, templates and team through the existing restore/migration path', async () => {
    const original = fixture();
    const encrypted = await encryptBackup(original, passphrase);
    expect(isEncryptedBackup(encrypted)).toBe(true);
    expect(JSON.stringify(encrypted)).not.toContain('Tailor');
    expect(JSON.stringify(encrypted)).not.toContain(original.orders[0].customerName);
    const decoded = await decryptBackup(JSON.parse(JSON.stringify(encrypted)), passphrase);
    expect(decoded).toEqual(validateBackup(stripSecrets(original)));
    await restoreBackup(decoded, 'encrypted-roundtrip');
    const orders = JSON.parse(localStorage.getItem('darzi-khata-orders-encrypted-roundtrip')!);
    expect(orders[0].serialNumber).toBe('DK-789');
    expect(orders[0].payments).toEqual(original.orders[0].payments);
    expect(orders[0].measurements).toEqual(original.orders[0].measurements);
    expect(JSON.parse(localStorage.getItem('darzi-khata-customers-encrypted-roundtrip')!)).toEqual(original.customers);
    expect(localStorage.getItem('darzi-khata-serial-encrypted-roundtrip')).toBe('789');
    expect(await getFabricPhoto(orders[0].fabricPhotoId)).toBeDefined();
    expect(JSON.parse(localStorage.getItem('darzi-khata-templates-encrypted-roundtrip')!)).toEqual(original.templates);
    expect(JSON.parse(localStorage.getItem('darzi-khata-karigars-encrypted-roundtrip')!)).toEqual(original.karigars);
    expect(localStorage.getItem('darzi-khata-settings-encrypted-roundtrip')).not.toContain('private-');
    expect(original.settings.pinHash).toBe('private-pin');
  });
  it('never mutates stored data on a wrong passphrase or damaged authentication tag', async () => {
    localStorage.setItem('darzi-khata-orders-protected', '["original"]');
    const encrypted = await encryptBackup(fixture(), passphrase);
    await expect(decryptBackup(encrypted, 'a completely wrong phrase')).rejects.toThrow('wrong passphrase or damaged file');
    const bytes = Uint8Array.from(atob(encrypted.ciphertext), c => c.charCodeAt(0));
    bytes[bytes.length - 1] ^= 1;
    const damaged = { ...encrypted, ciphertext: btoa(String.fromCharCode(...bytes)) };
    await expect(decryptBackup(damaged, passphrase)).rejects.toThrow('wrong passphrase or damaged file');
    expect(localStorage.getItem('darzi-khata-orders-protected')).toBe('["original"]');
    expect(await decryptBackup(encrypted, passphrase)).toBeDefined();
  });
  it('generates new salt and IV on every export', async () => {
    const a = await encryptBackup({ orders: [] }, passphrase);
    const b = await encryptBackup({ orders: [] }, passphrase);
    expect(a.salt).not.toBe(b.salt);
    expect(a.iv).not.toBe(b.iv);
    expect(a.ciphertext).not.toBe(b.ciphertext);
  });
  it('authenticates changes to salt, IV and encrypted content', async () => {
    const file = await encryptBackup({ orders: [] }, passphrase);
    for (const field of ['salt', 'iv', 'ciphertext'] as const) {
      const value = file[field];
      const changed = (value[0] === 'A' ? 'B' : 'A') + value.slice(1);
      await expect(decryptBackup({ ...file, [field]: changed }, passphrase)).rejects.toThrow('wrong passphrase or damaged file');
    }
  });
  it('rejects unsupported metadata, missing fields, malformed base64 and truncation before deriving a key', async () => {
    const file = await encryptBackup({ orders: [] }, passphrase);
    for (const changes of [
      { version: 2 }, { cipher: 'AES-CBC' }, { kdf: 'unknown' }, { iterations: 1_000_000_000 },
      { salt: '' }, { iv: 'abcd' }, { ciphertext: file.ciphertext.slice(0, -4) },
      { ciphertext: '@@@@' }, { ciphertext: 'AAAA====' },
    ]) {
      if ('ciphertext' in changes && changes.ciphertext === file.ciphertext.slice(0, -4)) {
        await expect(decryptBackup({ ...file, ...changes }, passphrase)).rejects.toThrow();
      } else {
        expect(() => validateEncryptedBackup({ ...file, ...changes })).toThrow('Damaged or unsupported');
      }
    }
    expect(() => validateEncryptedBackup(null)).toThrow();
  });
  it('keeps legacy plain JSON validation and restoration compatible', async () => {
    const legacy = { orders: fixture().orders.map(({ fabricPhotoId: _, ...order }) => order) };
    expect(isEncryptedBackup(legacy)).toBe(false);
    await restoreBackup(JSON.parse(JSON.stringify(legacy)), 'legacy');
    expect(JSON.parse(localStorage.getItem('darzi-khata-orders-legacy')!)).toHaveLength(1);
  });
  it('filters passwords and PIN hashes recursively without mutating the source', async () => {
    const raw = { orders: [], settings: { shopName: 'Safe', nested: { PIN: '1234', PasswordHash: 'hash-secret' } },
      customers: [], password: 'account-password', pinHash: 'pin-secret' };
    const safe = stripSecrets(raw);
    expect(JSON.stringify(safe)).not.toMatch(/1234|hash-secret|account-password|pin-secret/);
    const decoded = await decryptBackup(await encryptBackup(raw, passphrase), passphrase);
    expect(JSON.stringify(decoded)).not.toMatch(/1234|hash-secret|account-password|pin-secret/);
    expect(raw.password).toBe('account-password');
  });
  it('requires a strong export passphrase and explicitly fails if Web Crypto is unavailable', async () => {
    await expect(encryptBackup({ orders: [] }, 'short')).rejects.toThrow('at least 12');
    const file = await encryptBackup({ orders: [] }, passphrase);
    await expect(decryptBackup(file, '')).rejects.toThrow('Enter the backup passphrase');
    const crypto = globalThis.crypto;
    vi.stubGlobal('crypto', {});
    try { await expect(encryptBackup({ orders: [] }, passphrase)).rejects.toThrow('Encryption is unavailable'); }
    finally { vi.stubGlobal('crypto', crypto); }
  });
  it('rejects unsupported inner schemas and invalid business data on export', async () => {
    await expect(encryptBackup({ schemaVersion: SCHEMA_VERSION + 1, orders: [] }, passphrase)).rejects.toThrow('newer app version');
    await expect(encryptBackup({ orders: [{}] }, passphrase)).rejects.toThrow();
  });
});
