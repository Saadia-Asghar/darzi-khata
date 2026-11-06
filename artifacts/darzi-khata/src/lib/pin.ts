import { bi } from './i18n';
import { readJSON, storage } from './storage';
import { writeStorage } from './local-store';
export interface PinLock { salt: string; hash: string; enabled: boolean; failures: number; lockedUntil: number }
export const pinKey = (userId: string) => `darzi-khata-lock-${userId}`;
export function validPin(pin: string) { return /^\d{4,8}$/.test(pin); }
export async function hashPin(pin: string, salt: string) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${salt}:${pin}`));
  return [...new Uint8Array(bytes)].map(b=>b.toString(16).padStart(2,'0')).join('');
}
export async function createPinLock(pin: string): Promise<PinLock> {
  if (!validPin(pin)) throw new Error(bi('m_use_4_8_digits'));
  const salt = [...crypto.getRandomValues(new Uint8Array(16))].map(b=>b.toString(16).padStart(2,'0')).join('');
  return { salt, hash: await hashPin(pin,salt), enabled:true, failures:0, lockedUntil:0 };
}
export function attemptResult(lock: PinLock, correct: boolean, now = Date.now()) {
  if (lock.lockedUntil > now) return { lock, unlocked:false };
  if (correct) return { lock:{ ...lock, failures:0,lockedUntil:0 }, unlocked:true };
  const failures = (lock.lockedUntil && lock.lockedUntil <= now ? 0 : lock.failures) + 1;
  return { lock:{ ...lock,failures,lockedUntil:failures>=5 ? now+30000 : 0 },unlocked:false };
}
export async function verifyPin(lock: PinLock, pin: string) {
  const hash = await hashPin(pin,lock.salt);
  let difference = hash.length ^ lock.hash.length;
  for (let i=0;i<hash.length;i++) difference |= hash.charCodeAt(i) ^ (lock.hash.charCodeAt(i)||0);
  return difference===0;
}
export async function unlockPin(userId: string, pin: string) {
  const lock = readJSON<PinLock | null>(pinKey(userId),null);
  if (!lock?.enabled) return true;
  const result = attemptResult(lock, await verifyPin(lock,pin));
  writeStorage(pinKey(userId),result.lock);
  return result.unlocked;
}
export async function migrateLegacyPin(userId: string) {
  // Accounts retain their password login. PIN is an optional local privacy lock,
  // not encryption or a substitute for server-side authentication.
  const key = pinKey(userId);
  const sources = [`darzi-khata-settings-${userId}`];
  if (storage.getItem('darzi-khata-legacy-claimed') === JSON.stringify(userId)) sources.push('darzi-khata-settings');
  for (const settingsKey of sources) {
    const settings = readJSON<Record<string,unknown> | null>(settingsKey,null);
    if (!settings || settings.pin === undefined) continue;
    const pin = String(settings.pin);
    if (!validPin(pin)) throw new Error(bi('m_legacy_pin_format_needs_recovery'));
    if (!storage.getItem(key)) {
      const lock = await createPinLock(pin);
      lock.enabled = settings.pinEnabled !== false;
      writeStorage(key,lock);
    }
    if (validPin(pin)) {
      const { pin: _pin, pinEnabled: _enabled, ...safe } = settings;
      writeStorage(settingsKey,safe);
    }
  }
}
