import { expect, it } from 'vitest';
import { hashPassword, verifyPassword } from './password';
import { deepFreeze } from './local-store';

it('uses independent salts, rejects wrong passwords, and reads legacy hashes', async () => {
  const first = await hashPassword('test-password');
  const second = await hashPassword('test-password');
  expect(first).not.toBe(second);
  expect(first).toMatch(/^pbkdf2:210000:[a-f0-9]{32}:[a-f0-9]{64}$/);
  expect(first).not.toContain('test-password');
  expect(await verifyPassword('test-password', first)).toBe(true);
  expect(await verifyPassword('wrong-password', first)).toBe(false);
  const legacy = [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode('old-password')))].map(b => b.toString(16).padStart(2, '0')).join('');
  expect(await verifyPassword('old-password', legacy)).toBe(true);
  expect(await verifyPassword('wrong', legacy)).toBe(false);
  expect(await verifyPassword('test', 'bad')).toBe(false);
});
it('development storage guard rejects mutations recursively', () => {
  const data = deepFreeze([{ profiles: [{ measurements: { shoulder: 18 } }] }]);
  expect(() => { data[0].profiles[0].measurements.shoulder = 99; }).toThrow();
  expect(() => { data.push({ profiles: [] }); }).toThrow();
});
