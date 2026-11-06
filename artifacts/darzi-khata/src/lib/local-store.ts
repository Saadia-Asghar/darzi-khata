import { useCallback, useMemo, useSyncExternalStore } from 'react';
import { storage as localStorage } from './storage';
const EVENT = 'darzi-khata-local-update';
export function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}
export function notifyStorage(key: string) {
  window.dispatchEvent(new CustomEvent(EVENT, { detail: key }));
}
export function writeStorage(key: string, value: unknown) {
  // Do not swallow quota errors: callers must know their data was not persisted.
  localStorage.setItem(key, JSON.stringify(value));
  notifyStorage(key);
}
export function writeStorageBatch(entries: [string,unknown][]) {
  const next = entries.map(([key,value])=>({key,raw:JSON.stringify(value),previous:localStorage.getItem(key)}));
  try {
    for(const entry of next)localStorage.setItem(entry.key,entry.raw);
  } catch(error) {
    // Free the entire partial batch before restoring it, so quota cannot prevent
    // recovery of the exact previous register. Never notify readers halfway.
    for(const entry of next)localStorage.removeItem(entry.key);
    for(const entry of next)if(entry.previous!==null)localStorage.setItem(entry.key,entry.previous);
    throw error;
  }
  for(const entry of next)notifyStorage(entry.key);
}
export function removeStorage(key: string) {
  localStorage.removeItem(key);
  notifyStorage(key);
}
export function useStoredValue<T>(key: string, fallback: T): T {
  const subscribe = useCallback((listener: () => void) => {
    const handler = () => listener();
    window.addEventListener(EVENT, handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener(EVENT, handler);
      window.removeEventListener('storage', handler);
    };
  }, []);
  const snapshot = useSyncExternalStore(subscribe, () => localStorage.getItem(key), () => null);
  return useMemo(() => {
    const value = snapshot === null ? structuredClone(fallback) : JSON.parse(snapshot) as T;
    return import.meta.env.DEV ? deepFreeze(value) : value;
  }, [snapshot, fallback]);
}

// Transfer the pre-account register together, regardless of which hook mounts first.
// Source keys are retained as a recoverable backup. Never assign them to demo accounts.
export function claimLegacyShop(ownerId: string) {
  if (ownerId === 'demo-account' || localStorage.getItem('darzi-khata-legacy-claimed')) return;
  if (!localStorage.getItem('darzi-khata-orders')) return;
  const pairs = [
    ['darzi-khata-orders', `darzi-khata-orders-${ownerId}`],
    ['darzi-khata-settings', `darzi-khata-settings-${ownerId}`],
    ['darzi-khata-templates', `darzi-khata-templates-${ownerId}`],
    ['darzi-khata-karigars', `darzi-khata-karigars-${ownerId}`],
    ['darzi-khata-serial-counter', `darzi-khata-serial-${ownerId}`],
  ];
  // Parse all inputs before any writes, so corrupt legacy data never gets replaced.
  const entries = pairs.map(([from, to]) => ({ to, raw: localStorage.getItem(from) }))
    .filter(({ to, raw }) => raw !== null && localStorage.getItem(to) === null)
    .map(({ to, raw }) => ({ to, value: JSON.parse(raw!) }));
  for (const { to, value } of entries) writeStorage(to, value);
  writeStorage('darzi-khata-legacy-claimed', ownerId);
}
