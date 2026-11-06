const iterations = 210_000;
const hex = (bytes: ArrayBuffer | Uint8Array) => [...new Uint8Array(bytes)].map(b => b.toString(16).padStart(2, '0')).join('');
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations, hash: 'SHA-256' }, key, 256);
  return `pbkdf2:${iterations}:${hex(salt)}:${hex(bits)}`;
}
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  let candidate: string;
  if (/^[a-f0-9]{64}$/.test(stored)) {
    // Keep existing device-only accounts usable; rehash after successful login.
    candidate = hex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password)));
  } else {
    const [scheme, count, salt, hash] = stored.split(':');
    if (scheme !== 'pbkdf2' || !/^[a-f0-9]{32}$/.test(salt || '') || !/^[a-f0-9]{64}$/.test(hash || '') || Number(count) !== iterations) return false;
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
    candidate = hex(await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: Uint8Array.from(salt.match(/../g)!, h => parseInt(h, 16)), iterations, hash: 'SHA-256' }, key, 256));
    stored = hash;
  }
  let difference = candidate.length ^ stored.length;
  for (let i = 0; i < candidate.length; i++) difference |= candidate.charCodeAt(i) ^ (stored.charCodeAt(i) || 0);
  return difference === 0;
}
