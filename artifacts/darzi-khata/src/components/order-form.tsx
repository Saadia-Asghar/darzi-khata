import { useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X, Minus, Plus, CalendarIcon, Bookmark, FolderOpen, User } from 'lucide-react';
import { Order, Measurements, CollarType, DamanType, PocketType, CuffType } from '../types/order';
import { useTemplates } from '../hooks/use-templates';
import { useKarigars } from '../hooks/use-karigars';
import { useToast } from '@/hooks/use-toast';

const measurementSchema = z.object({
  kameezLambai: z.coerce.number().min(1),
  teera: z.coerce.number().min(1),
  bazu: z.coerce.number().min(1),
  gala: z.coerce.number().min(1),
  chhaati: z.coerce.number().min(1),
  kamar: z.coerce.number().min(1),
  ghera: z.coerce.number().min(1),
  shalwarLambai: z.coerce.number().min(1),
  paincha: z.coerce.number().min(1),
  asan: z.coerce.number().min(1),
  shalwarGhera: z.coerce.number().min(1),
});

const formSchema = z.object({
  customerName: z.string().min(2, 'Name is required'),
  phone: z.string().min(10, 'Valid phone number required'),
  orderDate: z.string().min(1, 'Order date is required'),
  deliveryDate: z.string().min(1, 'Delivery date is required'),
  urgent: z.boolean(),
  suitCount: z.coerce.number().min(1).max(50),
  fabric: z.string().min(2, 'Fabric info required'),
  karigar: z.string().optional(),
  measurements: measurementSchema,
  collarType: z.enum(['Normal Collar', 'Sherwani/Ban', 'Kurta Open', 'Round/Gol Gala']),
  damanType: z.enum(['Choras (Square)', 'Gol (Round)']),
  pockets: z.enum(['Front Pocket', '1 Side Pocket', '2 Side Pockets', 'Mobile Zip Pocket']),
  cuffType: z.enum(['Simple', 'Button Cuff', 'Cut Cuff']),
  specialNotes: z.string().optional(),
  totalAmount: z.coerce.number().min(0),
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

const DEFAULT_MEASUREMENTS: Measurements = {
  kameezLambai: 40, teera: 18, bazu: 24, gala: 15, chhaati: 22, kamar: 21,
  ghera: 23, shalwarLambai: 38, paincha: 7.5, asan: 16, shalwarGhera: 40,
};

export function OrderForm({ open, onOpenChange, order, prefill, onSave }: OrderFormProps) {
  const { templates, addTemplate } = useTemplates();
  const { karigars } = useKarigars();
  const { toast } = useToast();
  
  const { register, handleSubmit, control, reset, watch, setValue, getValues, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: getInitialValues(order, prefill),
  });

  useEffect(() => {
    if (open) {
      reset(getInitialValues(order, prefill));
    }
  }, [open, order, prefill, reset]);

  function getInitialValues(o?: Order, p?: Partial<Order>): FormValues {
    if (o) {
      return {
        customerName: o.customerName,
        phone: o.phone,
        orderDate: o.orderDate.split('T')[0],
        deliveryDate: o.deliveryDate.split('T')[0],
        urgent: o.urgent,
        suitCount: o.suitCount,
        fabric: o.fabric,
        karigar: o.karigar || '',
        measurements: o.measurements,
        collarType: o.collarType,
        damanType: o.damanType,
        pockets: o.pockets,
        cuffType: o.cuffType,
        specialNotes: o.specialNotes,
        totalAmount: o.totalAmount,
        advanceAmount: o.advanceAmount,
      };
    }
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 5);
    const base = {
      customerName: '',
      phone: '',
      orderDate: today,
      deliveryDate: tomorrow.toISOString().split('T')[0],
      urgent: false,
      suitCount: 1,
      fabric: '',
      karigar: '',
      measurements: DEFAULT_MEASUREMENTS,
      collarType: 'Normal Collar' as CollarType,
      damanType: 'Choras (Square)' as DamanType,
      pockets: '2 Side Pockets' as PocketType,
      cuffType: 'Simple' as CuffType,
      specialNotes: '',
      totalAmount: 1500,
      advanceAmount: 0,
    };
    
    if (p) {
      return { ...base, ...p } as FormValues;
    }
    return base;
  }

  const handleSaveTemplate = () => {
    const name = window.prompt("Template ka naam likhein (e.g. 'Standard Large'):");
    if (name) {
      const vals = getValues();
      addTemplate({
        name,
        measurements: vals.measurements,
        collarType: vals.collarType,
        damanType: vals.damanType,
        pockets: vals.pockets,
        cuffType: vals.cuffType,
      });
      toast({ title: 'Template Saved', description: 'Naap template mehfooz ho gaya!' });
    }
  };

  const onSubmit = (data: FormValues) => {
    onSave({
      ...data,
      orderDate: new Date(data.orderDate).toISOString(),
      deliveryDate: new Date(data.deliveryDate).toISOString(),
      status: order?.status || 'pending',
      specialNotes: data.specialNotes || '',
      karigar: data.karigar || undefined,
    });
    onOpenChange(false);
  };

  const totalAmount = watch('totalAmount') || 0;
  const advanceAmount = watch('advanceAmount') || 0;
  const baqi = totalAmount - advanceAmount;

  // Reusable Measurement Stepper Component
  const MeasurementStepper = ({ name, labelEn, labelUr }: { name: keyof Measurements; labelEn: string; labelUr: string }) => {
    const value = watch(`measurements.${name}`);
    return (
      <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
        <div className="flex flex-col">
          <span className="text-sm font-semibold">{labelEn}</span>
          <span className="text-xs text-gray-500 font-urdu">{labelUr}</span>
        </div>
        <div className="flex items-center gap-1 bg-gray-50 rounded-lg border border-gray-200 p-1">
          <button type="button" onClick={() => setValue(`measurements.${name}`, Number(value) - 0.5)} className="w-8 h-8 flex items-center justify-center bg-white rounded shadow-sm border border-gray-200 text-gray-700 active:bg-gray-100"><Minus size={16} /></button>
          <input type="number" step="0.5" className="w-12 text-center bg-transparent font-bold outline-none no-spinners" {...register(`measurements.${name}`)} />
          <button type="button" onClick={() => setValue(`measurements.${name}`, Number(value) + 0.5)} className="w-8 h-8 flex items-center justify-center bg-white rounded shadow-sm border border-gray-200 text-gray-700 active:bg-gray-100"><Plus size={16} /></button>
        </div>
      </div>
    );
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed inset-x-0 bottom-0 z-50 mt-24 h-[90dvh] flex flex-col rounded-t-[20px] bg-white border-t overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom shadow-2xl outline-none max-w-lg mx-auto sm:h-[85vh] sm:bottom-auto sm:top-[50%] sm:-translate-y-1/2 sm:rounded-[20px]">
          
          {/* Header */}
          <div className="px-5 py-4 border-b flex justify-between items-center bg-emerald-800 text-white shrink-0">
            <div>
              <Dialog.Title className="text-lg font-bold">{order ? 'Edit Order' : 'Naya Order (New)'}</Dialog.Title>
              <Dialog.Description className="text-emerald-200 text-xs font-urdu mt-0.5">{order ? 'آرڈر میں تبدیلی' : 'نیا آرڈر درج کریں'}</Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button className="h-8 w-8 inline-flex items-center justify-center rounded-full hover:bg-emerald-700 active:bg-emerald-900 transition-colors text-white" aria-label="Close">
                <X size={20} />
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto bg-gray-50 pb-20">
            <div className="p-5 space-y-6">
              
              {/* Step 1: Customer Details */}
              <section className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-4">
                <h3 className="font-bold text-gray-900 border-b pb-2 mb-3 font-urdu flex justify-between items-center">
                  <span>تفصیلات (Customer Details)</span>
                  <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[10px] font-sans">Step 1</span>
                </h3>
                
                <div>
                  <label className="block text-sm font-semibold mb-1">Customer Name</label>
                  <input {...register('customerName')} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all" placeholder="Enter name" data-testid="input-name" />
                  {errors.customerName && <p className="text-red-500 text-xs mt-1">{errors.customerName.message}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-semibold mb-1">WhatsApp Number</label>
                  <input type="tel" {...register('phone')} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-mono" placeholder="03XXXXXXXXX" data-testid="input-phone" />
                  {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold mb-1">Order Date</label>
                    <div className="relative">
                      <input type="date" {...register('orderDate')} className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-9 pr-3 py-2.5 outline-none focus:border-emerald-500 transition-all text-sm" />
                      <CalendarIcon className="absolute left-3 top-3 text-gray-400" size={16} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1">Delivery Date</label>
                    <div className="relative">
                      <input type="date" {...register('deliveryDate')} className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-9 pr-3 py-2.5 outline-none focus:border-emerald-500 transition-all text-sm" data-testid="input-delivery" />
                      <CalendarIcon className="absolute left-3 top-3 text-gray-400" size={16} />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between bg-red-50 p-3 rounded-lg border border-red-100">
                  <div className="flex flex-col">
                    <span className="font-bold text-red-800">URGENT / ہنگامی</span>
                    <span className="text-xs text-red-600">Jaldi tayar karna hai</span>
                  </div>
                  <Controller
                    control={control}
                    name="urgent"
                    render={({ field }) => (
                      <button 
                        type="button" 
                        onClick={() => field.onChange(!field.value)}
                        className={`w-12 h-6 rounded-full relative transition-colors duration-200 ease-in-out ${field.value ? 'bg-red-600' : 'bg-gray-300'}`}
                        data-testid="toggle-urgent"
                      >
                        <span className={`block w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform duration-200 ease-in-out shadow-sm ${field.value ? 'translate-x-6' : 'translate-x-0.5'}`} />
                      </button>
                    )}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1 flex items-center gap-1"><User size={14} /> Karigar (Worker)</label>
                  <select {...register('karigar')} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 outline-none focus:border-emerald-500 text-sm" data-testid="select-karigar">
                    <option value="">— Assign nahi kiya —</option>
                    {karigars.map((k) => (
                      <option key={k} value={k}>{k}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold mb-1">Joray (Suits)</label>
                    <div className="flex items-center gap-1 bg-gray-50 rounded-lg border border-gray-200 p-1">
                      <button type="button" onClick={() => setValue('suitCount', Math.max(1, watch('suitCount') - 1))} className="w-10 h-10 flex items-center justify-center bg-white rounded shadow-sm border border-gray-200 text-gray-700"><Minus size={18} /></button>
                      <input type="number" className="flex-1 w-full text-center bg-transparent font-bold text-lg outline-none no-spinners" {...register('suitCount')} />
                      <button type="button" onClick={() => setValue('suitCount', watch('suitCount') + 1)} className="w-10 h-10 flex items-center justify-center bg-white rounded shadow-sm border border-gray-200 text-gray-700"><Plus size={18} /></button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1">Fabric Details</label>
                    <input {...register('fabric')} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 h-12 outline-none focus:border-emerald-500 transition-all text-sm placeholder:text-gray-400" placeholder="e.g. White Cotton" data-testid="input-fabric" />
                  </div>
                </div>
              </section>

              {/* Step 2: Measurements */}
              <section className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-900 border-b pb-2 mb-3 font-urdu flex justify-between items-center">
                  <span>ناپ (Measurements - Inches)</span>
                  <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[10px] font-sans">Step 2</span>
                </h3>
                
                <div className="flex gap-2 mb-4 bg-gray-50 p-2 rounded-lg border border-gray-100">
                  <button 
                    type="button"
                    onClick={() => {
                      // We'll use a simple prompt for loading to keep it clean without nested modals
                      if (templates.length === 0) {
                        alert("Koi template nahi hai. Pehle 'Save' karein.");
                        return;
                      }
                      const tNames = templates.map((t, i) => `${i + 1}. ${t.name}`).join('\n');
                      const choice = window.prompt(`Template number likhein:\n\n${tNames}`);
                      if (choice) {
                        const idx = parseInt(choice) - 1;
                        if (templates[idx]) {
                          const t = templates[idx];
                          setValue('measurements', t.measurements);
                          if (t.collarType) setValue('collarType', t.collarType);
                          if (t.damanType) setValue('damanType', t.damanType);
                          if (t.pockets) setValue('pockets', t.pockets);
                          if (t.cuffType) setValue('cuffType', t.cuffType);
                          toast({ title: 'Template Loaded', description: `${t.name} load ho gaya.` });
                        } else {
                          alert("Galat number.");
                        }
                      }
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 rounded hover:bg-emerald-100 transition-colors"
                  >
                    <FolderOpen size={14} /> Load Template
                  </button>
                  <button 
                    type="button"
                    onClick={handleSaveTemplate}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold text-gray-700 bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors"
                  >
                    <Bookmark size={14} /> Save Template
                  </button>
                </div>
                
                <div className="mb-4">
                  <h4 className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-2 bg-emerald-50 px-2 py-1 inline-block rounded">Kameez / Kurta</h4>
                  <MeasurementStepper name="kameezLambai" labelEn="Length" labelUr="لمبائی" />
                  <MeasurementStepper name="teera" labelEn="Shoulder" labelUr="تیرا" />
                  <MeasurementStepper name="bazu" labelEn="Sleeves" labelUr="بازو" />
                  <MeasurementStepper name="gala" labelEn="Neck" labelUr="گلا" />
                  <MeasurementStepper name="chhaati" labelEn="Chest" labelUr="چھاٹی" />
                  <MeasurementStepper name="kamar" labelEn="Waist" labelUr="کمر" />
                  <MeasurementStepper name="ghera" labelEn="Daman" labelUr="گھیرا" />
                </div>

                <div>
                  <h4 className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-2 bg-emerald-50 px-2 py-1 inline-block rounded">Shalwar / Pajama</h4>
                  <MeasurementStepper name="shalwarLambai" labelEn="Length" labelUr="شلوار لمبائی" />
                  <MeasurementStepper name="paincha" labelEn="Bottom" labelUr="پائنچہ" />
                  <MeasurementStepper name="asan" labelEn="Crotch" labelUr="آسن" />
                  <MeasurementStepper name="shalwarGhera" labelEn="Width" labelUr="شلوار گھیرا" />
                </div>
              </section>

              {/* Step 3: Style */}
              <section className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-4">
                <h3 className="font-bold text-gray-900 border-b pb-2 mb-3 font-urdu flex justify-between items-center">
                  <span>ڈیزائن (Style Specs)</span>
                  <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[10px] font-sans">Step 3</span>
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1 text-gray-700">Collar / Gala</label>
                    <select {...register('collarType')} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 outline-none focus:border-emerald-500 text-sm">
                      <option value="Normal Collar">Normal Collar</option>
                      <option value="Sherwani/Ban">Sherwani/Ban</option>
                      <option value="Kurta Open">Kurta Open</option>
                      <option value="Round/Gol Gala">Round/Gol Gala</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1 text-gray-700">Daman</label>
                    <select {...register('damanType')} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 outline-none focus:border-emerald-500 text-sm">
                      <option value="Choras (Square)">Choras (Square)</option>
                      <option value="Gol (Round)">Gol (Round)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1 text-gray-700">Pockets</label>
                    <select {...register('pockets')} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 outline-none focus:border-emerald-500 text-sm">
                      <option value="Front Pocket">Front Pocket</option>
                      <option value="1 Side Pocket">1 Side Pocket</option>
                      <option value="2 Side Pockets">2 Side Pockets</option>
                      <option value="Mobile Zip Pocket">Mobile Zip Pocket</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1 text-gray-700">Cuff</label>
                    <select {...register('cuffType')} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 outline-none focus:border-emerald-500 text-sm">
                      <option value="Simple">Simple</option>
                      <option value="Button Cuff">Button Cuff</option>
                      <option value="Cut Cuff">Cut Cuff</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1 text-gray-700">Special Notes</label>
                  <textarea {...register('specialNotes')} rows={3} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-emerald-500 text-sm resize-none" placeholder="e.g. Double silai, matching button..." />
                </div>
              </section>

              {/* Step 4: Billing */}
              <section className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-4 border-b-4 border-b-emerald-600">
                <h3 className="font-bold text-gray-900 border-b pb-2 mb-3 font-urdu flex justify-between items-center">
                  <span>حساب کتاب (Billing)</span>
                  <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[10px] font-sans">Step 4</span>
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Total Silai (Rs.)</label>
                    <input type="number" {...register('totalAmount')} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-3 outline-none focus:border-emerald-500 text-lg font-bold font-mono" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Advance Ada (Rs.)</label>
                    <input type="number" {...register('advanceAmount')} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-3 outline-none focus:border-emerald-500 text-lg font-bold font-mono text-emerald-700" />
                  </div>
                </div>

                <div className={`p-4 rounded-xl border flex justify-between items-center ${baqi > 0 ? 'bg-red-50 border-red-100' : 'bg-emerald-50 border-emerald-100'}`}>
                  <span className="font-bold font-urdu text-lg {baqi > 0 ? 'text-red-800' : 'text-emerald-800'}">باقی رقم (Baqi)</span>
                  <span className={`text-2xl font-bold font-mono ${baqi > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                    Rs. {baqi}
                  </span>
                </div>
              </section>

            </div>
          </form>

          {/* Fixed Footer */}
          <div className="absolute bottom-0 inset-x-0 bg-white border-t p-4 shadow-[0_-10px_40px_-10px_rgba(0,0,0,0.1)] flex gap-3 z-10">
            <Dialog.Close asChild>
              <button type="button" className="px-6 py-3.5 rounded-xl border border-gray-200 text-gray-700 font-bold hover:bg-gray-50 transition-colors w-1/3 text-sm">
                Cancel
              </button>
            </Dialog.Close>
            <button 
              onClick={handleSubmit(onSubmit)}
              className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold shadow-lg shadow-emerald-700/20 active:translate-y-0.5 transition-all text-sm font-urdu flex items-center justify-center gap-2"
              data-testid="btn-save-order"
            >
              Mehfooz Karein / Save
            </button>
          </div>

        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
