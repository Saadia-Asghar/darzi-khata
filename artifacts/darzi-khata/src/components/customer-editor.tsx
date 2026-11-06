import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Trash2, Ruler } from 'lucide-react';
import type { Customer, GarmentType, MeasurementProfile } from '../types/order';
import { useCustomers } from '../hooks/use-customers';
import { usePreferences } from '../hooks/use-preferences';
import { useToast } from '@/hooks/use-toast';
import { GARMENTS, garment, defaultMeasurements } from '../lib/garments';
import { MeasurementDiagram } from './measurement-diagram';

const inputCls = 'w-full min-h-[44px] bg-muted border border-input rounded-lg px-3 outline-none focus:border-primary text-sm';

export function emptyCustomer(name = '', phone = ''): Customer {
  const now = new Date().toISOString();
  return { id: crypto.randomUUID(), name, phone, profiles: [], notes: '', createdAt: now, updatedAt: now };
}

export function CustomerEditor({ customer, onClose }: { customer: Customer | null; onClose: () => void }) {
  const { saveCustomer } = useCustomers();
  const { label } = usePreferences();
  const { toast } = useToast();
  const [draft, setDraft] = useState<Customer | null>(() => customer ? structuredClone(customer) : null);
  const [openProfile, setOpenProfile] = useState<string | null>(null);
  const [focusKey, setFocusKey] = useState<string>();
  const [err, setErr] = useState<string>();
  useEffect(() => { setDraft(customer ? structuredClone(customer) : null); setErr(undefined); setOpenProfile(null); }, [customer]);
  if (!draft) return null;

  const patchProfile = (id: string, p: Partial<MeasurementProfile>) => setDraft({ ...draft, profiles: draft.profiles.map((x) => x.id === id ? { ...x, ...p } : x) });
  const addProfile = () => {
    const prof: MeasurementProfile = { id: crypto.randomUUID(), name: label('self'), garmentType: 'gents', measurements: defaultMeasurements('gents') };
    setDraft({ ...draft, profiles: [...draft.profiles, prof] }); setOpenProfile(prof.id);
  };
  const save = () => {
    const bad = draft.profiles.find((p) => !p.name.trim() || garment(p.garmentType).fields.some((f) => !(p.measurements[f.key] > 0)));
    if (bad) { setErr(label('each_profile_needs_a_name_and_all_measur')); return; }
    try { saveCustomer(draft); toast({ title: label('customer_saved') }); onClose(); }
    catch (e) { setErr(e instanceof Error ? e.message : String(e)); }
  };

  return (
    <Dialog open={!!customer} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="w-[calc(100%-1rem)] max-w-md max-h-[90dvh] overflow-y-auto rounded-lg p-4">
        <DialogHeader>
          <DialogTitle>{label('customer')}</DialogTitle>
          <DialogDescription>{label('name_phone_notes_and_saved_measurement_p')}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div><label htmlFor="ce-name" className="text-sm font-semibold">{label('name')}</label><input id="ce-name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className={inputCls} data-testid="input-customer-name" /></div>
          <div><label htmlFor="ce-phone" className="text-sm font-semibold">{label('phone')}</label><input id="ce-phone" type="tel" dir="ltr" value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} className={`${inputCls} font-mono`} placeholder="03XXXXXXXXX" data-testid="input-customer-phone" /></div>
          <div><label htmlFor="ce-notes" className="text-sm font-semibold">{label('notes')}</label><textarea id="ce-notes" rows={2} value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} className="w-full bg-muted border border-input rounded-lg px-3 py-2 text-sm resize-none" data-testid="input-customer-notes" /></div>
          <div className="flex items-center justify-between pt-1">
            <span className="text-sm font-bold flex items-center gap-1"><Ruler size={15} aria-hidden /> {label('measurement_profiles')}</span>
            <button type="button" onClick={addProfile} className="min-h-[44px] px-3 rounded-lg bg-primary-soft  text-primary  text-sm font-bold flex items-center gap-1" data-testid="btn-add-profile"><Plus size={14} /> {label('add')}</button>
          </div>
          {draft.profiles.length === 0 && <p className="text-sm text-muted-foreground">{label('no_saved_profiles_add_one_for_faster_qui')}</p>}
          {draft.profiles.map((p) => {
            const g = garment(p.garmentType); const isOpen = openProfile === p.id;
            const meta = g.fields.find((f) => f.key === focusKey);
            return (
              <div key={p.id} className="rounded-lg border border-border">
                <div className="flex items-center gap-2 p-2">
                  <button type="button" onClick={() => setOpenProfile(isOpen ? null : p.id)} aria-expanded={isOpen} className="flex-1 min-h-[44px] text-start px-1"><span className="font-bold text-sm">{p.name}</span><span className="block text-xs text-muted-foreground">{label(g.tk)}</span></button>
                  <button type="button" onClick={() => setDraft({ ...draft, profiles: draft.profiles.filter((x) => x.id !== p.id) })} className="h-11 w-11 rounded-lg flex items-center justify-center text-muted-foreground hover:text-danger" aria-label={label('remove_profile')}><Trash2 size={15} /></button>
                </div>
                {isOpen && (
                  <div className="p-3 pt-0 space-y-2">
                    <input aria-label={label('profile_name')} value={p.name} onChange={(e) => patchProfile(p.id, { name: e.target.value })} className={inputCls} />
                    <select aria-label={label('garment_type')} value={p.garmentType} onChange={(e) => { const t = e.target.value as GarmentType; patchProfile(p.id, { garmentType: t, measurements: defaultMeasurements(t) }); }} className={inputCls}>
                      {GARMENTS.map((gg) => <option key={gg.value} value={gg.value}>{label(gg.tk)}</option>)}
                    </select>
                    <MeasurementDiagram garmentType={p.garmentType} active={focusKey} activeLabel={meta ? label(meta.tk) : undefined} />
                    <div className="grid grid-cols-2 gap-2">
                      {g.fields.map((f) => (
                        <label key={f.key} className="text-xs font-semibold">{label(f.tk)}
                          <input type="number" step="0.5" inputMode="decimal" value={Number.isFinite(p.measurements[f.key]) ? p.measurements[f.key] : ''} onFocus={() => setFocusKey(f.key)}
                            onChange={(e) => patchProfile(p.id, { measurements: { ...p.measurements, [f.key]: e.target.value === '' ? NaN : Number(e.target.value) } })} className={`${inputCls} font-mono font-bold`} />
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {err && <p role="alert" className="text-sm text-danger">{err}</p>}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 min-h-[48px] rounded-lg border border-border font-bold text-sm">{label('cancel_x')}</button>
            <button type="button" onClick={save} className="flex-[2] min-h-[48px] rounded-lg bg-primary text-primary-foreground font-bold text-sm" data-testid="btn-save-customer">{label('save_customer')}</button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
