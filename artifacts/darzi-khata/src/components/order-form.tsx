import { entry, DICT, type DictKey } from '../lib/i18n';
import { haptic } from '../lib/haptics';
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
import { useSettings } from '../hooks/use-settings';
import { useCustomers } from '../hooks/use-customers';
import { GARMENTS, garment, defaultMeasurements, LEGACY_MEASUREMENTS, newItem, itemsTotal, validateItems } from '../lib/garments';
import { normalizePakistaniPhone } from '../lib/reminders';
import { MeasurementDiagram } from './measurement-diagram';
import { FabricPhotoPicker } from './fabric-photo';
import { Dialog as ListDialog, DialogContent as ListContent, DialogTitle as ListTitle, DialogDescription as ListDescription } from './page-dialog';

/** 03XXXXXXXXX, 923XXXXXXXXX or +92 3XX XXXXXXX. */
export function isPakistaniMobile(v: string) {
  return /^(?:0|92|0092)?3\d{9}$/.test(v.replace(/[\s+-]/g, ''));
}
const STEPS = [entry('d_customer'), entry('d_measurements'), entry('d_style'), entry('d_bill')];

const formSchema = z.object({
  customerName: z.string().trim().min(2, 'm_name_is_required'),
  phone: z.string().refine((v) => isPakistaniMobile(v), 'm_phone_must_be_03xxxxxxxxx'),
  orderDate: z.string().min(1, 'm_order_date_is_required'),
  deliveryDate: z.string().min(1, 'm_delivery_date_is_required'),
  urgent: z.boolean(),
  fabric: z.string().min(2, 'm_fabric_info_required'),
  karigar: z.string().optional(),
  collarType: z.enum(['Normal Collar', 'Sherwani/Ban', 'Kurta Open', 'Round/Gol Gala']),
  damanType: z.enum(['Choras (Square)', 'Gol (Round)']),
  pockets: z.enum(['Front Pocket', '1 Side Pocket', '2 Side Pockets', 'Mobile Zip Pocket']),
  cuffType: z.enum(['Simple', 'Button Cuff', 'Cut Cuff']),
  specialNotes: z.string().optional(),
  advanceAmount: z.coerce.number().min(0),
});

type FormValues = z.infer<typeof formSchema>;
type FormInput = z.input<typeof formSchema>;

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
function MeasureField({ fieldKey, tk, value, active, onFocus, onChange }: {
  fieldKey: string; tk: DictKey; value: number; active: boolean; onFocus: () => void; onChange: (v: number) => void;
}) {
  const { label, urduFirst } = usePreferences();
  const { en, ur } = DICT[tk];
  const step = (d: number) => { onFocus(); onChange(Math.max(0, Math.round(((Number(value) || 0) + d) * 10) / 10)); };
  return (
    <div className={`flex items-center justify-between gap-2 py-1.5 px-2 -mx-2 rounded-lg transition-colors ${active ? 'bg-warning-soft ' : ''}`}>
      <label htmlFor={`m-${fieldKey}`} className="flex flex-col min-w-0">
        <span className={`text-sm font-semibold ${urduFirst ? 'font-urdu' : ''}`} lang={urduFirst ? 'ur' : 'en'}>{urduFirst ? ur : en}</span>
      </label>
      <div className="flex items-center gap-1 bg-muted rounded-lg border border-border p-0.5 shrink-0" dir="ltr">
        <button type="button" onClick={() => step(-0.5)} className="w-11 h-11 flex items-center justify-center bg-card rounded-md border border-border active:bg-muted" aria-label={label('t_decrease_n', { fieldEn: en, fieldUr: ur })}><Minus size={16} /></button>
        <input id={`m-${fieldKey}`} type="number" step="0.5" inputMode="decimal" value={Number.isFinite(value) ? value : ''} onFocus={onFocus}
          onChange={(e) => onChange(e.target.value === '' ? NaN : Number(e.target.value))}
          className="w-14 h-11 text-center bg-transparent font-bold outline-none no-spinners" data-testid={`input-m-${fieldKey}`} />
        <button type="button" onClick={() => step(0.5)} className="w-11 h-11 flex items-center justify-center bg-card rounded-md border border-border active:bg-muted" aria-label={label('t_increase_n', { fieldEn: en, fieldUr: ur })}><Plus size={16} /></button>
      </div>
    </div>
  );
}

