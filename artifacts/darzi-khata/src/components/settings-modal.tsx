import { DICT } from '../lib/i18n';
import * as Dialog from './page-dialog';
import { X, Save, Download, Upload, Trash2, Scissors, Moon, Plus, UserX } from 'lucide-react';
import { useSettings, ShopSettings } from '../hooks/use-settings';
import { useTemplates } from '../hooks/use-templates';
import { useKarigars } from '../hooks/use-karigars';
import { useToast } from '@/hooks/use-toast';
import { useRef, useState, useEffect } from 'react';
import { Wallet, FlaskConical } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useDemoMode } from '../hooks/use-demo-mode';
import { SHOP_TYPES } from './shop-type';
import { Order } from '../types/order';
import { useCustomers } from '../hooks/use-customers';
import { usePreferences } from '../hooks/use-preferences';
import { PinSettings } from './app-lock';
import { exportPhotos, type PhotoBackup } from '../lib/photos';
import { validateBackup, restoreBackup, stripSecrets, requestBackupDownload, type PendingBackupSave, type ParsedBackup } from '../lib/backup';
import { backupReminderKey, confirmedBackupState } from '../lib/backup-reminder';
import { writeStorage } from '../lib/local-store';
import { useBackupReminder } from '../hooks/use-backup-reminder';
import { shortDate } from '../lib/i18n';
import { SCHEMA_VERSION } from '../lib/migrations';
import { usePhotoScope } from './fabric-photo';
import { Languages, Type } from 'lucide-react';
import { BackupPassphrase } from './backup-passphrase';
import { decryptBackup, encryptBackup, isEncryptedBackup, validateEncryptedBackup, type EncryptedBackup } from '../lib/backup-encryption';


interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orders: Order[];
  setAllOrders: (orders: Order[]) => void;
}

