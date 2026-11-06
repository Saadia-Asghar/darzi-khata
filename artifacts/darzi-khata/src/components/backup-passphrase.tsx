import { useState } from 'react';
import { usePreferences } from '../hooks/use-preferences';

/** Mounted only for a single operation; never persisted to settings or browser storage. */
export function BackupPassphrase({ exporting, busy, onSubmit, onCancel }: {
  exporting: boolean;
  busy: boolean;
  onSubmit: (passphrase: string) => Promise<void>;
  onCancel: () => void;
}) {
  const { label } = usePreferences();
  const [passphrase, setPassphrase] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  return (
    <form className="mt-3 space-y-3 rounded-lg border border-border p-3" onSubmit={async e => {
      e.preventDefault();
      if (busy) return;
      setError('');
      if (exporting && passphrase.length < 12) { setError(label('backup_passphrase_length')); return; }
      if (exporting && passphrase !== confirmation) { setError(label('backup_passphrase_mismatch')); return; }
      const value = passphrase;
      setPassphrase('');
      setConfirmation('');
      try { await onSubmit(value); }
      catch (err) { setError(err instanceof Error ? err.message : label('invalid_backup_file')); }
    }} data-testid="backup-passphrase-form">
      <p className="font-bold text-sm">{label(exporting ? 'backup_export_encrypted' : 'backup_unlock')}</p>
      <p className="text-sm text-muted-foreground" id="backup-passphrase-help">
        {label(exporting ? 'backup_passphrase_warning' : 'backup_unlock_help')}
      </p>
      <label className="block text-sm" htmlFor="backup-passphrase">{label('backup_passphrase')}</label>
      <input id="backup-passphrase" type="password" autoComplete={exporting ? 'new-password' : 'off'}
        value={passphrase} onChange={e => setPassphrase(e.target.value)} required disabled={busy}
        aria-describedby="backup-passphrase-help" autoCapitalize="none" spellCheck={false}
        className="w-full min-h-[44px] bg-muted border border-input rounded-lg px-3" data-testid="input-backup-passphrase" />
      {exporting && <>
        <label className="block text-sm" htmlFor="backup-confirm-passphrase">{label('backup_confirm_passphrase')}</label>
        <input id="backup-confirm-passphrase" type="password" autoComplete="new-password" required disabled={busy}
          value={confirmation} onChange={e => setConfirmation(e.target.value)} autoCapitalize="none" spellCheck={false}
          className="w-full min-h-[44px] bg-muted border border-input rounded-lg px-3" data-testid="input-backup-confirm" />
      </>}
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={busy} className="min-h-[44px] rounded-lg bg-primary text-primary-foreground px-3 disabled:opacity-60" data-testid="btn-submit-passphrase">
          {label(busy ? 'backup_processing' : exporting ? 'backup_export_encrypted' : 'backup_unlock')}
        </button>
        <button type="button" onClick={onCancel} className="min-h-[44px] rounded-lg border border-border px-3" data-testid="btn-cancel-passphrase">{label('cancel_x')}</button>
      </div>
    </form>
  );
}