function StepHeader({ n, tk }: { n: number; tk: DictKey }) {
  const { label } = usePreferences();
  return (
    <h3 className="font-bold text-foreground border-b border-border pb-2 mb-3 flex justify-between items-center gap-2">
      <span>{label(tk)}</span>
      <span className="bg-primary-soft text-primary   px-2 py-0.5 rounded text-xs shrink-0">{label('t_step_n', { n })}</span>
    </h3>
  );
}

const inputCls = 'w-full min-h-[44px] bg-muted border border-input rounded-lg px-3 outline-none focus:border-primary focus:ring-1 focus:ring-ring text-sm text-foreground';

export function OrderForm({ open, onOpenChange, order, prefill, onSave }: OrderFormProps) {
  const { templates, addTemplate } = useTemplates();
  const { karigars } = useKarigars();
  const { toast } = useToast();
  const { dataOwnerId } = useAuthContext();
  const { label, one, urduFirst } = usePreferences();
  const { customers } = useCustomers();
  const { settings } = useSettings();
  const homeBased = settings.shopType === 'women-home-tailor';
  const garments = homeBased ? [...GARMENTS].sort((a, b) => Number(!a.value.startsWith('ladies')) - Number(!b.value.startsWith('ladies'))) : GARMENTS;

  const [items, setItems] = useState<OrderItem[]>(() => initialItems(order, prefill));
  const [activeItem, setActiveItem] = useState(0);
  const [activeField, setActiveField] = useState<string>();
  const [photoId, setPhotoId] = useState<string | undefined>(order?.fabricPhotoId ?? prefill?.fabricPhotoId);
  const [itemsError, setItemsError] = useState<string>();
  const [templateMode, setTemplateMode] = useState<'save' | 'load' | null>(null);
  const [templateName, setTemplateName] = useState('');

  const [step, setStep] = useState(0);
  const { register, handleSubmit, control, reset, watch, setError, trigger, getValues, formState: { errors } } = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialValues(order, prefill),
  });

  useEffect(() => {
    if (!open) return;
    setStep(0);
    reset(initialValues(order, prefill));
    setItems(!order && !prefill && homeBased ? [newItem('ladies-shirt')] : initialItems(order, prefill));
    setActiveItem(0); setActiveField(undefined); setItemsError(undefined);
    setPhotoId(order?.fabricPhotoId ?? prefill?.fabricPhotoId);
  }, [open, order, prefill, reset, homeBased]);

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
    setTemplateName(''); setTemplateMode('save');
  };
  const saveNamedTemplate = () => {
    const name = templateName.trim();
    if (!name || !current) return;
    const vals = watch();
    addTemplate({ name, measurements: { ...current.measurements } as unknown as Measurements, collarType: vals.collarType, damanType: vals.damanType, pockets: vals.pockets, cuffType: vals.cuffType });
    setTemplateMode(null);
    toast({ title: label('template_saved') });
  };

  const handleLoadTemplate = () => {
    if (current.garmentType !== 'gents') return;
    if (templates.length === 0) { toast({ title: label('no_templates_yet_save_one_first') }); return; }
    setTemplateMode('load');
  };

  const deliveryInPast = (v: string) => {
    if (order) return false; // editing an old order may keep its original date
    const d = new Date(v); const today = new Date(); today.setHours(0, 0, 0, 0);
    return Number.isFinite(d.getTime()) && new Date(d.getFullYear(), d.getMonth(), d.getDate()) < today;
  };
  const next = async () => {
    if (step === 0) {
      const ok = await trigger(['customerName', 'phone', 'orderDate', 'deliveryDate', 'fabric']);
      if (!ok) return;
      if (deliveryInPast(getValues('deliveryDate'))) { setError('deliveryDate', { message: label('k_delivery_past') }); return; }
    }
    if (step === 1) {
      try { validateItems(items.map((i) => ({ ...i, quantity: Math.round(Number(i.quantity)), unitPrice: Number(i.unitPrice) }))); setItemsError(undefined); }
      catch (e) { setItemsError(e instanceof Error ? e.message : label('k_check_garments')); return; }
    }
    setStep((s) => Math.min(3, s + 1));
  };
  const onInvalid = (errs: Partial<Record<keyof FormValues, unknown>>) => {
    if (errs.customerName || errs.phone || errs.orderDate || errs.deliveryDate || errs.fabric) setStep(0);
    else if (errs.collarType || errs.damanType || errs.pockets || errs.cuffType) setStep(2);
  };

  const onSubmit = (data: FormValues) => {
    if (deliveryInPast(data.deliveryDate)) { setError('deliveryDate', { message: label('k_delivery_past') }); setStep(0); return; }
    const clean = items.map((i) => ({ ...structuredClone(i), quantity: Math.round(Number(i.quantity)), unitPrice: Number(i.unitPrice) }));
    try { validateItems(clean); setItemsError(undefined); }
    catch (e) { setItemsError(e instanceof Error ? e.message : label('k_check_garments')); setStep(1); return; }
    const totalAmount = itemsTotal(clean);
    if (data.advanceAmount > totalAmount) { setError('advanceAmount', { message: label('advance_cannot_exceed_total') }); return; }
    if (order && data.advanceAmount < order.advanceAmount) { setError('advanceAmount', { message: label('t_already_collected_rs_n_cannot_reduce', { advanceAmount: order.advanceAmount }) }); return; }
    if (order && totalAmount < order.advanceAmount) { setItemsError(label('t_total_cannot_be_below_collected_rs_n', { advanceAmount: order.advanceAmount })); return; }

    const linked = data.karigar
      ? getAccounts().find((a) => a.role === 'karigar' && a.ownerId === dataOwnerId && a.name.trim().toLowerCase() === data.karigar!.trim().toLowerCase())
      : undefined;
    const karigarId = linked?.id ?? (order && order.karigar === data.karigar ? order.karigarId : undefined);
    const gents = clean.find((i) => i.garmentType === 'gents');
    const legacy = (gents?.measurements as unknown as Measurements) ?? order?.measurements ?? prefill?.measurements ?? LEGACY_MEASUREMENTS;

    const customerId = order?.customerId ?? prefill?.customerId ?? crypto.randomUUID();
    // New customers are created atomically with the order by useOrders.

    try {
      onSave({
        ...(order?.payments ? { payments: order.payments } : {}),
        karigarId,
        ...data,
        totalAmount,
        suitCount: clean.reduce((s, i) => s + i.quantity, 0),
        items: clean,
        measurements: { ...legacy },
        customerId,
        fabricPhotoId: photoId,
        orderDate: new Date(data.orderDate).toISOString(),
        deliveryDate: new Date(data.deliveryDate).toISOString(),
        status: order?.status || 'pending',
        specialNotes: data.specialNotes || '',
        karigar: data.karigar || undefined,
      });
      haptic();
      onOpenChange(false);
    } catch (e) {
      toast({ title: label('could_not_save'), description: e instanceof Error ? e.message : undefined, variant: 'destructive' });
    }
  };

  const g = garment(current.garmentType);
  const activeMeta = g.fields.find((f) => f.key === activeField);

  return (
    <>
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-foreground/60 z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed inset-x-0 bottom-0 z-50 h-[94dvh] flex flex-col rounded-t-lg bg-background border-t overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom motion-reduce:animate-none  outline-none max-w-lg lg:max-w-[560px] mx-auto sm:h-[88vh] sm:bottom-auto sm:top-[50%] sm:-translate-y-1/2 sm:rounded-lg">
          <div className="px-4 py-3 border-b flex justify-between items-center bg-card text-foreground border-border shrink-0">
            <div>
              <Dialog.Title className={"text-lg font-bold"}>{order ? label('edit_order') : label('new_order_2')}</Dialog.Title>
              <Dialog.Description className="text-muted-foreground text-sm">{label('four_steps_customer_garments_style_bill')}</Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button className="h-11 w-11 inline-flex items-center justify-center rounded-full hover:bg-muted" aria-label={label('close')}><X size={20} /></button>
            </Dialog.Close>
          </div>

          <ol className="grid grid-cols-4 gap-1 px-3 py-2 border-b border-border bg-card shrink-0" aria-label={label('k_steps')}>
            {STEPS.map((s, i) => (
              <li key={s.tk}>
                <button type="button" onClick={() => { if (i <= step) setStep(i); else void next(); }} aria-current={i === step ? 'step' : undefined}
                  className={`w-full min-h-[44px] flex flex-col items-center justify-center gap-0.5 rounded-md text-sm ${i === step ? 'text-primary font-semibold' : i < step ? 'text-foreground' : 'text-muted-foreground'}`} data-testid={`step-${i + 1}`}>
                  <span className={`h-1 w-full rounded-sm ${i <= step ? 'bg-primary' : 'bg-border'}`} aria-hidden />
                  <span className="num">{i + 1}.</span> <span lang={urduFirst ? 'ur' : 'en'}>{one(s.tk)}</span>
                </button>
              </li>
            ))}
          </ol>
          <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="flex-1 overflow-y-auto bg-background pb-24">
            <div className="p-4 space-y-5">
              {/* Step 1 */}
              <section hidden={step !== 0} className="bg-card p-4 rounded-lg border border-card-border space-y-4">
                <StepHeader n={1} tk="step_customer_details" />
                <div>
                  <label htmlFor="of-name" className="block text-sm font-semibold mb-1">{label('customer_name')}</label>
                  <input id="of-name" {...register('customerName')} className={inputCls} data-testid="input-name" />
                  {errors.customerName && <p className="text-danger text-sm mt-1" role="alert">{label(errors.customerName.message ?? '')}</p>}
                </div>
                <div>
                  <label htmlFor="of-phone" className="block text-sm font-semibold mb-1">{label('whatsapp_number')}</label>
                  <input id="of-phone" type="tel" dir="ltr" {...register('phone')} className={`${inputCls} font-mono`} placeholder="03XXXXXXXXX" data-testid="input-phone" />
                  {errors.phone && <p className="text-danger text-sm mt-1" role="alert">{label(errors.phone.message ?? '')}</p>}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="of-od" className="block text-sm font-semibold mb-1">{label('order_date')}</label>
                    <div className="relative"><input id="of-od" type="date" {...register('orderDate')} className={`${inputCls} ps-9`} /><CalendarIcon className="absolute start-3 top-3.5 text-muted-foreground pointer-events-none" size={16} /></div>
                    {errors.orderDate && <p className="text-danger text-sm mt-1" role="alert">{label(errors.orderDate.message ?? '')}</p>}
                  </div>
                  <div>
                    <label htmlFor="of-dd" className="block text-sm font-semibold mb-1">{label('delivery_date')}</label>
                    <div className="relative"><input id="of-dd" type="date" {...register('deliveryDate')} className={`${inputCls} ps-9`} data-testid="input-delivery" /><CalendarIcon className="absolute start-3 top-3.5 text-muted-foreground pointer-events-none" size={16} /></div>
                    {errors.deliveryDate && <p className="text-danger text-sm mt-1" role="alert">{label(errors.deliveryDate.message ?? '')}</p>}
                  </div>
                </div>
                <div className="flex items-center justify-between bg-danger-soft  p-3 rounded-lg border border-border ">
                  <span className="font-bold text-danger ">{label('urgent')}</span>
                  <Controller control={control} name="urgent" render={({ field }) => (
                    <button type="button" role="switch" aria-checked={field.value} aria-label={label('urgent')} onClick={() => field.onChange(!field.value)}
                      className="h-11 w-16 flex items-center justify-center" data-testid="toggle-urgent">
                      <span className={`w-12 h-6 rounded-full relative transition-colors ${field.value ? 'bg-danger' : 'bg-muted '}`}>
                        <span className={`block w-5 h-5 bg-card rounded-full absolute top-0.5 transition-transform  ${field.value ? 'translate-x-6' : 'translate-x-0.5'}`} />
                      </span>
                    </button>
                  )} />
                </div>
                <div>
                  <label htmlFor="of-k" className="block text-sm font-semibold mb-1 flex items-center gap-1"><User size={14} /> {label('karigar')}</label>
                  <select id="of-k" {...register('karigar')} className={inputCls} data-testid="select-karigar">
                    <option value="">{label('not_assigned')}</option>
                    {karigars.map((k) => <option key={k} value={k}>{k}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="of-f" className="block text-sm font-semibold mb-1">{label('fabric_details')}</label>
                  <input id="of-f" {...register('fabric')} className={inputCls} placeholder={label('e_g_white_cotton')} data-testid="input-fabric" />
                  {errors.fabric && <p className="text-danger text-sm mt-1" role="alert">{label(errors.fabric.message ?? '')}</p>}
                </div>
                <FabricPhotoPicker value={photoId} onChange={setPhotoId} />
              </section>

              {/* Step 2: garments */}
              <section hidden={step !== 1} className="bg-card p-4 rounded-lg border border-card-border">
                <StepHeader n={2} tk="step_garments_measurements" />
                <div className="flex gap-2 overflow-x-auto pb-2 mb-3 no-scrollbar" role="tablist" aria-label={label('garments')}>
                  {items.map((it, i) => {
                    const gi = garment(it.garmentType);
                    return (
                      <button key={it.id} type="button" role="tab" aria-selected={i === activeItem} onClick={() => { setActiveItem(i); setActiveField(undefined); }}
                        className={`shrink-0 min-h-[44px] px-3 rounded-lg border text-sm font-bold flex items-center gap-1.5 ${i === activeItem ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted border-border'}`} data-testid={`tab-item-${i}`}>
                        <Shirt size={14} aria-hidden /> {i + 1}. {label(gi.tk)} x{it.quantity}
                      </button>
                    );
                  })}
                  <button type="button" onClick={() => addItem()} className="shrink-0 min-h-[44px] px-3 rounded-lg border border-dashed border-primary text-primary  text-sm font-bold flex items-center gap-1" data-testid="btn-add-item">
                    <Plus size={14} /> {label('add_garment')}
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-[1fr_auto] gap-2 items-end">
                    <div>
                      <label htmlFor="of-gt" className="block text-sm font-semibold mb-1">{label('garment_type')}</label>
                      <select id="of-gt" value={current.garmentType} onChange={(e) => changeType(activeItem, e.target.value as GarmentType)} className={inputCls} data-testid="select-garment">
                        {garments.map((gg) => <option key={gg.value} value={gg.value}>{label(gg.tk)}</option>)}
                      </select>
                    </div>
                    <button type="button" disabled={items.length <= 1} onClick={() => removeItem(activeItem)} className="h-11 w-11 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-danger disabled:opacity-40" aria-label={label('remove_this_garment')} data-testid="btn-remove-item"><Trash2 size={16} /></button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="block text-sm font-semibold mb-1">{label('quantity')}</span>
                      <div className="flex items-center gap-1 bg-muted rounded-lg border border-border p-0.5" dir="ltr">
                        <button type="button" onClick={() => patchItem(activeItem, { quantity: Math.max(1, current.quantity - 1) })} className="w-11 h-11 flex items-center justify-center bg-card rounded-md border border-border" aria-label={label('fewer')}><Minus size={16} /></button>
                        <input type="number" aria-label={label('quantity')} value={current.quantity} onChange={(e) => patchItem(activeItem, { quantity: Number(e.target.value) })} className="flex-1 w-full text-center bg-transparent font-bold outline-none no-spinners" data-testid="input-qty" />
                        <button type="button" onClick={() => patchItem(activeItem, { quantity: Math.min(50, current.quantity + 1) })} className="w-11 h-11 flex items-center justify-center bg-card rounded-md border border-border" aria-label={label('more')}><Plus size={16} /></button>
                      </div>
                    </div>
                    <div>
                      <label htmlFor="of-up" className="block text-sm font-semibold mb-1">{label('price_each_rs')}</label>
                      <input id="of-up" type="number" inputMode="numeric" value={Number.isFinite(current.unitPrice) ? current.unitPrice : ''} onChange={(e) => patchItem(activeItem, { unitPrice: e.target.value === '' ? NaN : Number(e.target.value) })} className={`${inputCls} font-mono font-bold`} data-testid="input-unit-price" />
                    </div>
                  </div>

                  <MeasurementDiagram garmentType={current.garmentType} active={activeField} activeLabel={activeMeta ? label(activeMeta.tk) : undefined} />

                  {current.garmentType === 'gents' && (
                    <>
                      <div className="flex gap-2">
                        <button type="button" onClick={handleLoadTemplate} className="flex-1 min-h-[44px] flex items-center justify-center gap-1.5 text-sm font-bold text-primary  bg-primary-soft  rounded-lg"><FolderOpen size={14} /> {label('load_template')}</button>
                        <button type="button" onClick={handleSaveTemplate} className="flex-1 min-h-[44px] flex items-center justify-center gap-1.5 text-sm font-bold bg-card border border-border rounded-lg"><Bookmark size={14} /> {label('save_template')}</button>
                      </div>
                      <VoiceMeasurements onConfirm={(vals) => {
                        setItems((prev) => prev.map((it, i) => i === activeItem ? { ...it, measurements: { ...it.measurements, ...(vals as Record<string, number>) } } : it));
                        toast({ title: label('measurements_applied'), description: label('check_before_saving') });
                      }} />
                    </>
                  )}

                  <div className="sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:gap-x-6" data-testid="measurement-grid">
                    {g.fields.map((f) => (
                      <MeasureField key={`${current.id}-${f.key}`} fieldKey={f.key} tk={f.tk} value={current.measurements[f.key]}
                        active={activeField === f.key} onFocus={() => setActiveField(f.key)} onChange={(v) => setMeasure(activeItem, f.key, v)} />
                    ))}
                  </div>
                  <div>
                    <label htmlFor="of-in" className="block text-sm font-semibold mb-1">{label('notes_for_this_garment')}</label>
                    <input id="of-in" value={current.notes ?? ''} onChange={(e) => patchItem(activeItem, { notes: e.target.value })} className={inputCls} />
                  </div>
                </div>
                {itemsError && <p className="text-danger text-sm mt-3" role="alert">{itemsError}</p>}
              </section>

              {/* Step 3 */}
              <section hidden={step !== 2} className="bg-card p-4 rounded-lg border border-card-border space-y-4">
                <StepHeader n={3} tk="step_style" />
                <div className="grid grid-cols-2 gap-3">
                  <div><label htmlFor="of-c" className="block text-sm font-semibold mb-1">{label('collar')}</label>
                    <select id="of-c" {...register('collarType')} className={inputCls}><option value="Normal Collar">{label('collar_normal')}</option><option value="Sherwani/Ban">{label('collar_ban')}</option><option value="Kurta Open">{label('collar_kurta')}</option><option value="Round/Gol Gala">{label('collar_round')}</option></select></div>
                  <div><label htmlFor="of-d" className="block text-sm font-semibold mb-1">{label('hem')}</label>
                    <select id="of-d" {...register('damanType')} className={inputCls}><option value="Choras (Square)">{label('daman_square')}</option><option value="Gol (Round)">{label('daman_round')}</option></select></div>
                  <div><label htmlFor="of-p" className="block text-sm font-semibold mb-1">{label('pockets')}</label>
                    <select id="of-p" {...register('pockets')} className={inputCls}><option value="Front Pocket">{label('pocket_front')}</option><option value="1 Side Pocket">{label('pocket_1side')}</option><option value="2 Side Pockets">{label('pocket_2side')}</option><option value="Mobile Zip Pocket">{label('pocket_zip')}</option></select></div>
                  <div><label htmlFor="of-cf" className="block text-sm font-semibold mb-1">{label('cuff')}</label>
                    <select id="of-cf" {...register('cuffType')} className={inputCls}><option value="Simple">{label('cuff_simple')}</option><option value="Button Cuff">{label('cuff_button')}</option><option value="Cut Cuff">{label('cuff_cut')}</option></select></div>
                </div>
                <div>
                  <label htmlFor="of-sn" className="block text-sm font-semibold mb-1">{label('special_notes')}</label>
                  <textarea id="of-sn" {...register('specialNotes')} rows={3} className="w-full bg-muted border border-input rounded-lg px-3 py-2 outline-none focus:border-primary text-sm resize-none" />
                </div>
              </section>

              {/* Step 4 */}
              <section hidden={step !== 3} className="bg-card p-4 rounded-lg border border-card-border space-y-3">
                <StepHeader n={4} tk="step_bill" />
                <ul className="text-sm space-y-1" data-testid="list-bill-items">
                  {items.map((it, i) => {
                    const gi = garment(it.garmentType);
                    return <li key={it.id} className="flex justify-between gap-2 border-b border-dotted border-border pb-1"><span>{i + 1}. {label(gi.tk)} x{it.quantity}</span><span className="font-mono" dir="ltr">Rs {((Number(it.unitPrice) || 0) * (Number(it.quantity) || 0)).toLocaleString()}</span></li>;
                  })}
                </ul>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="block text-sm font-bold mb-1">{label('total')} ({suitCount} {label('pcs')})</span>
                    <div className="min-h-[48px] px-3 flex items-center rounded-lg bg-muted border border-border text-lg font-bold font-mono" dir="ltr" data-testid="text-total">Rs {total.toLocaleString()}</div>
                  </div>
                  <div>
                    <label htmlFor="of-adv" className="block text-sm font-bold mb-1">{label('advance_paid')}</label>
                    <input id="of-adv" type="number" inputMode="numeric" {...register('advanceAmount')} min={order?.advanceAmount ?? 0} className={`${inputCls} min-h-[48px] text-lg font-bold font-mono text-primary `} />
                  </div>
                </div>
                {errors.advanceAmount && <p className="text-danger text-sm" role="alert">{label(errors.advanceAmount.message ?? '')}</p>}
                {order && order.advanceAmount > 0 && <p className="text-xs text-muted-foreground">{label('use_receive_payment_for_new_money_paymen')}</p>}
                <div className={`p-4 rounded-lg border flex justify-between items-center ${baqi > 0 ? 'bg-danger-soft border-border  ' : 'bg-primary-soft border-border  '}`}>
                  <span className="font-bold">{label('balance')}</span>
                  <span className={`text-2xl font-bold font-mono ${baqi > 0 ? 'text-danger' : 'text-primary'}`} dir="ltr">Rs {baqi.toLocaleString()}</span>
                </div>
              </section>
            </div>
          </form>

          <div className="absolute bottom-0 inset-x-0 bg-card border-t p-3 flex gap-3 z-10">
            {step === 0 ? (
              <Dialog.Close asChild>
                <button type="button" className="min-h-[48px] px-4 rounded-md border border-border font-medium w-1/3 text-base">{label('cancel_x')}</button>
              </Dialog.Close>
            ) : (
              <button type="button" onClick={() => setStep((s) => Math.max(0, s - 1))} className="min-h-[48px] px-4 rounded-md border border-border font-medium w-1/3 text-base" data-testid="btn-step-back">{label('back')}</button>
            )}
            {step < 3 ? (
              <button type="button" onClick={() => void next()} className="flex-1 min-h-[48px] bg-primary text-primary-foreground rounded-md font-semibold text-base" data-testid="btn-step-next">{label('k_next')}</button>
            ) : (
              <button type="button" onClick={handleSubmit(onSubmit, onInvalid)} className="flex-1 min-h-[48px] bg-primary text-primary-foreground rounded-md font-semibold text-base" data-testid="btn-save-order">
                {label('save_2')}
              </button>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
    <ListDialog open={templateMode !== null} onOpenChange={v => { if (!v) setTemplateMode(null); }}>
      <ListContent className="max-w-md max-h-[85dvh] overflow-y-auto">
        <ListTitle>{label(templateMode === 'save' ? 'save_template' : 'load_template')}</ListTitle>
        <ListDescription>{label('t_template_name_e_g_standard_large')}</ListDescription>
        {templateMode === 'save' ? <>
          <input autoFocus aria-label={label('t_template_name_e_g_standard_large')} value={templateName} onChange={e => setTemplateName(e.target.value)} className={inputCls} data-testid="input-template-name" />
          <button type="button" onClick={saveNamedTemplate} disabled={!templateName.trim()} className="min-h-[48px] rounded-lg bg-primary text-primary-foreground disabled:opacity-40" data-testid="btn-save-named-template">{label('save')}</button>
        </> : templates.map(t => <button type="button" key={t.id} className="min-h-[48px] rounded-lg border border-border px-3 text-start" data-testid={`template-${t.id}`} onClick={() => {
          patchItem(activeItem, { measurements: { ...t.measurements } });
          reset({ ...getValues(), collarType: t.collarType ?? getValues('collarType'), damanType: t.damanType ?? getValues('damanType'), pockets: t.pockets ?? getValues('pockets'), cuffType: t.cuffType ?? getValues('cuffType') });
          setTemplateMode(null); toast({ title: label('template_loaded'), description: t.name });
        }}>{t.name}</button>)}
      </ListContent>
    </ListDialog>
    </>
  );
}
