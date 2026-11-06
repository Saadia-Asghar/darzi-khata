import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  backupReminderDue, backupReminderKey, confirmedBackupState, readBackupReminder, registerSnapshot,
} from './backup-reminder';
import { requestBackupDownload, restoreBackup } from './backup';
import { writeStorage, writeStorageBatch } from './local-store';
import { encryptBackup, isEncryptedBackup } from './backup-encryption';

const scope = 'shop-a';
const ordersKey = `darzi-khata-orders-${scope}`;
const savedAt = '2026-11-06T09:00:00.000Z';
beforeEach(() => {
  const data = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => data.set(key, String(value)),
    removeItem: (key: string) => data.delete(key),
  });
  vi.stubGlobal('window', new EventTarget());
});
const enable = (s = scope) => writeStorage(backupReminderKey(s), { ...readBackupReminder(s), enabled: true });
const confirm = (snapshot = registerSnapshot(scope)) =>
  writeStorage(backupReminderKey(scope), confirmedBackupState(scope, snapshot, savedAt));

describe('local optional backup reminder', () => {
  it('is opt-in, with no invented previous backup date', () => {
    writeStorage(ordersKey, [{ id: 'one' }]);
    expect(backupReminderDue(readBackupReminder(scope))).toBe(false);
    enable();
    expect(backupReminderDue(readBackupReminder(scope))).toBe(true);
    expect(readBackupReminder(scope).lastSuccessfulBackupAt).toBeNull();
  });
  it('clears only on confirmation and returns on actual changes, not identical writes', () => {
    enable();
    writeStorage(ordersKey, [{ id: 'one' }]);
    confirm();
    expect(backupReminderDue(readBackupReminder(scope))).toBe(false);
    writeStorage(ordersKey, [{ id: 'one' }]);
    expect(backupReminderDue(readBackupReminder(scope))).toBe(false);
    writeStorage(ordersKey, []);
    expect(backupReminderDue(readBackupReminder(scope))).toBe(true);
    expect(readBackupReminder(scope).lastSuccessfulBackupAt).toBe(savedAt);
  });
  it.each(['orders', 'customers', 'settings', 'templates', 'karigars'])('detects %s changes', name => {
    enable(); confirm();
    writeStorage(`darzi-khata-${name}-${scope}`, [{ changed: true }]);
    expect(backupReminderDue(readBackupReminder(scope))).toBe(true);
  });
  it('persists dismissal until the next register change and supports disabling', () => {
    enable();
    writeStorage(backupReminderKey(scope), { ...readBackupReminder(scope), dismissed: true });
    expect(backupReminderDue(readBackupReminder(scope))).toBe(false);
    writeStorage(ordersKey, []);
    expect(backupReminderDue(readBackupReminder(scope))).toBe(true);
    writeStorage(backupReminderKey(scope), { ...readBackupReminder(scope), enabled: false });
    writeStorage(ordersKey, [{ id: 'one' }]);
    expect(backupReminderDue(readBackupReminder(scope))).toBe(false);
  });
  it('isolates shops and financial demo registers', () => {
    enable(); confirm();
    for (const other of ['shop-b', 'financial-demo-shop-a']) {
      writeStorage(`darzi-khata-orders-${other}`, [{ id: 'other' }]);
      expect(readBackupReminder(other).lastSuccessfulBackupAt).toBeNull();
    }
    expect(readBackupReminder(scope).changed).toBe(false);
  });
  it('ignores language, theme, font and paper preferences but tracks business settings', () => {
    const key = `darzi-khata-settings-${scope}`;
    writeStorage(key, { shopName: 'Test shop', language: 'en', darkMode: false });
    enable(); confirm();
    const snapshot = registerSnapshot(scope);
    writeStorage(key, { shopName: 'Test shop', language: 'ur', darkMode: true, fontSize: 'large', paperSize: '58' });
    expect(backupReminderDue(readBackupReminder(scope))).toBe(false);
    expect(registerSnapshot(scope)).toBe(snapshot);
    confirm(snapshot);
    expect(readBackupReminder(scope).changed).toBe(false);
    writeStorage(key, { shopName: 'New shop name', language: 'ur' });
    expect(backupReminderDue(readBackupReminder(scope))).toBe(true);
  });
  it('does not count edits made during or after an export as backed up', async () => {
    enable();
    const pending = await requestBackupDownload(scope, async () => {
      writeStorage(ordersKey, [{ id: 'during' }]);
      return {};
    }, () => true, () => {});
    confirm(pending!.snapshot);
    expect(readBackupReminder(scope).changed).toBe(true);
  });
  it('rolls reminder metadata and register data back together on quota failure', () => {
    writeStorage(ordersKey, []);
    enable(); confirm();
    const before = localStorage.getItem(backupReminderKey(scope));
    const setItem = localStorage.setItem.bind(localStorage);
    let fail = true;
    vi.spyOn(localStorage, 'setItem').mockImplementation((key, value) => {
      if (key === backupReminderKey(scope) && fail) { fail = false; throw new Error('quota'); }
      return setItem(key, value);
    });
    expect(() => writeStorageBatch([[ordersKey, [{ id: 'lost' }]]])).toThrow('quota');
    expect(localStorage.getItem(ordersKey)).toBe('[]');
    expect(localStorage.getItem(backupReminderKey(scope))).toBe(before);
  });
});

