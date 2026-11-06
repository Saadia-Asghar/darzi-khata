import * as Dialog from '@radix-ui/react-dialog';
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

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orders: Order[];
  setAllOrders: (orders: Order[]) => void;
}

export function SettingsModal({ open, onOpenChange, orders, setAllOrders }: SettingsModalProps) {
  const { settings, saveSettings } = useSettings();
  const { templates, deleteTemplate } = useTemplates();
  const { karigars, addKarigar, removeKarigar } = useKarigars();
  const { toast } = useToast();

  const [formData, setFormData] = useState<ShopSettings>(settings);
  const [newKarigarName, setNewKarigarName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { demoMode, setDemoMode, clearDemoData } = useDemoMode();
  const [clearOpen, setClearOpen] = useState(false);

  // Initialise form only when the dialog opens, so unrelated re-renders never wipe typed input.
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  useEffect(() => {
    if (open) setFormData(settingsRef.current);
  }, [open, demoMode]);

  const handleChange = (field: keyof ShopSettings, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleToggleDark = () => {
    const next = { ...formData, darkMode: !formData.darkMode };
    setFormData(next);
    saveSettings(next);
    document.documentElement.classList.toggle('dark', next.darkMode);
  };

  const handleSave = () => {
    saveSettings(formData);
    toast({ title: 'Settings saved', description: 'Shop settings have been updated.' });
    onOpenChange(false);
  };

  const handleExport = () => {
    const backup = { orders, settings: formData, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `darzi-khata-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: 'Backup Downloaded' });
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.orders && Array.isArray(data.orders)) {
          if (window.confirm('Yeh action sab maujuda orders replace kar dega. Sure?')) {
            setAllOrders(data.orders);
            if (data.settings) { saveSettings(data.settings); setFormData(data.settings); }
            toast({ title: 'Data Restored', description: `${data.orders.length} orders restored.` });
          }
        } else {
          toast({ title: 'Invalid File', variant: 'destructive' });
        }
      } catch {
        toast({ title: 'Error reading file', variant: 'destructive' });
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAddKarigar = () => {
    if (!newKarigarName.trim()) return;
    addKarigar(newKarigarName.trim());
    setNewKarigarName('');
    toast({ title: 'Karigar Add Ho Gaya' });
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-background p-0 shadow-2xl outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 overflow-hidden max-h-[90vh] flex flex-col">

          <div className="px-5 py-4 border-b bg-emerald-800 text-white shrink-0 flex justify-between items-center">
            <div>
              <Dialog.Title className="text-lg font-bold">Shop Settings</Dialog.Title>
              <Dialog.Description className="text-emerald-200 text-xs font-urdu mt-0.5">دکان کی سیٹنگز</Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-emerald-700 text-white" aria-label="Close">
                <X size={20} />
              </button>
            </Dialog.Close>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-5">

            {/* Dark Mode */}
            <section className="bg-card p-4 rounded-xl border border-card-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Moon size={18} className={formData.darkMode ? 'text-amber-400' : 'text-muted-foreground'} />
                  <div>
                    <div className="font-bold text-foreground text-sm">Dark Mode / رات کا رنگ</div>
                    <div className="text-xs text-muted-foreground">Raat ko aankhon ke liye</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleToggleDark}
                  className={`w-12 h-6 rounded-full relative transition-colors duration-200 ${formData.darkMode ? 'bg-emerald-600' : 'bg-gray-300'}`}
                  data-testid="toggle-dark-mode"
                >
                  <span className={`block w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform duration-200 shadow-sm ${formData.darkMode ? 'translate-x-6' : 'translate-x-0.5'}`} />
                </button>
              </div>
            </section>

            {/* Shop Details */}
            <section className="bg-card p-4 rounded-xl border border-card-border space-y-3">
              <h3 className="font-bold text-foreground border-b border-border pb-2 text-sm uppercase tracking-wider">Shop Details</h3>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Shop Name (English)</label>
                <input value={formData.shopName} onChange={(e) => handleChange('shopName', e.target.value)} className="w-full bg-muted border border-input rounded-lg px-3 py-2 outline-none focus:border-emerald-500 text-sm font-bold text-foreground" data-testid="input-shop-name" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Shop Name (Urdu)</label>
                <input value={formData.shopNameUrdu} onChange={(e) => handleChange('shopNameUrdu', e.target.value)} className="w-full bg-muted border border-input rounded-lg px-3 py-2 outline-none focus:border-emerald-500 text-sm font-urdu text-right text-foreground" dir="rtl" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Address</label>
                <input value={formData.address} onChange={(e) => handleChange('address', e.target.value)} className="w-full bg-muted border border-input rounded-lg px-3 py-2 outline-none focus:border-emerald-500 text-sm text-foreground" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Phone</label>
                <input value={formData.phone} onChange={(e) => handleChange('phone', e.target.value)} className="w-full bg-muted border border-input rounded-lg px-3 py-2 outline-none focus:border-emerald-500 text-sm font-mono text-foreground" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Thank You Message</label>
                <textarea value={formData.thankYouMessage} onChange={(e) => handleChange('thankYouMessage', e.target.value)} rows={2} className="w-full bg-muted border border-input rounded-lg px-3 py-2 outline-none focus:border-emerald-500 text-sm resize-none text-foreground" />
              </div>
              {/* Receipt Preview */}
              <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-lg">
                <div className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400 tracking-wider mb-2">Receipt Preview</div>
                <div className="text-center border-2 border-dashed border-emerald-200 dark:border-emerald-700 p-3 bg-white dark:bg-card rounded">
                  <Scissors size={18} className="mx-auto mb-1 text-emerald-800 dark:text-emerald-400" />
                  <div className="font-black text-base tracking-widest uppercase text-foreground">{formData.shopName || 'Shop Name'}</div>
                  <div className="font-urdu text-sm text-foreground">{formData.shopNameUrdu || 'دکان کا نام'}</div>
                </div>
              </div>
            </section>

            {/* Payment details */}
            <section className="bg-card p-4 rounded-xl border border-card-border space-y-3">
              <h3 className="font-bold text-foreground border-b border-border pb-2 text-sm flex items-center gap-2"><Wallet size={16} /> Payment details <span className="font-urdu font-normal text-muted-foreground">ادائیگی کی تفصیل</span></h3>
              <p className="text-[11px] text-muted-foreground">Shown on receipts and WhatsApp messages. Stored only on this phone. / صرف اس فون پر محفوظ</p>
              <div>
                <label htmlFor="set-title" className="block text-xs font-semibold text-muted-foreground mb-1">Account title / اکاؤنٹ کا نام</label>
                <input id="set-title" value={formData.accountTitle || ''} onChange={(e) => handleChange('accountTitle', e.target.value)} className="w-full h-11 bg-muted border border-input rounded-lg px-3 outline-none focus:border-emerald-500 text-sm text-foreground" data-testid="input-account-title" />
              </div>
              <div>
                <label htmlFor="set-zindigi" className="block text-xs font-semibold text-muted-foreground mb-1">Zindigi wallet number / زندگی والٹ نمبر</label>
                <input id="set-zindigi" inputMode="tel" placeholder="03xx xxxxxxx" value={formData.zindigiWallet || ''} onChange={(e) => handleChange('zindigiWallet', e.target.value)} className="w-full h-11 bg-muted border border-input rounded-lg px-3 outline-none focus:border-emerald-500 text-sm font-mono text-foreground" data-testid="input-zindigi" />
              </div>
              <div>
                <label htmlFor="set-raast" className="block text-xs font-semibold text-muted-foreground mb-1">Raast ID or IBAN / راست آئی ڈی</label>
                <input id="set-raast" value={formData.raastId || ''} onChange={(e) => handleChange('raastId', e.target.value)} className="w-full h-11 bg-muted border border-input rounded-lg px-3 outline-none focus:border-emerald-500 text-sm font-mono text-foreground" data-testid="input-raast" />
              </div>
              <fieldset>
                <legend className="block text-xs font-semibold text-muted-foreground mb-1.5">Business type / کاروبار کی قسم</legend>
                <div className="grid grid-cols-3 gap-1.5">
                  {SHOP_TYPES.map((t) => {
                    const on = (formData.shopType || 'shop') === t.value;
                    return (
                      <button key={t.value} type="button" aria-pressed={on} onClick={() => setFormData((prev) => ({ ...prev, shopType: t.value }))}
                        className={`min-h-[52px] rounded-lg border px-1 text-[11px] font-bold leading-tight transition ${on ? 'bg-emerald-800 text-white border-emerald-800' : 'bg-muted border-border text-foreground'}`} data-testid={`btn-shoptype-${t.value}`}>
                        {t.en}<span className="block font-urdu font-normal">{t.ur}</span>
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            </section>

            {/* Demo mode */}
            <section className={`p-4 rounded-xl border space-y-3 ${demoMode ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-300 dark:border-amber-700' : 'bg-card border-card-border'}`}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-start gap-2">
                  <FlaskConical size={18} className="text-amber-600 mt-0.5 shrink-0" />
                  <div>
                    <div className="font-bold text-sm">Demo mode <span className="font-urdu font-normal">ڈیمو موڈ</span></div>
                    <div className="text-[11px] text-muted-foreground">Sample shop with about 150 orders. Your real orders are kept separately and return when you switch off. / اصل آرڈر محفوظ رہتے ہیں</div>
                  </div>
                </div>
                <Switch checked={demoMode} onCheckedChange={(v) => { setDemoMode(v); toast({ title: v ? 'Demo data on / ڈیمو آن' : 'Real data restored / اصل ڈیٹا واپس' }); }} className="shrink-0 scale-125" aria-label="Demo mode / ڈیمو موڈ" data-testid="switch-demo-mode" />
              </div>
              {demoMode && (
                <button type="button" onClick={() => setClearOpen(true)} className="w-full min-h-[44px] rounded-lg border border-red-300 text-red-700 dark:text-red-400 text-sm font-bold hover:bg-red-50 dark:hover:bg-red-900/20" data-testid="btn-clear-demo">
                  Clear demo data / ڈیمو ڈیٹا ختم کریں
                </button>
              )}
            </section>

            {/* Karigars */}
            <section className="bg-card p-4 rounded-xl border border-card-border">
              <h3 className="font-bold text-foreground border-b border-border pb-2 text-sm uppercase tracking-wider mb-3">Karigar List</h3>
              <div className="flex gap-2 mb-3">
                <input
                  value={newKarigarName}
                  onChange={(e) => setNewKarigarName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddKarigar())}
                  placeholder="Karigar ka naam..."
                  className="flex-1 bg-muted border border-input rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-500 text-foreground"
                  data-testid="input-karigar-name"
                />
                <button onClick={handleAddKarigar} className="p-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg transition-colors" data-testid="btn-add-karigar">
                  <Plus size={18} />
                </button>
              </div>
              {karigars.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-2">Koi karigar nahi.</p>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {karigars.map((k) => (
                    <div key={k} className="flex items-center justify-between bg-muted p-2.5 rounded-lg border border-border">
                      <span className="text-sm font-medium text-foreground">{k}</span>
                      <button onClick={() => removeKarigar(k)} className="p-1.5 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors">
                        <UserX size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Templates */}
            <section className="bg-card p-4 rounded-xl border border-card-border">
              <h3 className="font-bold text-foreground border-b border-border pb-2 text-sm uppercase tracking-wider mb-3">Measurement Templates</h3>
              {templates.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-2">Koi template nahi.</p>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {templates.map((t) => (
                    <div key={t.id} className="flex items-center justify-between bg-muted p-2.5 rounded-lg border border-border">
                      <div>
                        <div className="text-sm font-bold text-foreground">{t.name}</div>
                        <div className="text-[10px] text-muted-foreground">{new Date(t.createdAt).toLocaleDateString()}</div>
                      </div>
                      <button onClick={() => deleteTemplate(t.id)} className="p-2 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Backup */}
            <section className="bg-card p-4 rounded-xl border border-card-border">
              <h3 className="font-bold text-foreground border-b border-border pb-2 text-sm uppercase tracking-wider mb-3">Data Backup</h3>
              <div className="flex gap-3">
                <button onClick={handleExport} className="flex-1 flex flex-col items-center gap-1.5 py-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 rounded-xl border border-emerald-100 dark:border-emerald-800 transition-colors" data-testid="btn-export">
                  <Download size={20} />
                  <span className="text-xs font-bold">Export Backup</span>
                </button>
                <label className="flex-1 flex flex-col items-center gap-1.5 py-3 bg-muted text-muted-foreground hover:bg-accent rounded-xl border border-border cursor-pointer transition-colors">
                  <Upload size={20} />
                  <span className="text-xs font-bold">Restore Data</span>
                  <input type="file" accept=".json" className="hidden" ref={fileInputRef} onChange={handleImport} />
                </label>
              </div>
            </section>

          </div>

          <div className="p-4 border-t border-border bg-card shrink-0">
            <button onClick={handleSave} className="w-full bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl py-3 font-bold shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2" data-testid="btn-save-settings">
              <Save size={18} /> Mehfooz Karein / Save
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
      <AlertDialog open={clearOpen} onOpenChange={setClearOpen}>
        <AlertDialogContent className="w-[calc(100%-1.5rem)] max-w-sm rounded-2xl z-[70]">
          <AlertDialogHeader>
            <AlertDialogTitle>Clear demo data? <span className="font-urdu font-normal">ڈیمو ڈیٹا ختم؟</span></AlertDialogTitle>
            <AlertDialogDescription>Deletes only the sample demo orders and turns demo mode off. Your real orders are not touched. / صرف ڈیمو آرڈر حذف ہوں گے</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="min-h-[44px]">Cancel / منسوخ</AlertDialogCancel>
            <AlertDialogAction className="min-h-[44px] bg-red-600 hover:bg-red-700" onClick={() => { clearDemoData(); toast({ title: 'Demo data cleared / ڈیمو ڈیٹا ختم' }); }} data-testid="btn-confirm-clear-demo">Clear / ختم کریں</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog.Root>
  );
}
