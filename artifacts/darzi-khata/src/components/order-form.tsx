import { useEffect, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X, Minus, Plus, CalendarIcon, Bookmark, FolderOpen, User, Trash2, Shirt } from 'lucide-react';
import { Order, OrderItem, GarmentType, Measurements } from '../types/order';
import { useTemplates } from '../hooks/use-templates';
import { useKarigars } from '../hooks/use-karigars';
import { useToast } from '@/hooks/use-toast';
import { VoiceMeasurements } from './voice-measurements';
import { getAccounts } from '../hooks/use-auth';
import { useAuthContext } from '../context/auth-context';
import { usePreferences } from '../hooks/use-preferences';
import { useCustomers } from '../hooks/use-customers';
import { GARMENTS, garment, defaultMeasurements, LEGACY_MEASUREMENTS, newItem, itemsTotal, validateItems } from '../lib/garments';
import { normalizePakistaniPhone } from '../lib/reminders';
import { MeasurementDiagram } from './measurement-diagram';
import { FabricPhotoPicker } from './fabric-photo';

const formSchema = z.object({
  customerName: z.string().min(2, 'Name is required / نام ضروری ہے'),
  phone: z.string().min(10, 'Valid phone number required / درست فون نمبر'),
  orderDate: z.string().min(1, 'Order date is required'),
  deliveryDate: z.string().min(1, 'Delivery date is required'),
  urgent: z.boolean(),
  fabric: z.string().min(2, 'Fabric info required / کپڑے کی تفصیل'),
  karigar: z.string().optional(),
  collarType: z.enum(['Normal Collar', 'Sherwani/Ban', 'Kurta Open', 'Round/Gol Gala']),
  damanType: z.enum(['Choras (Square)', 'Gol (Round)']),
  pockets: z.enum(['Front Pocket', '1 Side Pocket', '2 Side Pockets', 'Mobile Zip Pocket']),
  cuffType: z.enum(['Simple', 'Button Cuff', 'Cut Cuff']),
  specialNotes: z.string().optional(),
  advanceAmount: z.coerce.number().min(0),
});

type FormValues = z.infer<typeof formSchema>;

interface OrderFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order?: Order;
  prefill?: Partial<Order>;
  onSave: (data: Omit<Order, 'id' | 'createdAt' | 'serialNumber'>) => void;
}

const isoDay = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

function initialValues(o?: Order, p?: Partial<Order>): FormValues {
  const src = o ?? p;
  const delivery = new Date(); delivery.setDate(delivery.getDate() + 5);
  return {
    customerName: src?.customerName ?? '',
    phone: src?.phone ?? '',
    orderDate: o ? o.orderDate.split('T')[0] : isoDay(new Date()),
    deliveryDate: o ? o.deliveryDate.split('T')[0] : (p?.deliveryDate?.split('T')[0] ?? isoDay(delivery)),
    urgent: src?.urgent ?? false,
    fabric: src?.fabric ?? '',
    karigar: src?.karigar ?? '',
    collarType: src?.collarType ?? 'Normal Collar',
    damanType: src?.damanType ?? 'Choras (Square)',
    pockets: src?.pockets ?? '2 Side Pockets',
    cuffType: src?.cuffType ?? 'Simple',
    specialNotes: src?.specialNotes ?? '',
    advanceAmount: o?.advanceAmount ?? 0,
  };
}

function initialItems(o?: Order, p?: Partial<Order>): OrderItem[] {
  const src = o ?? p;
  if (src?.items?.length) return src.items.map((i) => ({ ...i, id: o ? i.id : crypto.randomUUID(), measurements: { ...i.measurements } }));
  if (src?.measurements) {
    const qty = Math.max(1, src.suitCount ?? 1);
    const total = src.totalAmount ?? 1500 * qty;
    const unit = Math.round((total / qty) * 100) / 100;
    const sameTotal = Math.abs(unit * qty - total) < 0.01;
    return [{ ...newItem('gents'), quantity: sameTotal ? qty : 1, unitPrice: sameTotal ? unit : total, measurements: { ...(src.measurements as unknown as Record<string, number>) } }];
  }
  return [newItem('gents')];
}

