import { stripSecrets, validateBackup, type ParsedBackup } from './backup';
import { bi } from './i18n';

// The envelope version is independent of the existing business-data schema.
const FORMAT = 'darzi-khata-encrypted-backup';
const ITERATIONS = 600_000;
const MAX_FILE_BYTES = 100 * 1024 * 1024;
const HEADER = { format: FORMAT, version: 1, cipher: 'AES-256-GCM', kdf: 'PBKDF2-SHA-256', iterations: ITERATIONS } as const;
export interface EncryptedBackup {
  format: typeof FORMAT;
  version: 1;
  cipher: 'AES-256-GCM';
  kdf: 'PBKDF2-SHA-256';
  iterations: number;
  salt: string;
  iv: string;
  ciphertext: string;
}
const encoder = new TextEncoder();
const aad = () => encoder.encode(JSON.stringify(HEADER));

function webCrypto() {
  if (!globalThis.crypto?.subtle) throw new Error(bi('backup_crypto_unavailable'));
  return globalThis.crypto;
}
function toBase64(bytes: Uint8Array): string {
  const chunks: string[] = [];
  for (let i = 0; i < bytes.length; i += 8192) chunks.push(String.fromCharCode(...bytes.subarray(i, i + 8192)));
  return btoa(chunks.join(''));
}
function fromBase64(value: unknown): Uint8Array<ArrayBuffer> {
  if (typeof value !== 'string' || !value.length || value.length > MAX_FILE_BYTES
    || value.length % 4 !== 0 || !/^[A-Za-z0-9+/]*={0,2}$/.test(value)) {
    throw new Error(bi('backup_envelope_invalid'));
  }
  try {
    const bytes = Uint8Array.from(atob(value), c => c.charCodeAt(0));
    if (toBase64(bytes) !== value) throw new Error();
    return bytes;
  } catch { throw new Error(bi('backup_envelope_invalid')); }
}
export function isEncryptedBackup(raw: unknown): boolean {
  return !!raw && typeof raw === 'object' && 'format' in raw && raw.format === FORMAT;
}
export function validateEncryptedBackup(raw: unknown): EncryptedBackup {
  if (!isEncryptedBackup(raw)) throw new Error(bi('backup_envelope_invalid'));
  const data = raw as EncryptedBackup;
  for (const [key, value] of Object.entries(HEADER)) {
    if (data[key as keyof typeof HEADER] !== value) throw new Error(bi('backup_envelope_invalid'));
  }
  // Fixed work factor prevents an untrusted file from requesting unbounded PBKDF2 work.
  if (fromBase64(data.salt).length !== 16 || fromBase64(data.iv).length !== 12
    || fromBase64(data.ciphertext).length < 17) throw new Error(bi('backup_envelope_invalid'));
  return data;
}
async function deriveKey(passphrase: string, salt: Uint8Array<ArrayBuffer>, usage: 'encrypt' | 'decrypt') {
  if (!passphrase.length) throw new Error(bi('backup_passphrase_required'));
  const subtle = webCrypto().subtle;
  const material = await subtle.importKey('raw', encoder.encode(passphrase), 'PBKDF2', false, ['deriveKey']);
  return subtle.deriveKey({ name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' },
    material, { name: 'AES-GCM', length: 256 }, false, [usage]);
}
export async function encryptBackup(raw: unknown, passphrase: string): Promise<EncryptedBackup> {
  if (passphrase.length < 12) throw new Error(bi('backup_passphrase_length'));
  validateBackup(raw);
  const crypto = webCrypto();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passphrase, salt, 'encrypt');
  const bytes = await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: aad(), tagLength: 128 },
    key, encoder.encode(JSON.stringify(stripSecrets(raw))));
  const result = { ...HEADER, salt: toBase64(salt), iv: toBase64(iv), ciphertext: toBase64(new Uint8Array(bytes)) };
  if (JSON.stringify(result).length > MAX_FILE_BYTES) throw new Error(bi('backup_must_be_under_100_mb'));
  return result;
}
export async function decryptBackup(raw: unknown, passphrase: string): Promise<ParsedBackup> {
  const data = validateEncryptedBackup(raw);
  const key = await deriveKey(passphrase, fromBase64(data.salt), 'decrypt');
  let bytes: ArrayBuffer;
  try {
    bytes = await webCrypto().subtle.decrypt({
      name: 'AES-GCM', iv: fromBase64(data.iv), additionalData: aad(), tagLength: 128,
    }, key, fromBase64(data.ciphertext));
  } catch { throw new Error(bi('backup_cannot_unlock')); }
  let decoded: unknown;
  try { decoded = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)); }
  catch { throw new Error(bi('backup_envelope_invalid')); }
  return validateBackup(stripSecrets(decoded));
}