export function SettingsModal({ open, onOpenChange, orders }: SettingsModalProps) {
  const { settings, saveSettings } = useSettings();
  const { templates, deleteTemplate } = useTemplates();
  const { karigars, addKarigar, removeKarigar } = useKarigars();
  const { toast } = useToast();

  const [formData, setFormData] = useState<ShopSettings>(settings);
  const [newKarigarName, setNewKarigarName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { demoMode, setDemoMode, clearDemoData } = useDemoMode();
  const [clearOpen, setClearOpen] = useState(false);
  const { customers } = useCustomers();
  const { label, lang, urduFirst, fontSize, setLanguage, setFontSize, paperSize, setPaperSize } = usePreferences();
  const photoScope = usePhotoScope();
  const reminder = useBackupReminder();
  const [pendingSave, setPendingSave] = useState<PendingBackupSave | null>(null);
  const [pendingRestore, setPendingRestore] = useState<ParsedBackup | null>(null);
  const [busy, setBusy] = useState(false);
  const [protection, setProtection] = useState<'export' | EncryptedBackup | null>(null);
  const operation = useRef(0);
  const cancelProtection = () => {
    operation.current++;
    setProtection(null);
    setBusy(false);
  };
  useEffect(() => {
    setPendingSave(null);
    setProtection(null);
    setPendingRestore(null);
    setBusy(false);
    return () => { operation.current++; };
  }, [open, photoScope]);

  // Initialise form only when the dialog opens, so unrelated re-renders never wipe typed input.
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  useEffect(() => {
    if (open) setFormData(settingsRef.current);
  }, [open, demoMode]);
  useEffect(() => {
    if (open && window.location.hash === '#backup')
      document.getElementById('backup-settings')?.scrollIntoView({ block: 'start' });
  }, [open]);

  const handleChange = (field: keyof ShopSettings, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleToggleDark = () => {
    const next = { ...formData, language: settings.language, fontSize: settings.fontSize, darkMode: !formData.darkMode };
    setFormData(next);
    saveSettings(next);
    document.documentElement.classList.toggle('dark', next.darkMode);
  };

  const handleSave = () => {
    saveSettings({ ...formData, language: settings.language, fontSize: settings.fontSize, paperSize: settings.paperSize });
    toast({ title: label('settings_saved') });
    onOpenChange(false);
  };

  const handleExport = async (passphrase?: string) => {
    const token = ++operation.current;
    setPendingSave(null);
    setBusy(true);
    try {
      const completed = await requestBackupDownload(photoScope, async () => {
      let photos: PhotoBackup[];
      try { photos = await exportPhotos(orders.map((o) => o.fabricPhotoId).filter(Boolean) as string[]); }
      catch { throw new Error(label('backup_stopped_fabric_photo_unavailable')); }
      const backup = stripSecrets({ schemaVersion: SCHEMA_VERSION, orders, customers, photos, templates, karigars,
        settings: {...formData,language:settings.language,fontSize:settings.fontSize,paperSize:settings.paperSize}, exportedAt: new Date().toISOString() });
      const payload = passphrase === undefined ? backup : await encryptBackup(backup, passphrase);
      return payload;
      }, () => token === operation.current, (payload) => {
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      if (blob.size > 100 * 1024 * 1024) throw new Error(label('backup_must_be_under_100_mb'));
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      try {
        a.href = url;
        a.download = `darzi-khata-${passphrase === undefined ? 'backup' : 'encrypted-backup'}-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
      } finally { a.remove(); URL.revokeObjectURL(url); }
      });
      if (!completed) return;
      setProtection(null);
      setPendingSave(completed);
    } finally { if (token === operation.current) setBusy(false); }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const token = ++operation.current;
    setPendingSave(null);
    setProtection(null);
    setPendingRestore(null);
    if(file.size>100*1024*1024) { toast({title:label('backup_must_be_under_100_mb'),variant:'destructive'});return; }
    setBusy(true);
    try {
      const raw: unknown = JSON.parse(await file.text());
      if (token !== operation.current) return;
      if (isEncryptedBackup(raw)) setProtection(validateEncryptedBackup(raw));
      else setPendingRestore(validateBackup(raw));
    } catch (err) {
      if (token === operation.current) toast({ title: label('invalid_backup_file'), description: err instanceof Error ? err.message : undefined, variant: 'destructive' });
    } finally { if (token === operation.current) setBusy(false); }
  };

  const unlockBackup = async (passphrase: string) => {
    if (!protection || protection === 'export') return;
    const token = ++operation.current;
    setBusy(true);
    try {
      const data = await decryptBackup(protection, passphrase);
      if (token !== operation.current) return;
      setProtection(null);
      setPendingRestore(data);
    } finally { if (token === operation.current) setBusy(false); }
  };
  const runRestore = async () => {
    const data = pendingRestore;
    setPendingRestore(null);
    if (!data) return;
    setBusy(true);
    try {
      const count = await restoreBackup(data,photoScope);
      if(data.settings)setFormData({...settingsRef.current,...data.settings});
      toast({ title: label('data_restored'), description: label('t_n_orders_restored', { count }) });
    } catch (err) {
      toast({ title: label('restore_failed_previous_data_retained'), description: err instanceof Error ? err.message : undefined, variant: 'destructive' });
    } finally { setBusy(false); }
  };

  const handleAddKarigar = () => {
    if (!newKarigarName.trim()) return;
    addKarigar(newKarigarName.trim());
    setNewKarigarName('');
    toast({ title: label('karigar_added') });
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-foreground/60 z-50  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg bg-background p-0  outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 overflow-hidden max-h-[90vh] flex flex-col">

          <div className="px-5 py-4 border-b bg-card text-foreground border-border shrink-0 flex justify-between items-center">
            <div>
              <Dialog.Title className="text-lg font-bold">{label('shop_settings')}</Dialog.Title>
              <Dialog.Description className="text-muted-foreground text-sm mt-0.5">{label('saved_on_this_phone_only')}</Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button className="h-11 w-11 flex items-center justify-center rounded-full hover:bg-muted text-muted-foreground" aria-label={label('close')}>
                <X size={20} />
              </button>
            </Dialog.Close>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-5">

            {/* Language & font */}
            <section className="bg-card p-4 rounded-lg border border-card-border space-y-3">
              <div>
                <div className="flex items-center gap-2 text-sm font-bold mb-2"><Languages size={16} aria-hidden /> {label('language')}</div>
                <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label={label('language')}>
                  <button type="button" role="radio" aria-checked={urduFirst} onClick={() => { setLanguage('ur'); setFormData((p) => ({ ...p, language: 'ur' })); }} className={`min-h-[48px] rounded-lg border font-bold font-urdu ${urduFirst ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted border-border'}`} data-testid="btn-lang-ur" lang="ur">{label('urdu_first')}</button>
                  <button type="button" role="radio" aria-checked={!urduFirst} onClick={() => { setLanguage('en'); setFormData((p) => ({ ...p, language: 'en' })); }} className={`min-h-[48px] rounded-lg border font-bold ${!urduFirst ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted border-border'}`} data-testid="btn-lang-en">{label('english_first')}</button>
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 text-sm font-bold mb-2"><Type size={16} aria-hidden /> {label('text_size')}</div>
                <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label={label('text_size')}>
                  {(['normal', 'large'] as const).map((fs) => (
                    <button key={fs} type="button" role="radio" aria-checked={fontSize === fs} onClick={() => { setFontSize(fs); setFormData((p) => ({ ...p, fontSize: fs })); }} className={`min-h-[48px] rounded-lg border font-bold ${fs === 'large' ? 'text-lg' : 'text-sm'} ${fontSize === fs ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted border-border'}`} data-testid={`btn-font-${fs}`}>{fs === 'normal' ? label('normal') : label('large')}</button>
                  ))}
                </div>
              </div>
              <div className="mt-4">
                <div className="text-sm font-medium mb-2">{label('paper_size')}</div>
                <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label={label('paper_size')}>
                  {(['a4', '80', '58'] as const).map((p) => (
                    <button key={p} type="button" role="radio" aria-checked={paperSize === p} onClick={() => setPaperSize(p)} className={`min-h-[48px] rounded-md border text-sm font-medium ${paperSize === p ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted border-border'}`} data-testid={`btn-paper-${p}`}>{label(p === 'a4' ? 'paper_a4' : p === '80' ? 'paper_80' : 'paper_58')}</button>
                  ))}
                </div>
              </div>
            </section>

            <PinSettings />

            {/* Dark Mode */}
            <section className="bg-card p-4 rounded-lg border border-card-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Moon size={18} className={formData.darkMode ? 'text-warning' : 'text-muted-foreground'} />
                  <div>
                    <div className="font-bold text-foreground text-sm">{label('dark_mode')}</div>
                    <div className="text-sm text-muted-foreground">{label('easier_on_the_eyes_at_night')}</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleToggleDark}
                  className={`w-12 h-6 rounded-full relative transition-colors duration-200 ${formData.darkMode ? 'bg-primary' : 'bg-muted'}`}
                  data-testid="toggle-dark-mode"
                >
                  <span className={`block w-5 h-5 bg-card rounded-full absolute top-0.5 transition-transform duration-200  ${formData.darkMode ? 'translate-x-6' : 'translate-x-0.5'}`} />
                </button>
              </div>
            </section>

            {/* Shop Details */}
            <section className="bg-card p-4 rounded-lg border border-card-border space-y-3">
              <h3 className="font-bold text-foreground border-b border-border pb-2 text-sm  ">{label('shop_details')}</h3>
              <div>
                <label className="block text-sm font-semibold text-muted-foreground mb-1">{label('shop_name_english')}</label>
                <input value={formData.shopName} onChange={(e) => handleChange('shopName', e.target.value)} className="w-full bg-muted border border-input rounded-lg px-3 py-2 outline-none focus:border-primary text-sm font-bold text-foreground" data-testid="input-shop-name" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-muted-foreground mb-1">{label('shop_name_urdu')}</label>
                <input value={formData.shopNameUrdu} onChange={(e) => handleChange('shopNameUrdu', e.target.value)} className="w-full bg-muted border border-input rounded-lg px-3 py-2 outline-none focus:border-primary text-sm font-urdu text-right text-foreground" dir="rtl" lang="ur" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-muted-foreground mb-1">{label('address')}</label>
                <input value={formData.address} onChange={(e) => handleChange('address', e.target.value)} className="w-full bg-muted border border-input rounded-lg px-3 py-2 outline-none focus:border-primary text-sm text-foreground" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-muted-foreground mb-1">{label('phone')}</label>
                <input value={formData.phone} onChange={(e) => handleChange('phone', e.target.value)} className="w-full bg-muted border border-input rounded-lg px-3 py-2 outline-none focus:border-primary text-sm font-mono text-foreground" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-muted-foreground mb-1">{label('thank_you_message')}</label>
                <textarea value={formData.thankYouMessage} onChange={(e) => handleChange('thankYouMessage', e.target.value)} rows={2} className="w-full bg-muted border border-input rounded-lg px-3 py-2 outline-none focus:border-primary text-sm resize-none text-foreground" />
              </div>
              {/* Receipt Preview */}
              <div className="p-3 bg-primary-soft  border border-border  rounded-lg">
                <div className="text-xs  font-bold text-primary   mb-2">{label('receipt_preview')}</div>
                <div className="text-center border-2 border-dashed border-border  p-3 bg-card dark:bg-card rounded">
                  <Scissors size={18} className="mx-auto mb-1 text-primary " />
                  <div className="font-bold text-base text-foreground">{urduFirst ? (formData.shopNameUrdu || DICT.shop_name_ur_placeholder.ur) : (formData.shopName || label('auth_shop_name'))}</div>
                </div>
              </div>
            </section>

            {/* Payment details */}
            <section className="bg-card p-4 rounded-lg border border-card-border space-y-3">
              <h3 className="font-bold text-foreground border-b border-border pb-2 text-sm flex items-center gap-2"><Wallet size={16} aria-hidden /> {label('payment_details')}</h3>
              <p className="text-xs text-muted-foreground">{label('shown_on_receipts_and_whatsapp_messages_')}</p>
              <div>
                <label htmlFor="set-title" className="block text-sm font-semibold text-muted-foreground mb-1">{label('account_title')}</label>
                <input id="set-title" value={formData.accountTitle || ''} onChange={(e) => handleChange('accountTitle', e.target.value)} className="w-full h-11 bg-muted border border-input rounded-lg px-3 outline-none focus:border-primary text-sm text-foreground" data-testid="input-account-title" />
              </div>
              <div>
                <label htmlFor="set-zindigi" className="block text-sm font-semibold text-muted-foreground mb-1">{label('zindigi_wallet_number')}</label>
                <input id="set-zindigi" inputMode="tel" placeholder="03xx xxxxxxx" value={formData.zindigiWallet || ''} onChange={(e) => handleChange('zindigiWallet', e.target.value)} className="w-full h-11 bg-muted border border-input rounded-lg px-3 outline-none focus:border-primary text-sm font-mono text-foreground" data-testid="input-zindigi" />
              </div>
              <div>
                <label htmlFor="set-raast" className="block text-sm font-semibold text-muted-foreground mb-1">{label('raast_id_or_iban')}</label>
                <input id="set-raast" value={formData.raastId || ''} onChange={(e) => handleChange('raastId', e.target.value)} className="w-full h-11 bg-muted border border-input rounded-lg px-3 outline-none focus:border-primary text-sm font-mono text-foreground" data-testid="input-raast" />
              </div>
              <fieldset>
                <legend className="block text-sm font-semibold text-muted-foreground mb-1.5">{label('business_type')}</legend>
                <div className="grid grid-cols-3 gap-1.5">
                  {SHOP_TYPES.map((t) => {
                    const on = (formData.shopType || 'shop') === t.value;
                    return (
                      <button key={t.value} type="button" aria-pressed={on} onClick={() => setFormData((prev) => ({ ...prev, shopType: t.value }))}
                        className={`min-h-[52px] rounded-lg border px-1 text-xs font-bold leading-tight transition ${on ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted border-border text-foreground'}`} data-testid={`btn-shoptype-${t.value}`}>
                        {label(t.tk)}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
              <label className="flex items-center gap-3 min-h-[48px] text-sm font-medium">
                <input type="checkbox" checked={!!formData.hideShopPhone} onChange={e => handleChange('hideShopPhone', e.target.checked)} className="h-5 w-5" data-testid="hide-shop-phone" />
                {label('feature_hide_phone')}
              </label>
            </section>

            {/* Demo mode */}
            <section className={`p-4 rounded-lg border space-y-3 ${demoMode ? 'bg-warning-soft  border-border ' : 'bg-card border-card-border'}`}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-start gap-2">
                  <FlaskConical size={18} className="text-warning mt-0.5 shrink-0" />
                  <div>
                    <div className="font-bold text-sm">{label('demo_mode')}</div>
                    <div className="text-xs text-muted-foreground">{label('sample_shop_with_about_150_orders_your_r')}</div>
                  </div>
                </div>
                <Switch checked={demoMode} disabled={busy} onCheckedChange={(v) => { setDemoMode(v); toast({ title: v ? label('demo_data_on') : label('real_data_restored') }); }} className="shrink-0 scale-125" aria-label={label('demo_mode')} data-testid="switch-demo-mode" />
              </div>
              {demoMode && (
                <button type="button" onClick={() => setClearOpen(true)} className="w-full min-h-[44px] rounded-lg border border-border text-danger  text-sm font-bold hover:bg-danger-soft " data-testid="btn-clear-demo">
                  {label('clear_demo_data')}
                </button>
              )}
            </section>

            {/* Karigars */}
            <section className="bg-card p-4 rounded-lg border border-card-border">
              <h3 className="font-bold text-foreground border-b border-border pb-2 text-sm   mb-3">{label('karigar_list')}</h3>
              <div className="flex gap-2 mb-3">
                <input
                  value={newKarigarName}
                  onChange={(e) => setNewKarigarName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddKarigar())}
                  placeholder={label('karigar_name')}
                  className="flex-1 bg-muted border border-input rounded-lg px-3 py-2 text-sm outline-none focus:border-primary text-foreground"
                  data-testid="input-karigar-name"
                />
                <button onClick={handleAddKarigar} className="p-2 bg-primary hover:bg-primary text-primary-foreground rounded-lg transition-colors" data-testid="btn-add-karigar">
                  <Plus size={18} />
                </button>
              </div>
              {karigars.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-2">{label('no_karigars_yet')}</p>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {karigars.map((k) => (
                    <div key={k} className="flex items-center justify-between bg-muted p-2.5 rounded-lg border border-border">
                      <span className="text-sm font-medium text-foreground">{k}</span>
                      <button onClick={() => removeKarigar(k)} className="p-1.5 text-muted-foreground hover:text-danger hover:bg-danger-soft  rounded-md transition-colors">
                        <UserX size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Templates */}
            <section className="bg-card p-4 rounded-lg border border-card-border">
              <h3 className="font-bold text-foreground border-b border-border pb-2 text-sm   mb-3">{label('measurement_templates')}</h3>
              {templates.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-2">{label('no_templates_yet')}</p>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {templates.map((t) => (
                    <div key={t.id} className="flex items-center justify-between bg-muted p-2.5 rounded-lg border border-border">
                      <div>
                        <div className="text-sm font-bold text-foreground">{t.name}</div>
                        <div className="text-xs text-muted-foreground">{new Date(t.createdAt).toLocaleDateString()}</div>
                      </div>
                      <button onClick={() => deleteTemplate(t.id)} className="p-2 text-muted-foreground hover:text-danger hover:bg-danger-soft  rounded-md transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Backup */}
            <section id="backup-settings" className="bg-card p-4 rounded-lg border border-card-border">
              <h3 className="font-bold text-foreground border-b border-border pb-2 text-sm   mb-3">{label('data_backup')}</h3>
              <div className="flex items-center justify-between gap-3 mb-3">
                <label htmlFor="backup-reminders" className="text-sm font-semibold">{label('backup_reminder_option')}</label>
                <Switch id="backup-reminders" checked={reminder.state.enabled} onCheckedChange={(enabled) => {
                  try { reminder.setEnabled(enabled); }
                  catch { toast({ title: label('settings_not_saved'), variant: 'destructive' }); }
                }} data-testid="switch-backup-reminders" />
              </div>
              <p className="text-sm text-muted-foreground mb-3">{label('backup_reminder_local')}</p>
              <p className="text-sm mb-3" data-testid="last-successful-backup">{reminder.state.lastSuccessfulBackupAt
                ? label('backup_last_saved', { date: shortDate(reminder.state.lastSuccessfulBackupAt, lang) })
                : label('backup_never_saved')}</p>
              <p className="text-sm text-muted-foreground mb-3">{label('backup_plain_help')}</p>
              <div className="flex gap-3">
                <button onClick={() => { setProtection(null); void handleExport().catch(err => toast({ title: label('backup_export_failed'), description: err instanceof Error ? err.message : undefined, variant: 'destructive' })); }} disabled={busy} className="disabled:opacity-60 flex-1 flex flex-col items-center gap-1.5 py-3 bg-primary-soft  text-primary  hover:bg-primary-soft rounded-lg border border-border  transition-colors" data-testid="btn-export">
                  <Download size={20} />
                  <span className="text-sm font-bold">{label('export_backup')}</span>
                </button>
                <label className="flex-1 flex flex-col items-center gap-1.5 py-3 bg-muted text-muted-foreground hover:bg-accent rounded-lg border border-border cursor-pointer transition-colors">
                  <Upload size={20} />
                  <span className="text-sm font-bold">{label('restore_data')}</span>
                  <input type="file" accept=".json" className="hidden" ref={fileInputRef} onChange={handleImport} disabled={busy} aria-label={label('restore_data')} />
                </label>
              </div>
              <button type="button" disabled={busy} onClick={() => setProtection('export')} className="mt-3 w-full min-h-[44px] rounded-lg border border-border px-3 text-sm font-bold text-primary disabled:opacity-60" data-testid="btn-export-encrypted">
                {label('backup_export_encrypted')}
              </button>
              {protection && <BackupPassphrase key={protection === 'export' ? 'export' : protection.iv} exporting={protection === 'export'} busy={busy}
                onSubmit={protection === 'export' ? handleExport : unlockBackup} onCancel={cancelProtection} />}
              {pendingSave && <div className="mt-3 rounded-lg border border-border p-3 space-y-2" role="status" data-testid="backup-save-confirmation">
                <p className="text-sm">{label('backup_confirm_saved_help')}</p>
                <div className="flex flex-wrap gap-2">
                  <button type="button" className="min-h-[44px] px-3 rounded-md bg-primary text-primary-foreground text-sm font-semibold" data-testid="btn-confirm-backup-saved" onClick={() => {
                    try {
                      writeStorage(backupReminderKey(photoScope), confirmedBackupState(photoScope, pendingSave.snapshot, pendingSave.exportedAt));
                      setPendingSave(null);
                      toast({ title: label('backup_downloaded') });
                    } catch { toast({ title: label('settings_not_saved'), variant: 'destructive' }); }
                  }}>{label('backup_confirm_saved')}</button>
                  <button type="button" className="min-h-[44px] px-3 rounded-md border border-border text-sm" onClick={() => setPendingSave(null)} data-testid="btn-backup-not-saved">{label('backup_not_saved')}</button>
                </div>
              </div>}
            </section>

          </div>

          <div className="p-4 border-t border-border bg-card shrink-0">
            <button onClick={handleSave} disabled={busy} className="w-full bg-primary hover:bg-primary text-primary-foreground rounded-lg py-3 font-bold  active:scale-[0.98] transition-all flex items-center justify-center gap-2" data-testid="btn-save-settings">
              <Save size={18} aria-hidden /> {label('save_2')}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
      <AlertDialog open={!!pendingRestore} onOpenChange={(v) => { if (!v) setPendingRestore(null); }}>
        <AlertDialogContent className="w-[calc(100%-1.5rem)] max-w-sm rounded-lg z-[70]">
          <AlertDialogHeader>
            <AlertDialogTitle>{label('replace_all_data')}</AlertDialogTitle>
            <AlertDialogDescription>{label('t_backup_checked_n_orders_n_customers_n_ph', { ordersCount: pendingRestore?.orders.length ?? 0, customersCount: pendingRestore?.customers?.length ?? 0, photosCount: pendingRestore?.photos.length ?? 0 })}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="min-h-[44px]">{label('cancel_x')}</AlertDialogCancel>
            <AlertDialogAction className="min-h-[44px] bg-danger hover:bg-danger" onClick={runRestore} data-testid="btn-confirm-restore">{label('replace')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={clearOpen} onOpenChange={setClearOpen}>
        <AlertDialogContent className="w-[calc(100%-1.5rem)] max-w-sm rounded-lg z-[70]">
          <AlertDialogHeader>
            <AlertDialogTitle>{label('clear_demo_data_2')}</AlertDialogTitle>
            <AlertDialogDescription>{label('deletes_only_the_sample_demo_orders_and_')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="min-h-[44px]">{label('cancel_x')}</AlertDialogCancel>
            <AlertDialogAction className="min-h-[44px] bg-danger hover:bg-danger" onClick={async () => { try { await clearDemoData(); toast({ title: label('demo_data_cleared') }); } catch (err) { toast({ title: label('could_not_clear_demo_data'), description: err instanceof Error ? err.message : undefined, variant: 'destructive' }); } }} data-testid="btn-confirm-clear-demo">{label('clear')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog.Root>
  );
}