/** Top-level (not nested) so inputs keep focus across renders. */
function MeasureField({ fieldKey, en, ur, value, active, onFocus, onChange }: {
  fieldKey: string; en: string; ur: string; value: number; active: boolean; onFocus: () => void; onChange: (v: number) => void;
}) {
  const { label, urduFirst } = usePreferences();
  const step = (d: number) => { onFocus(); onChange(Math.max(0, Math.round(((Number(value) || 0) + d) * 10) / 10)); };
  return (
    <div className={`flex items-center justify-between gap-2 py-1.5 px-2 -mx-2 rounded-lg transition-colors ${active ? 'bg-amber-50 dark:bg-amber-950/30' : ''}`}>
      <label htmlFor={`m-${fieldKey}`} className="flex flex-col min-w-0">
        <span className={`text-sm font-semibold ${urduFirst ? 'font-urdu leading-loose' : ''}`}>{urduFirst ? ur : en}</span>
        <span className={`text-xs text-muted-foreground ${urduFirst ? '' : 'font-urdu'}`}>{urduFirst ? en : ur}</span>
      </label>
      <div className="flex items-center gap-1 bg-muted rounded-lg border border-border p-0.5 shrink-0" dir="ltr">
        <button type="button" onClick={() => step(-0.5)} className="w-11 h-11 flex items-center justify-center bg-card rounded-md border border-border active:bg-muted" aria-label={label(`Decrease ${en}`, `${ur} کم`)}><Minus size={16} /></button>
        <input id={`m-${fieldKey}`} type="number" step="0.5" inputMode="decimal" value={Number.isFinite(value) ? value : ''} onFocus={onFocus}
          onChange={(e) => onChange(e.target.value === '' ? NaN : Number(e.target.value))}
          className="w-14 h-11 text-center bg-transparent font-bold outline-none no-spinners" data-testid={`input-m-${fieldKey}`} />
        <button type="button" onClick={() => step(0.5)} className="w-11 h-11 flex items-center justify-center bg-card rounded-md border border-border active:bg-muted" aria-label={label(`Increase ${en}`, `${ur} زیادہ`)}><Plus size={16} /></button>
      </div>
    </div>
  );
}

function StepHeader({ n, en, ur }: { n: number; en: string; ur: string }) {
  const { label, urduFirst } = usePreferences();
  return (
    <h3 className="font-bold text-foreground border-b border-border pb-2 mb-3 flex justify-between items-center gap-2">
      <span className={urduFirst ? 'font-urdu leading-loose' : ''}>{label(en, ur)}</span>
      <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 px-2 py-0.5 rounded text-[10px] shrink-0">{label(`Step ${n}`, `مرحلہ ${n}`)}</span>
    </h3>
  );
}

const inputCls = 'w-full min-h-[44px] bg-muted border border-input rounded-lg px-3 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm text-foreground';

