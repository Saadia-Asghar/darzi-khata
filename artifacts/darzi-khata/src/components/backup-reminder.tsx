import { Download, X } from 'lucide-react';
import { useBackupReminder } from '../hooks/use-backup-reminder';
import { usePreferences } from '../hooks/use-preferences';

export function BackupReminder({ onBackup }: { onBackup: () => void }) {
  const { due, dismiss } = useBackupReminder();
  const { label } = usePreferences();
  if (!due) return null;
  return (
    <aside className="rounded-lg border border-border bg-warning-soft p-3 flex gap-2 items-start" aria-label={label('backup_reminder_title')} data-testid="backup-reminder">
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm">{label('backup_reminder_title')}</p>
        <p className="text-sm text-muted-foreground mt-1">{label('backup_reminder_changed')}</p>
        <button type="button" onClick={onBackup} className="min-h-[44px] mt-2 inline-flex items-center gap-2 text-primary font-semibold text-sm">
          <Download size={16} aria-hidden />{label('data_backup')}
        </button>
      </div>
      <button type="button" onClick={dismiss} aria-label={label('backup_reminder_dismiss')} className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-md hover:bg-muted">
        <X size={18} aria-hidden />
      </button>
    </aside>
  );
}
