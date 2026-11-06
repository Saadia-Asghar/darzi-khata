import { SCHEMA_VERSION } from './migrations';
// Preserve historical array/object formats. Versioning is additive, never an
// in-place destructive conversion; old source keys remain available for recovery.
export const storage = {
  getItem(key: string) { return globalThis.localStorage.getItem(key); },
  setItem(key: string, value: string) { globalThis.localStorage.setItem(key, value); },
  removeItem(key: string) { globalThis.localStorage.removeItem(key); },
};
export function readJSON<T>(key: string, fallback: T): T {
  const raw = storage.getItem(key);
  if (raw === null) return fallback;
  try { return JSON.parse(raw) as T; }
  catch { throw new Error(`Saved data cannot be read; original retained / محفوظ ڈیٹا برقرار ہے (${key})`); }
}
export function noteSchema(scope: string) {
  const key = `darzi-khata-schema-${scope}`;
  const previous = readJSON<{ schemaVersion: number } | null>(key, null);
  if (previous && previous.schemaVersion > SCHEMA_VERSION) throw new Error('Newer khata format. Update this app before editing / پہلے ایپ اپ ڈیٹ کریں');
  storage.setItem(key, JSON.stringify({ schemaVersion: SCHEMA_VERSION }));
}