export function OrderForm({ open, onOpenChange, order, prefill, onSave }: OrderFormProps) {
  const { templates, addTemplate } = useTemplates();
  const { karigars } = useKarigars();
  const { toast } = useToast();
  const { dataOwnerId } = useAuthContext();
  const { label, urduFirst } = usePreferences();
  const { customers } = useCustomers();

  const [items, setItems] = useState<OrderItem[]>(() => initialItems(order, prefill));
  const [activeItem, setActiveItem] = useState(0);
  const [activeField, setActiveField] = useState<string>();
  const [photoId, setPhotoId] = useState<string | undefined>(order?.fabricPhotoId ?? prefill?.fabricPhotoId);
  const [itemsError, setItemsError] = useState<string>();

  const { register, handleSubmit, control, reset, watch, setError, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialValues(order, prefill),
  });

  useEffect(() => {
    if (!open) return;
    reset(initialValues(order, prefill));
    setItems(initialItems(order, prefill));
    setActiveItem(0); setActiveField(undefined); setItemsError(undefined);
    setPhotoId(order?.fabricPhotoId ?? prefill?.fabricPhotoId);
  }, [open, order, prefill, reset]);

  const total = itemsTotal(items);
  const suitCount = items.reduce((s, i) => s + (Number(i.quantity) || 0), 0);
  const advanceAmount = Number(watch('advanceAmount')) || 0;
  const baqi = total - advanceAmount;
  const current = items[Math.min(activeItem, items.length - 1)];

  const patchItem = (idx: number, patch: Partial<OrderItem>) => setItems((prev) => prev.map((it, i) => i === idx ? { ...it, ...patch } : it));
  const setMeasure = (idx: number, key: string, v: number) => setItems((prev) => prev.map((it, i) => i === idx ? { ...it, measurements: { ...it.measurements, [key]: v } } : it));
  const changeType = (idx: number, type: GarmentType) => { patchItem(idx, { garmentType: type, measurements: defaultMeasurements(type) }); setActiveField(undefined); };
  const addItem = (type: GarmentType = 'gents') => { setItems((p) => [...p, newItem(type)]); setActiveItem(items.length); setActiveField(undefined); };
  const removeItem = (idx: number) => { if (items.length <= 1) return; setItems((p) => p.filter((_, i) => i !== idx)); setActiveItem(0); setActiveField(undefined); };

  const handleSaveTemplate = () => {
    if (current.garmentType !== 'gents') return;
    const name = window.prompt(label("Template name (e.g. 'Standard Large'):", 'ٹیمپلیٹ کا نام لکھیں'));
    if (!name) return;
    const vals = watch();
    addTemplate({ name, measurements: current.measurements as unknown as Measurements, collarType: vals.collarType, damanType: vals.damanType, pockets: vals.pockets, cuffType: vals.cuffType });
    toast({ title: label('Template saved', 'ٹیمپلیٹ محفوظ') });
  };

  const handleLoadTemplate = () => {
    if (current.garmentType !== 'gents') return;
    if (templates.length === 0) { toast({ title: label('No templates yet. Save one first.', 'کوئی ٹیمپلیٹ نہیں، پہلے محفوظ کریں') }); return; }
    const choice = window.prompt(`${label('Template number', 'ٹیمپلیٹ نمبر')}:\n\n${templates.map((t, i) => `${i + 1}. ${t.name}`).join('\n')}`);
    if (!choice) return;
    const t = templates[parseInt(choice, 10) - 1];
    if (!t) { toast({ title: label('Wrong number', 'غلط نمبر'), variant: 'destructive' }); return; }
    patchItem(activeItem, { measurements: { ...(t.measurements as unknown as Record<string, number>) } });
    toast({ title: label('Template loaded', 'ٹیمپلیٹ لگ گیا'), description: t.name });
  };

  const onSubmit = (data: FormValues) => {
    const clean = items.map((i) => ({ ...i, quantity: Math.round(Number(i.quantity)), unitPrice: Number(i.unitPrice) }));
    try { validateItems(clean); setItemsError(undefined); }
    catch (e) { setItemsError(e instanceof Error ? e.message : 'Invalid garments'); return; }
    const totalAmount = itemsTotal(clean);
    if (data.advanceAmount > totalAmount) { setError('advanceAmount', { message: label('Advance cannot exceed total', 'ایڈوانس کل سے زیادہ نہیں') }); return; }
    if (order && data.advanceAmount < order.advanceAmount) { setError('advanceAmount', { message: label(`Already collected Rs ${order.advanceAmount}. Cannot reduce.`, `پہلے سے وصول ${order.advanceAmount} روپے کم نہیں ہو سکتے`) }); return; }
    if (order && totalAmount < order.advanceAmount) { setItemsError(label(`Total cannot be below collected Rs ${order.advanceAmount}`, 'کل رقم وصول شدہ سے کم نہیں')); return; }

    const linked = data.karigar
      ? getAccounts().find((a) => a.role === 'karigar' && a.ownerId === dataOwnerId && a.name.trim().toLowerCase() === data.karigar!.trim().toLowerCase())
      : undefined;
    const karigarId = linked?.id ?? (order && order.karigar === data.karigar ? order.karigarId : undefined);
    const gents = clean.find((i) => i.garmentType === 'gents');
    const legacy = (gents?.measurements as unknown as Measurements) ?? order?.measurements ?? prefill?.measurements ?? LEGACY_MEASUREMENTS;

    const norm = normalizePakistaniPhone(data.phone);
    const customerId = customers.find(c => normalizePakistaniPhone(c.phone) === norm)?.id
      ?? (order && normalizePakistaniPhone(order.phone) === norm ? order.customerId : undefined);
    // New customers are created atomically with the order by useOrders.

    try {
      onSave({
        ...(order?.payments ? { payments: order.payments } : {}),
        karigarId,
        ...data,
        totalAmount,
        suitCount: clean.reduce((s, i) => s + i.quantity, 0),
        items: clean,
        measurements: legacy,
        customerId,
        fabricPhotoId: photoId,
        orderDate: new Date(data.orderDate).toISOString(),
        deliveryDate: new Date(data.deliveryDate).toISOString(),
        status: order?.status || 'pending',
        specialNotes: data.specialNotes || '',
        karigar: data.karigar || undefined,
      });
      onOpenChange(false);
    } catch (e) {
      toast({ title: label('Could not save', 'محفوظ نہیں ہوا'), description: e instanceof Error ? e.message : undefined, variant: 'destructive' });
    }
  };

  const g = garment(current.garmentType);
  const activeMeta = g.fields.find((f) => f.key === activeField);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed inset-x-0 bottom-0 z-50 h-[94dvh] flex flex-col rounded-t-[20px] bg-background border-t overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom motion-reduce:animate-none shadow-2xl outline-none max-w-lg mx-auto sm:h-[88vh] sm:bottom-auto sm:top-[50%] sm:-translate-y-1/2 sm:rounded-[20px]">
          <div className="px-4 py-3 border-b flex justify-between items-center bg-emerald-800 text-white shrink-0">
            <div>
              <Dialog.Title className={`text-lg font-bold ${urduFirst ? 'font-urdu' : ''}`}>{order ? label('Edit Order', 'آرڈر میں تبدیلی') : label('New Order', 'نیا آرڈر')}</Dialog.Title>
              <Dialog.Description className="text-emerald-200 text-xs">{label('Four steps: customer, garments, style, bill', 'چار مرحلے: گاہک، کپڑے، ڈیزائن، حساب')}</Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button className="h-11 w-11 inline-flex items-center justify-center rounded-full hover:bg-emerald-700" aria-label={label('Close', 'بند کریں')}><X size={20} /></button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto bg-muted/40 pb-24">
            <div className="p-4 space-y-5">
              {/* Step 1 */}
              <section className="bg-card p-4 rounded-xl border border-card-border space-y-4">
                <StepHeader n={1} en="Customer Details" ur="گاہک کی تفصیل" />
                <div>
                  <label htmlFor="of-name" className="block text-sm font-semibold mb-1">{label('Customer name', 'گاہک کا نام')}</label>
                  <input id="of-name" {...register('customerName')} className={inputCls} data-testid="input-name" />
                  {errors.customerName && <p className="text-red-600 text-xs mt-1" role="alert">{errors.customerName.message}</p>}
                </div>
                <div>
                  <label htmlFor="of-phone" className="block text-sm font-semibold mb-1">{label('WhatsApp number', 'واٹس ایپ نمبر')}</label>
                  <input id="of-phone" type="tel" dir="ltr" {...register('phone')} className={`${inputCls} font-mono`} placeholder="03XXXXXXXXX" data-testid="input-phone" />
                  {errors.phone && <p className="text-red-600 text-xs mt-1" role="alert">{errors.phone.message}</p>}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="of-od" className="block text-sm font-semibold mb-1">{label('Order date', 'آرڈر تاریخ')}</label>
                    <div className="relative"><input id="of-od" type="date" {...register('orderDate')} className={`${inputCls} ps-9`} /><CalendarIcon className="absolute start-3 top-3.5 text-muted-foreground pointer-events-none" size={16} /></div>
                  </div>
                  <div>
                    <label htmlFor="of-dd" className="block text-sm font-semibold mb-1">{label('Delivery date', 'ڈیلیوری تاریخ')}</label>
                    <div className="relative"><input id="of-dd" type="date" {...register('deliveryDate')} className={`${inputCls} ps-9`} data-testid="input-delivery" /><CalendarIcon className="absolute start-3 top-3.5 text-muted-foreground pointer-events-none" size={16} /></div>
                  </div>
                </div>
                <div className="flex items-center justify-between bg-red-50 dark:bg-red-950/30 p-3 rounded-lg border border-red-100 dark:border-red-900">
                  <span className="font-bold text-red-800 dark:text-red-300">{label('Urgent', 'ہنگامی')}</span>
                  <Controller control={control} name="urgent" render={({ field }) => (
                    <button type="button" role="switch" aria-checked={field.value} aria-label={label('Urgent', 'ہنگامی')} onClick={() => field.onChange(!field.value)}
                      className="h-11 w-16 flex items-center justify-center" data-testid="toggle-urgent">
                      <span className={`w-12 h-6 rounded-full relative transition-colors ${field.value ? 'bg-red-600' : 'bg-stone-300 dark:bg-stone-600'}`}>
                        <span className={`block w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform shadow-sm ${field.value ? 'translate-x-6' : 'translate-x-0.5'}`} />
                      </span>
                    </button>
                  )} />
                </div>
                <div>
                  <label htmlFor="of-k" className="block text-sm font-semibold mb-1 flex items-center gap-1"><User size={14} /> {label('Karigar', 'کاریگر')}</label>
                  <select id="of-k" {...register('karigar')} className={inputCls} data-testid="select-karigar">
                    <option value="">{label('Not assigned', 'مقرر نہیں')}</option>
                    {karigars.map((k) => <option key={k} value={k}>{k}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="of-f" className="block text-sm font-semibold mb-1">{label('Fabric details', 'کپڑے کی تفصیل')}</label>
                  <input id="of-f" {...register('fabric')} className={inputCls} placeholder={label('e.g. White cotton', 'مثلاً سفید کاٹن')} data-testid="input-fabric" />
                  {errors.fabric && <p className="text-red-600 text-xs mt-1" role="alert">{errors.fabric.message}</p>}
                </div>
                <FabricPhotoPicker value={photoId} onChange={setPhotoId} />
              </section>

              {/* Step 2: garments */}
              <section className="bg-card p-4 rounded-xl border border-card-border">
                <StepHeader n={2} en="Garments & Measurements (inches)" ur="کپڑے اور ناپ (انچ)" />
                <div className="flex gap-2 overflow-x-auto pb-2 mb-3 no-scrollbar" role="tablist" aria-label={label('Garments', 'کپڑے')}>
                  {items.map((it, i) => {
                    const gi = garment(it.garmentType);
                    return (
                      <button key={it.id} type="button" role="tab" aria-selected={i === activeItem} onClick={() => { setActiveItem(i); setActiveField(undefined); }}
                        className={`shrink-0 min-h-[44px] px-3 rounded-lg border text-xs font-bold flex items-center gap-1.5 ${i === activeItem ? 'bg-emerald-800 text-white border-emerald-800' : 'bg-muted border-border'}`} data-testid={`tab-item-${i}`}>
                        <Shirt size={14} aria-hidden /> {i + 1}. {label(gi.en, gi.ur)} x{it.quantity}
                      </button>
                    );
                  })}
                  <button type="button" onClick={() => addItem()} className="shrink-0 min-h-[44px] px-3 rounded-lg border border-dashed border-emerald-600 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-1" data-testid="btn-add-item">
                    <Plus size={14} /> {label('Add garment', 'کپڑا شامل')}
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-[1fr_auto] gap-2 items-end">
                    <div>
                      <label htmlFor="of-gt" className="block text-xs font-semibold mb-1">{label('Garment type', 'کپڑے کی قسم')}</label>
                      <select id="of-gt" value={current.garmentType} onChange={(e) => changeType(activeItem, e.target.value as GarmentType)} className={inputCls} data-testid="select-garment">
                        {GARMENTS.map((gg) => <option key={gg.value} value={gg.value}>{label(gg.en, gg.ur)}</option>)}
                      </select>
                    </div>
                    <button type="button" disabled={items.length <= 1} onClick={() => removeItem(activeItem)} className="h-11 w-11 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-red-600 disabled:opacity-40" aria-label={label('Remove this garment', 'یہ کپڑا ہٹائیں')} data-testid="btn-remove-item"><Trash2 size={16} /></button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="block text-xs font-semibold mb-1">{label('Quantity', 'تعداد')}</span>
                      <div className="flex items-center gap-1 bg-muted rounded-lg border border-border p-0.5" dir="ltr">
                        <button type="button" onClick={() => patchItem(activeItem, { quantity: Math.max(1, current.quantity - 1) })} className="w-11 h-11 flex items-center justify-center bg-card rounded-md border border-border" aria-label={label('Fewer', 'کم')}><Minus size={16} /></button>
                        <input type="number" aria-label={label('Quantity', 'تعداد')} value={current.quantity} onChange={(e) => patchItem(activeItem, { quantity: Number(e.target.value) })} className="flex-1 w-full text-center bg-transparent font-bold outline-none no-spinners" data-testid="input-qty" />
                        <button type="button" onClick={() => patchItem(activeItem, { quantity: Math.min(50, current.quantity + 1) })} className="w-11 h-11 flex items-center justify-center bg-card rounded-md border border-border" aria-label={label('More', 'زیادہ')}><Plus size={16} /></button>
                      </div>
                    </div>
                    <div>
                      <label htmlFor="of-up" className="block text-xs font-semibold mb-1">{label('Price each (Rs)', 'فی کپڑا قیمت')}</label>
                      <input id="of-up" type="number" inputMode="numeric" value={Number.isFinite(current.unitPrice) ? current.unitPrice : ''} onChange={(e) => patchItem(activeItem, { unitPrice: e.target.value === '' ? NaN : Number(e.target.value) })} className={`${inputCls} font-mono font-bold`} data-testid="input-unit-price" />
                    </div>
                  </div>

                  <MeasurementDiagram garmentType={current.garmentType} active={activeField} activeLabel={activeMeta ? label(activeMeta.en, activeMeta.ur) : undefined} />

                  {current.garmentType === 'gents' && (
                    <>
                      <div className="flex gap-2">
                        <button type="button" onClick={handleLoadTemplate} className="flex-1 min-h-[44px] flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg"><FolderOpen size={14} /> {label('Load template', 'ٹیمپلیٹ لگائیں')}</button>
                        <button type="button" onClick={handleSaveTemplate} className="flex-1 min-h-[44px] flex items-center justify-center gap-1.5 text-xs font-bold bg-card border border-border rounded-lg"><Bookmark size={14} /> {label('Save template', 'ٹیمپلیٹ محفوظ')}</button>
                      </div>
                      <VoiceMeasurements onConfirm={(vals) => {
                        setItems((prev) => prev.map((it, i) => i === activeItem ? { ...it, measurements: { ...it.measurements, ...(vals as Record<string, number>) } } : it));
                        toast({ title: label('Measurements applied', 'ناپ لگ گئے'), description: label('Check before saving', 'محفوظ کرنے سے پہلے دیکھ لیں') });
                      }} />
                    </>
                  )}

                  <div>
                    {g.fields.map((f) => (
                      <MeasureField key={`${current.id}-${f.key}`} fieldKey={f.key} en={f.en} ur={f.ur} value={current.measurements[f.key]}
                        active={activeField === f.key} onFocus={() => setActiveField(f.key)} onChange={(v) => setMeasure(activeItem, f.key, v)} />
                    ))}
                  </div>
                  <div>
                    <label htmlFor="of-in" className="block text-xs font-semibold mb-1">{label('Notes for this garment', 'اس کپڑے کے نوٹس')}</label>
                    <input id="of-in" value={current.notes ?? ''} onChange={(e) => patchItem(activeItem, { notes: e.target.value })} className={inputCls} />
                  </div>
                </div>
                {itemsError && <p className="text-red-600 text-xs mt-3" role="alert">{itemsError}</p>}
              </section>

              {/* Step 3 */}
              <section className="bg-card p-4 rounded-xl border border-card-border space-y-4">
                <StepHeader n={3} en="Style" ur="ڈیزائن" />
                <div className="grid grid-cols-2 gap-3">
                  <div><label htmlFor="of-c" className="block text-xs font-semibold mb-1">{label('Collar', 'کالر / گلا')}</label>
                    <select id="of-c" {...register('collarType')} className={inputCls}><option value="Normal Collar">Normal Collar</option><option value="Sherwani/Ban">Sherwani/Ban</option><option value="Kurta Open">Kurta Open</option><option value="Round/Gol Gala">Round/Gol Gala</option></select></div>
                  <div><label htmlFor="of-d" className="block text-xs font-semibold mb-1">{label('Hem', 'دامن')}</label>
                    <select id="of-d" {...register('damanType')} className={inputCls}><option value="Choras (Square)">Choras (Square)</option><option value="Gol (Round)">Gol (Round)</option></select></div>
                  <div><label htmlFor="of-p" className="block text-xs font-semibold mb-1">{label('Pockets', 'جیبیں')}</label>
                    <select id="of-p" {...register('pockets')} className={inputCls}><option value="Front Pocket">Front Pocket</option><option value="1 Side Pocket">1 Side Pocket</option><option value="2 Side Pockets">2 Side Pockets</option><option value="Mobile Zip Pocket">Mobile Zip Pocket</option></select></div>
                  <div><label htmlFor="of-cf" className="block text-xs font-semibold mb-1">{label('Cuff', 'کف')}</label>
                    <select id="of-cf" {...register('cuffType')} className={inputCls}><option value="Simple">Simple</option><option value="Button Cuff">Button Cuff</option><option value="Cut Cuff">Cut Cuff</option></select></div>
                </div>
                <div>
                  <label htmlFor="of-sn" className="block text-xs font-semibold mb-1">{label('Special notes', 'خاص ہدایات')}</label>
                  <textarea id="of-sn" {...register('specialNotes')} rows={3} className="w-full bg-muted border border-input rounded-lg px-3 py-2 outline-none focus:border-emerald-500 text-sm resize-none" />
                </div>
              </section>

              {/* Step 4 */}
              <section className="bg-card p-4 rounded-xl border border-card-border border-b-4 border-b-emerald-600 space-y-3">
                <StepHeader n={4} en="Bill" ur="حساب کتاب" />
                <ul className="text-sm space-y-1" data-testid="list-bill-items">
                  {items.map((it, i) => {
                    const gi = garment(it.garmentType);
                    return <li key={it.id} className="flex justify-between gap-2 border-b border-dotted border-border pb-1"><span>{i + 1}. {label(gi.en, gi.ur)} x{it.quantity}</span><span className="font-mono" dir="ltr">Rs {((Number(it.unitPrice) || 0) * (Number(it.quantity) || 0)).toLocaleString()}</span></li>;
                  })}
                </ul>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="block text-xs font-bold mb-1">{label('Total', 'کل سلائی')} ({suitCount} {label('pcs', 'جوڑے')})</span>
                    <div className="min-h-[48px] px-3 flex items-center rounded-lg bg-muted border border-border text-lg font-bold font-mono" dir="ltr" data-testid="text-total">Rs {total.toLocaleString()}</div>
                  </div>
                  <div>
                    <label htmlFor="of-adv" className="block text-xs font-bold mb-1">{label('Advance paid', 'ایڈوانس')}</label>
                    <input id="of-adv" type="number" inputMode="numeric" {...register('advanceAmount')} min={order?.advanceAmount ?? 0} className={`${inputCls} min-h-[48px] text-lg font-bold font-mono text-emerald-700 dark:text-emerald-300`} />
                  </div>
                </div>
                {errors.advanceAmount && <p className="text-red-600 text-xs" role="alert">{errors.advanceAmount.message}</p>}
                {order && order.advanceAmount > 0 && <p className="text-[11px] text-muted-foreground">{label('Use Receive payment for new money. Payment history is kept.', 'نئی رقم کے لیے ادائیگی بٹن استعمال کریں، پرانا حساب محفوظ ہے')}</p>}
                <div className={`p-4 rounded-xl border flex justify-between items-center ${baqi > 0 ? 'bg-red-50 border-red-100 dark:bg-red-950/30 dark:border-red-900' : 'bg-emerald-50 border-emerald-100 dark:bg-emerald-950/30 dark:border-emerald-900'}`}>
                  <span className="font-bold">{label('Balance', 'باقی رقم')}</span>
                  <span className={`text-2xl font-bold font-mono ${baqi > 0 ? 'text-red-600' : 'text-emerald-600'}`} dir="ltr">Rs {baqi.toLocaleString()}</span>
                </div>
              </section>
            </div>
          </form>

          <div className="absolute bottom-0 inset-x-0 bg-card border-t p-3 flex gap-3 z-10">
            <Dialog.Close asChild>
              <button type="button" className="min-h-[48px] px-5 rounded-xl border border-border font-bold w-1/3 text-sm">{label('Cancel', 'منسوخ')}</button>
            </Dialog.Close>
            <button onClick={handleSubmit(onSubmit)} className="flex-1 min-h-[48px] bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-sm" data-testid="btn-save-order">
              {label('Save', 'محفوظ کریں')}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