describe('export success boundary', () => {
  it.each(['plain', 'encrypted'])('never counts a %s download request or cancelled save as a saved backup', async kind => {
    enable();
    const download = vi.fn();
    const passphrase = 'a private backup phrase';
    const pending = await requestBackupDownload(scope, async () => kind === 'encrypted'
      ? encryptBackup({ orders: [] }, passphrase) : { orders: [] }, () => true, download);
    expect(pending).not.toBeNull();
    expect(download).toHaveBeenCalledOnce();
    expect(isEncryptedBackup(download.mock.calls[0][0])).toBe(kind === 'encrypted');
    // Owner cancels / closes the confirmation instead of saving.
    expect(readBackupReminder(scope).lastSuccessfulBackupAt).toBeNull();
    expect(backupReminderDue(readBackupReminder(scope))).toBe(true);
    confirm(pending!.snapshot);
    expect(readBackupReminder(scope).lastSuccessfulBackupAt).toBe(savedAt);
    expect(readBackupReminder(scope).changed).toBe(false);
    expect(Object.keys(readBackupReminder(scope)).sort()).toEqual(['changed', 'dismissed', 'enabled', 'lastSuccessfulBackupAt']);
    expect(localStorage.getItem(backupReminderKey(scope))).not.toContain(passphrase);
  });
  it('does not count photo/encryption failures or failed downloads', async () => {
    enable(); confirm();
    writeStorage(ordersKey, [{ id: 'new' }]);
    const before = localStorage.getItem(backupReminderKey(scope));
    const download = vi.fn();
    await expect(requestBackupDownload(scope, async () => { throw new Error('photo/encryption failed'); }, () => true, download)).rejects.toThrow();
    expect(download).not.toHaveBeenCalled();
    await expect(requestBackupDownload(scope, async () => ({}), () => true, () => { throw new Error('download failed'); })).rejects.toThrow();
    expect(localStorage.getItem(backupReminderKey(scope))).toBe(before);
  });
  it('does not download or record a cancelled in-flight export', async () => {
    enable();
    const download = vi.fn();
    expect(await requestBackupDownload(scope, async () => ({}), () => false, download)).toBeNull();
    expect(download).not.toHaveBeenCalled();
    expect(readBackupReminder(scope).lastSuccessfulBackupAt).toBeNull();
  });
  it('invalid restore does not affect the last successful backup', async () => {
    enable(); confirm();
    await expect(restoreBackup({ orders: 'bad' }, scope)).rejects.toThrow();
    expect(readBackupReminder(scope).lastSuccessfulBackupAt).toBe(savedAt);
    expect(readBackupReminder(scope).changed).toBe(false);
  });
});
