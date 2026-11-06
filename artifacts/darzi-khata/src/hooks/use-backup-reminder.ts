import { useStoredValue, writeStorage } from '../lib/local-store';
import {
  backupReminderKey, defaultBackupReminder, readBackupReminder, backupReminderDue,
  type BackupReminderState,
} from '../lib/backup-reminder';
import { usePhotoScope } from '../components/fabric-photo';

export function useBackupReminder() {
  const scope = usePhotoScope();
  const state = useStoredValue<BackupReminderState>(backupReminderKey(scope), defaultBackupReminder);
  const update = (patch: Partial<BackupReminderState>) =>
    writeStorage(backupReminderKey(scope), { ...readBackupReminder(scope), ...patch });
  return {
    state, due: backupReminderDue(state),
    setEnabled: (enabled: boolean) => update({ enabled, dismissed: false }),
    dismiss: () => update({ dismissed: true }),
  };
}
