import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Zap, ListChecks, Check } from 'lucide-react';
import type { Customer, GarmentType, Measurements, Order } from '../types/order';
import { useCustomers } from '../hooks/use-customers';
import { usePreferences } from '../hooks/use-preferences';
import { useToast } from '@/hooks/use-toast';
import { GARMENTS, garment, defaultMeasurements, LEGACY_MEASUREMENTS, newItem } from '../lib/garments';
import { normalizePakistaniPhone } from '../lib/reminders';
import { formatPhone, matchesCustomer } from './format';

type NewOrder = Omit<Order, 'id' | 'createdAt' | 'serialNumber'>;
const inputCls = 'w-full min-h-[48px] bg-muted border border-input rounded-lg px-3 outline-none focus:border-emerald-500 text-base';
const day = (n: number) => { const d = new Date(); d.setDate(d.getDate() + n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

export function QuickOrderForm({ open, onOpenChange, initialCustomer, orders, onSave, onOpenFull }: {
  open: boolean; onOpenChange: (v: boolean) => void; initialCustomer?: Customer; orders: Order[];
  onSave: (o: NewOrder) => Order | void; onOpenFull: (prefill?: Partial<Order>) => void;
}) {
  const { customers } = useCustomers();
  const { label } = usePreferences();
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
    setProfileId(c?.profiles[0]?.id ?? ''); setType(c?.profiles[0]?.garmentType ?? 'gents');
    setPrice('1500'); setDate(day(5)); setErr(undefined);
  }, [open, initialCustomer, customers]);

  const matches = useMemo(() => q.trim() ? customers.filter((c) => matchesCustomer(q, c.name, c.phone)).slice(0, 5) : [], [q, customers]);
  const profiles = picked?.profiles ?? [];
  const profile = profiles.find((p) => p.id === profileId);
  const lastGents = useMemo(() => {
    const n = normalizePakistaniPhone(phone);
    return n.length >= 10 ? orders.filter((o) => normalizePakistaniPhone(o.phone) === n).sort((a, b) => b.orderDate.localeCompare(a.orderDate))[0] : undefined;
  }, [orders, phone]);

  const choose = (c: Customer) => { setPicked(c); setName(c.name); setPhone(c.phone); setQ(''); setProfileId(c.profiles[0]?.id ?? ''); if (c.profiles[0]) setType(c.profiles[0].garmentType); };

  const save = () => {
    const amount = Number(price);
    if (name.trim().length < 2) return setErr(label('Name is required', 'نام ضروری ہے'));
    if (phone.replace(/\D/g, '').length < 10) return setErr(label('Valid phone required', 'درست فون نمبر'));
    if (!Number.isFinite(amount) || amount < 0) return setErr(label('Enter a valid price', 'درست قیمت لکھیں'));
    if (!date) return setErr(label('Delivery date required', 'ڈیلیوری تاریخ'));
    const measurements = profile && profile.garmentType === type ? { ...profile.measurements }
      : type === 'gents' && lastGents?.measurements ? { ...(lastGents.measurements as unknown as Record<string, number>) } : defaultMeasurements(type);
    const item = { ...newItem(type), unitPrice: amount, measurements };
    let customerId = picked?.id;
    try {
      if (!customerId) {
        const n = normalizePakistaniPhone(phone);
        const existing = customers.find((c) => normalizePakistaniPhone(c.phone) === n);
        customerId = existing?.id;
      }
      onSave({
        customerName: name.trim(), phone, customerId,
        orderDate: new Date().toISOString(), deliveryDate: new Date(date).toISOString(),
        urgent: false, suitCount: 1, fabric: profile ? profile.name : label('Quick order', 'فوری آرڈر'),
        items: [item], measurements: type === 'gents' ? (measurements as unknown as Measurements) : (lastGents?.measurements ?? LEGACY_MEASUREMENTS),
        collarType: 'Normal Collar', damanType: 'Choras (Square)', pockets: '2 Side Pockets', cuffType: 'Simple',
        specialNotes: '', totalAmount: amount, advanceAmount: 0, status: 'pending',
      });
      toast({ title: label('Order saved', 'آرڈر محفوظ'), description: name });
      onOpenChange(false);
    } catch (e) { setErr(e instanceof Error ? e.message : String(e)); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-1rem)] max-w-md max-h-[92dvh] overflow-y-auto rounded-2xl p-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Zap size={18} className="text-amber-600" aria-hidden /> {label('Quick order', 'فوری آرڈر')}</DialogTitle>
          <DialogDescription>{label('One garment, saved measurements, done in seconds', 'ایک کپڑا، محفوظ ناپ، چند سیکنڈ میں')}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {!picked && (
            <div className="relative">
              <input type="search" value={q} onChange={(e) => setQ(e.target.value)} aria-label={label('Find saved customer', 'محفوظ گاہک تلاش')} placeholder={label('Find customer: name or last 4 digits', 'گاہک تلاش: نام یا آخری 4 ہندسے')} className={inputCls} data-testid="input-quick-search" />
              {matches.length > 0 && (
                <ul className="mt-1 rounded-xl border border-border bg-popover divide-y divide-border">
                  {matches.map((c) => (
                    <li key={c.id}><button type="button" onClick={() => choose(c)} className="w-full min-h-[48px] px-3 text-start flex justify-between items-center gap-2"><span className="font-bold truncate">{c.name}</span><span className="text-xs font-mono text-muted-foreground" dir="ltr">{formatPhone(c.phone)}</span></button></li>
                  ))}
                </ul>
              )}
            </div>
          )}
          {picked && (
            <div className="flex items-center justify-between rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 p-3">
              <span className="flex items-center gap-2 text-sm font-bold"><Check size={16} className="text-emerald-700" aria-hidden /> {picked.name}</span>
              <button type="button" onClick={() => { setPicked(undefined); setProfileId(''); }} className="min-h-[44px] px-2 text-xs font-bold underline">{label('Change', 'بدلیں')}</button>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            <label className="text-xs font-semibold">{label('Name', 'نام')}<input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} data-testid="input-quick-name" /></label>
            <label className="text-xs font-semibold">{label('Phone', 'فون')}<input type="tel" dir="ltr" value={phone} onChange={(e) => setPhone(e.target.value)} className={`${inputCls} font-mono`} placeholder="03XXXXXXXXX" data-testid="input-quick-phone" /></label>
          </div>
          {profiles.length > 0 && (
            <fieldset>
              <legend className="text-xs font-semibold mb-1">{label('Saved measurements', 'محفوظ ناپ')}</legend>
              <div className="flex flex-wrap gap-1.5">
                {profiles.map((p) => (
                  <button key={p.id} type="button" aria-pressed={profileId === p.id} onClick={() => { setProfileId(p.id); setType(p.garmentType); }} className={`min-h-[44px] px-3 rounded-lg border text-xs font-bold ${profileId === p.id ? 'bg-emerald-800 text-white border-emerald-800' : 'bg-muted border-border'}`}>{p.name} · {label(garment(p.garmentType).en, garment(p.garmentType).ur)}</button>
                ))}
              </div>
            </fieldset>
          )}
          <label className="block text-xs font-semibold">{label('Garment', 'کپڑا')}
            <select value={type} onChange={(e) => { setType(e.target.value as GarmentType); if (profile && profile.garmentType !== e.target.value) setProfileId(''); }} className={inputCls} data-testid="select-quick-garment">
              {GARMENTS.map((g) => <option key={g.value} value={g.value}>{label(g.en, g.ur)}</option>)}
            </select>
          </label>
          <p className="text-[11px] text-muted-foreground">{profile && profile.garmentType === type ? label(`Using saved profile: ${profile.name}`, `محفوظ ناپ: ${profile.name}`) : type === 'gents' && lastGents ? label('Using measurements from last order', 'پچھلے آرڈر کا ناپ') : label('Standard measurements. Edit later in full form.', 'معیاری ناپ، بعد میں بدلیں')}</p>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-xs font-semibold">{label('Price (Rs)', 'قیمت')}<input type="number" inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value)} className={`${inputCls} font-mono font-bold`} data-testid="input-quick-price" /></label>
            <label className="text-xs font-semibold">{label('Delivery', 'ڈیلیوری')}<input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} data-testid="input-quick-date" /></label>
          </div>
          {err && <p role="alert" className="text-xs text-red-600">{err}</p>}
          <button type="button" onClick={save} className="w-full min-h-[52px] rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-base" data-testid="btn-quick-save">{label('Save order', 'آرڈر محفوظ کریں')}</button>
          <button type="button" onClick={() => { onOpenChange(false); onOpenFull(name || phone ? { customerName: name, phone, customerId: picked?.id } : undefined); }} className="w-full min-h-[44px] rounded-xl border border-border text-sm font-bold flex items-center justify-center gap-1.5" data-testid="btn-open-full-form"><ListChecks size={15} aria-hidden /> {label('Full 4-step form', 'مکمل فارم (4 مرحلے)')}</button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
