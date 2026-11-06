import { haptic } from '../lib/haptics';
import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Zap, ListChecks, Check } from 'lucide-react';
import type { Customer, GarmentType, Measurements, Order } from '../types/order';
import { useCustomers } from '../hooks/use-customers';
import { usePreferences } from '../hooks/use-preferences';
import { useSettings } from '../hooks/use-settings';
import { useToast } from '@/hooks/use-toast';
import { GARMENTS, garment, defaultMeasurements, LEGACY_MEASUREMENTS, newItem } from '../lib/garments';
import { normalizePakistaniPhone } from '../lib/reminders';
import { formatPhone, matchesCustomer } from './format';

type NewOrder = Omit<Order, 'id' | 'createdAt' | 'serialNumber'>;
const inputCls = 'w-full min-h-[48px] bg-muted border border-input rounded-lg px-3 outline-none focus:border-primary text-base';
const day = (n: number) => { const d = new Date(); d.setDate(d.getDate() + n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

export function QuickOrderForm({ open, onOpenChange, initialCustomer, orders, onSave, onOpenFull }: {
  open: boolean; onOpenChange: (v: boolean) => void; initialCustomer?: Customer; orders: Order[];
  onSave: (o: NewOrder) => Order | void; onOpenFull: (prefill?: Partial<Order>) => void;
}) {
  const { customers } = useCustomers();
  const { label } = usePreferences();
  const { settings } = useSettings();
  const homeBased = settings.shopType === 'women-home-tailor';
  const garments = homeBased ? [...GARMENTS].sort((a, b) => Number(!a.value.startsWith('ladies')) - Number(!b.value.startsWith('ladies'))) : GARMENTS;
  const { toast } = useToast();
  const [q, setQ] = useState('');
  const [picked, setPicked] = useState<Customer | undefined>();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [profileId, setProfileId] = useState('');
  const [type, setType] = useState<GarmentType>('gents');
  const [price, setPrice] = useState('1500');
  const [date, setDate] = useState(day(5));
  const [err, setErr] = useState<string>();

  useEffect(() => {
    if (!open) return;
    const c = initialCustomer;
    setPicked(c && customers.some((x) => x.id === c.id) ? c : undefined);
    setName(c?.name ?? ''); setPhone(c?.phone ?? ''); setQ('');
    setProfileId(c?.profiles[0]?.id ?? ''); setType(c?.profiles[0]?.garmentType ?? (homeBased ? 'ladies-shirt' : 'gents'));
    setPrice('1500'); setDate(day(5)); setErr(undefined);
  }, [open, initialCustomer, customers, homeBased]);

  const matches = useMemo(() => q.trim() ? customers.filter((c) => matchesCustomer(q, c.name, c.phone)).slice(0, 5) : [], [q, customers]);
  const profiles = picked?.profiles ?? [];
  const profile = profiles.find((p) => p.id === profileId);
  const lastGents = useMemo(() => {
    return picked ? orders.filter((o) => o.customerId === picked.id).sort((a, b) => b.orderDate.localeCompare(a.orderDate))[0] : undefined;
  }, [orders, picked]);

  const choose = (c: Customer) => { setPicked(c); setName(c.name); setPhone(c.phone); setQ(''); setProfileId(c.profiles[0]?.id ?? ''); if (c.profiles[0]) setType(c.profiles[0].garmentType); };

  const resolvedMeasurements = () => profile && profile.garmentType === type ? { ...profile.measurements }
    : type === 'gents' && lastGents?.measurements ? { ...(lastGents.measurements as unknown as Record<string, number>) } : defaultMeasurements(type);
  const expandToFull = () => {
    const measurements = resolvedMeasurements();
    const amount = Number(price);
    // Promote this quick-order draft, not a new default-sized order. Other
    // garment profiles remain available through customer history/reuse.
    const item = { ...newItem(type), unitPrice: Number.isFinite(amount) ? amount : 0, measurements };
    onOpenChange(false);
    onOpenFull({
      customerName: name, phone, customerId: picked?.id, items: [item], suitCount: 1,
      measurements: { ...(type === 'gents' ? measurements as unknown as Measurements : lastGents?.measurements ?? LEGACY_MEASUREMENTS) },
      totalAmount: item.unitPrice, ...(date ? { deliveryDate: new Date(date).toISOString() } : {}),
    });
  };
  const save = () => {
    const amount = Number(price);
    if (name.trim().length < 2) return setErr(label('name_is_required'));
    if (phone.replace(/\D/g, '').length < 10) return setErr(label('valid_phone_required'));
    if (!Number.isFinite(amount) || amount < 0) return setErr(label('enter_a_valid_price'));
    if (!date) return setErr(label('delivery_date_required'));
    const measurements = resolvedMeasurements();
    const item = { ...newItem(type), unitPrice: amount, measurements };
    let customerId = picked?.id;
    try {
      customerId ??= crypto.randomUUID();
      onSave({
        customerName: name.trim(), phone, customerId,
        orderDate: new Date().toISOString(), deliveryDate: new Date(date).toISOString(),
        urgent: false, suitCount: 1, fabric: profile ? profile.name : label('quick_order_x'),
        items: [item], measurements: { ...(type === 'gents' ? (measurements as unknown as Measurements) : (lastGents?.measurements ?? LEGACY_MEASUREMENTS)) },
        collarType: 'Normal Collar', damanType: 'Choras (Square)', pockets: '2 Side Pockets', cuffType: 'Simple',
        specialNotes: '', totalAmount: amount, advanceAmount: 0, status: 'pending',
      });
      haptic();
      toast({ title: label('order_saved'), description: name });
      onOpenChange(false);
    } catch (e) { setErr(e instanceof Error ? e.message : String(e)); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-1rem)] max-w-md max-h-[92dvh] overflow-y-auto rounded-lg p-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Zap size={18} className="text-warning" aria-hidden /> {label('quick_order_x')}</DialogTitle>
          <DialogDescription>{label('one_garment_saved_measurements_done_in_s')}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {!picked && (
            <div className="relative">
              <input type="search" value={q} onChange={(e) => setQ(e.target.value)} aria-label={label('find_saved_customer')} placeholder={label('find_customer_name_or_last_4_digits')} className={inputCls} data-testid="input-quick-search" />
              {matches.length > 0 && (
                <ul className="mt-1 rounded-lg border border-border bg-popover divide-y divide-border">
                  {matches.map((c) => (
                    <li key={c.id}><button type="button" onClick={() => choose(c)} className="w-full min-h-[48px] px-3 text-start flex justify-between items-center gap-2"><span className="font-bold truncate">{c.name}</span><span className="text-sm font-mono text-muted-foreground" dir="ltr">{formatPhone(c.phone)}</span></button></li>
                  ))}
                </ul>
              )}
            </div>
          )}
          {picked && (
            <div className="flex items-center justify-between rounded-lg bg-primary-soft  border border-border  p-3">
              <span className="flex items-center gap-2 text-sm font-bold"><Check size={16} className="text-primary" aria-hidden /> {picked.name}</span>
              <button type="button" onClick={() => { setPicked(undefined); setProfileId(''); }} className="min-h-[44px] px-2 text-sm font-bold underline">{label('change')}</button>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            <label className="text-sm font-semibold">{label('name')}<input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} data-testid="input-quick-name" /></label>
            <label className="text-sm font-semibold">{label('phone')}<input type="tel" dir="ltr" value={phone} onChange={(e) => setPhone(e.target.value)} className={`${inputCls} font-mono`} placeholder="03XXXXXXXXX" data-testid="input-quick-phone" /></label>
          </div>
          {profiles.length > 0 && (
            <fieldset>
              <legend className="text-sm font-semibold mb-1">{label('saved_measurements')}</legend>
              <div className="flex flex-wrap gap-1.5">
                {profiles.map((p) => (
                  <button key={p.id} type="button" aria-pressed={profileId === p.id} onClick={() => { setProfileId(p.id); setType(p.garmentType); }} className={`min-h-[44px] px-3 rounded-lg border text-sm font-bold ${profileId === p.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted border-border'}`}>{p.name} · {label(garment(p.garmentType).tk)}</button>
                ))}
              </div>
            </fieldset>
          )}
          <label className="block text-sm font-semibold">{label('garment')}
            <select value={type} onChange={(e) => { setType(e.target.value as GarmentType); if (profile && profile.garmentType !== e.target.value) setProfileId(''); }} className={inputCls} data-testid="select-quick-garment">
              {garments.map((g) => <option key={g.value} value={g.value}>{label(g.tk)}</option>)}
            </select>
          </label>
          <p className="text-xs text-muted-foreground">{profile && profile.garmentType === type ? label('t_using_saved_profile_n', { name: profile.name }) : type === 'gents' && lastGents ? label('using_measurements_from_last_order') : label('standard_measurements_edit_later_in_full')}</p>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-sm font-semibold">{label('price_rs')}<input type="number" inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value)} className={`${inputCls} font-mono font-bold`} data-testid="input-quick-price" /></label>
            <label className="text-sm font-semibold">{label('delivery')}<input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} data-testid="input-quick-date" /></label>
          </div>
          {err && <p role="alert" className="text-sm text-danger">{err}</p>}
          <button type="button" onClick={save} className="w-full min-h-[52px] rounded-lg bg-accent hover:bg-warning text-accent-foreground font-bold text-base" data-testid="btn-quick-save">{label('save_order')}</button>
          <button type="button" onClick={expandToFull} className="w-full min-h-[44px] rounded-lg border border-border text-sm font-bold flex items-center justify-center gap-1.5" data-testid="btn-open-full-form"><ListChecks size={15} aria-hidden /> {label('full_4_step_form')}</button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
