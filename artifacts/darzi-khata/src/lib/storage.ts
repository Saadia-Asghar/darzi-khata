import { bi } from './i18n';
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
  catch { throw new Error(bi('m_saved_data_cannot_be_read_original_retai', { key })); }
}
export function noteSchema(scope: string) {
  const key = `darzi-khata-schema-${scope}`;
  const previous = readJSON<{ schemaVersion: number } | null>(key, null);
  if (previous && previous.schemaVersion > SCHEMA_VERSION) throw new Error(bi('m_newer_khata_format_update_this_app_befor'));
  storage.setItem(key, JSON.stringify({ schemaVersion: SCHEMA_VERSION }));
}
