import { readJSON, storage } from './storage';

export interface BackupReminderState {
  enabled: boolean;
  changed: boolean;
  dismissed: boolean;
  lastSuccessfulBackupAt: string | null;
}
export const backupReminderKey = (scope: string) => `darzi-khata-backup-reminder-${scope}`;
export const defaultBackupReminder: BackupReminderState = {
  enabled: false, changed: true, dismissed: false, lastSuccessfulBackupAt: null,
};
const registers = ['orders', 'customers', 'settings', 'templates', 'karigars'] as const;
function registerValue(name: string, value: unknown): unknown {
  if (name !== 'settings' || !value || typeof value !== 'object' || Array.isArray(value)) return value;
  // Display preferences do not change the shop's business register.
  const { language, fontSize, darkMode, paperSize, ...business } = value as Record<string, unknown>;
  return business;
}
function storedRegisterValue(name: string, scope: string) {
  const raw = storage.getItem(`darzi-khata-${name}-${scope}`);
  return raw === null ? null : registerValue(name, JSON.parse(raw));
}

export function readBackupReminder(scope: string) {
  return readJSON<BackupReminderState>(backupReminderKey(scope), defaultBackupReminder);
}
export function backupReminderDue(state: BackupReminderState) {
  return state.enabled && state.changed && !state.dismissed;
}
// Only an in-memory snapshot, never persisted or included in a downloaded backup.
export function registerSnapshot(scope: string) {
  return JSON.stringify(registers.map(name => storedRegisterValue(name, scope)));
}

/** Add reminder updates to the same atomic transaction as the register write. */
export function withBackupChanges(entries: [string, unknown][]): [string, unknown][] {
  const scopes = new Set<string>();
  for (const [key, value] of entries) {
    const match = /^darzi-khata-(orders|customers|settings|templates|karigars)-(.+)$/.exec(key);
    if (match && JSON.stringify(storedRegisterValue(match[1], match[2])) !== JSON.stringify(registerValue(match[1], value)))
      scopes.add(match[2]);
  }
  return [...entries, ...[...scopes].map((scope): [string, unknown] => [
    backupReminderKey(scope), { ...readBackupReminder(scope), changed: true, dismissed: false },
  ])];
}

/** Call only after a completed export AND the owner's explicit save confirmation. */
export function confirmedBackupState(scope: string, exportedSnapshot: string, exportedAt: string): BackupReminderState {
  return {
    ...readBackupReminder(scope),
    changed: registerSnapshot(scope) !== exportedSnapshot,
    dismissed: false,
    lastSuccessfulBackupAt: exportedAt,
  };
}
