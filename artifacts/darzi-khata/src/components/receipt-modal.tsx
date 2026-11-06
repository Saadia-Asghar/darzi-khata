import { usePreferences } from '../hooks/use-preferences';
import { FabricThumb } from './fabric-photo';
import { garment } from '../lib/garments';
import * as Dialog from '@radix-ui/react-dialog';
import { useEffect, useMemo, useState } from 'react';
import { X, Printer, Copy, MessageCircle, Scissors, FlaskConical } from 'lucide-react';
import QRCode from 'qrcode';
import { Order } from '../types/order';
import { useSettings } from '../hooks/use-settings';
import { useOrders } from '../hooks/use-orders';
import { useDemoMode } from '../hooks/use-demo-mode';
import { useToast } from '@/hooks/use-toast';
import { balance, buildPaymentPayload, paymentDetailsText } from '../lib/payments';
import { normalizePakistaniPhone } from '../lib/reminders';

interface ReceiptModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order | null;
}

export function ReceiptModal({ open, onOpenChange, order }: ReceiptModalProps) {
  const { settings } = useSettings();
  const { label } = usePreferences();
  const { recordPayment } = useOrders();
  const { demoMode } = useDemoMode();
  const { toast } = useToast();
  const [qr, setQr] = useState<string>('');
  const hasAccount = !!(settings.zindigiWallet || settings.raastId);
  const payload = useMemo(() => (order && hasAccount && balance(order) > 0 ? buildPaymentPayload(order, settings) : ''), [order, settings, hasAccount]);

  useEffect(() => {
    let alive = true;
    if (!payload) { setQr(''); return; }
    QRCode.toDataURL(payload, { margin: 1, width: 220, color: { dark: '#064e3b', light: '#ffffff' } })
      .then((url) => { if (alive) setQr(url); })
      .catch(() => { if (alive) setQr(''); });
    return () => { alive = false; };
  }, [payload]);

  if (!order) return null;

  const baqi = balance(order);
  const details = paymentDetailsText(settings);

  const generateWhatsAppMessage = () => {
    const text = `*${settings.shopName.toUpperCase()} — DUKAN RASEED* 
━━━━━━━━━━━━━━━━━━━━━━
${order.serialNumber ? `*Raseed No:* ${order.serialNumber}\n` : ''}*Gahak Ka Naam:* ${order.customerName}
*Phone:* ${order.phone}
*Delivery Ki Tareekh:* ${new Date(order.deliveryDate).toLocaleDateString()}${order.urgent ? " (URGENT)" : ""}
*Suit:* ${order.suitCount} Jora (${order.fabric})

*MUKAMMAL NAAP / MEASUREMENTS (Inches):*
--------------------------------------
• Kameez Lambai: ${order.measurements.kameezLambai}"
• Teera: ${order.measurements.teera}" | Bazu: ${order.measurements.bazu}"
• Gala: ${order.measurements.gala}" | Chhaati: ${order.measurements.chhaati}"
• Kamar: ${order.measurements.kamar}" | Ghera: ${order.measurements.ghera}"
• Shalwar Lambai: ${order.measurements.shalwarLambai}"
• Paincha: ${order.measurements.paincha}" | Asan: ${order.measurements.asan}"

*Design / Style:*
• Gala: ${order.collarType} | Daman: ${order.damanType}
• Jeb: ${order.pockets} | Cuff: ${order.cuffType}
• Note: ${order.specialNotes || "Koi khaas hidayat nahi"}

*HISAAB KITAAB:*
• Total Silai: Rs. ${order.totalAmount}
• Advance Ada: Rs. ${order.advanceAmount}
• *BAQI RAKAM (Payable): Rs. ${baqi}*
━━━━━━━━━━━━━━━━━━━━━━
${details && baqi > 0 ? `\n*PAY ONLINE / آن لائن ادائیگی:*\n${details}\nReference / حوالہ: ${order.serialNumber || order.id} · Rs ${baqi}\n(Please share payment screenshot / ادائیگی کا اسکرین شاٹ بھیجیں)\n` : ''}_${settings.thankYouMessage}_
_Dukan: ${settings.address}. Rabta: ${settings.phone}_`;
    return encodeURIComponent(text);
  };

  const copyToClipboard = async () => {
    const text = decodeURIComponent(generateWhatsAppMessage());
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: 'Copied / کاپی ہو گیا' });
    } catch {
      toast({ title: 'Copy failed / کاپی نہیں ہوا', description: 'Use WhatsApp button instead. / واٹس ایپ بٹن استعمال کریں', variant: 'destructive' });
    }
  };

  const demoMarkPaid = () => {
    if (!demoMode || baqi <= 0) return;
    try {
      recordPayment(order.id, baqi, 'zindigi', new Date().toISOString(), true);
      toast({ title: 'Demo: marked paid via Zindigi / ڈیمو ادائیگی', description: 'Simulation only. No bank or wallet was contacted. / صرف نمونہ' });
    } catch (e) {
      toast({ title: 'Could not record / درج نہ ہو سکا', description: e instanceof Error ? e.message : '', variant: 'destructive' });
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 print:hidden" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-[#fdfbf7] p-0 shadow-2xl outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 print:static print:transform-none print:shadow-none print:max-w-none print:p-0 max-h-[90vh] overflow-y-auto">
          
          {/* Printable Area */}
          <div className="p-6 md:p-8" id="receipt-print-area">
            <div className="border-4 border-dashed border-gray-300 p-6 relative bg-white mx-auto shadow-[0_0_15px_rgba(0,0,0,0.03)]" style={{ maxWidth: '400px' }}>
              {/* Corner Ornaments */}
              <div className="absolute top-1 left-1 w-3 h-3 border-t-2 border-l-2 border-emerald-800"></div>
              <div className="absolute top-1 right-1 w-3 h-3 border-t-2 border-r-2 border-emerald-800"></div>
              <div className="absolute bottom-1 left-1 w-3 h-3 border-b-2 border-l-2 border-emerald-800"></div>
              <div className="absolute bottom-1 right-1 w-3 h-3 border-b-2 border-r-2 border-emerald-800"></div>

              <div className="text-center mb-4 border-b-2 border-double border-gray-200 pb-4">
                <div className="flex justify-center text-emerald-800 mb-2"><Scissors size={28} /></div>
                <h1 className="text-2xl font-bold tracking-widest text-emerald-900 mb-1 uppercase">{settings.shopName}</h1>
                <h2 className="text-xl font-urdu text-emerald-800">{settings.shopNameUrdu}</h2>
              </div>

              {/* Serial Number */}
              {order.serialNumber && (
                <div className="text-center mb-3">
                  <span className="bg-emerald-800 text-white text-xs font-bold px-3 py-1 rounded-full tracking-widest">
                    Raseed No. {order.serialNumber}
                  </span>
                </div>
              )}

              <div className="space-y-2 text-sm font-medium text-gray-800">
                <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                  <span className="text-gray-500">{label('Name', 'نام')}:</span>
                  <span className="font-bold text-base uppercase">{order.customerName}</span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                  <span className="text-gray-500">{label('Phone', 'فون')}:</span>
                  <span className="font-mono">{order.phone}</span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                  <span className="text-gray-500">{label('Delivery', 'ڈیلیوری')}:</span>
                  <span className={`font-bold ${order.urgent ? 'text-red-600' : ''}`}>
                    {new Date(order.deliveryDate).toLocaleDateString()} {order.urgent ? `(${label('Urgent', 'ہنگامی')})` : ''}
                  </span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-100 pb-2 gap-2">
                  <span className="text-gray-500">{label('Garments', 'کپڑے')}:</span>
                  <span className="flex items-center gap-2"><FabricThumb id={order.fabricPhotoId} size={40} />{label(`${order.suitCount} pcs`, `${order.suitCount} جوڑے`)} ({order.fabric})</span>
                </div>
                {order.items && order.items.length > 0 && (
                  <ul className="border-b border-gray-100 pb-2 text-xs space-y-1" data-testid="receipt-items">
                    {order.items.map((it, i) => (
                      <li key={it.id}>
                        <div className="flex justify-between font-bold"><span>{i + 1}. {label(garment(it.garmentType).en, garment(it.garmentType).ur)} x{it.quantity}</span><span className="font-mono">Rs {it.unitPrice * it.quantity}</span></div>
                        <div className="font-mono text-[10px] text-gray-600">{garment(it.garmentType).fields.map((f) => `${label(f.en, f.ur)} ${it.measurements[f.key]}`).join(' · ')}</div>
                      </li>
                    ))}
                  </ul>
                )}
                {order.karigar && (
                  <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                    <span className="text-gray-500">{label('Karigar', 'کاریگر')}:</span>
                    <span className="font-medium">{order.karigar}</span>
                  </div>
                )}
              </div>

              {!order.items?.length && <div className="mt-4">
                <h3 className="bg-gray-100 text-center py-1 font-bold text-xs tracking-widest uppercase mb-3 text-gray-600 border border-gray-200">{label('Measurements (inches)', 'ناپ (انچ)')}</h3>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs font-mono">
                  <div className="flex justify-between border-b border-dotted border-gray-200 pb-1"><span>Lambai</span><span className="font-bold">{order.measurements.kameezLambai}</span></div>
                  <div className="flex justify-between border-b border-dotted border-gray-200 pb-1"><span>Teera</span><span className="font-bold">{order.measurements.teera}</span></div>
                  <div className="flex justify-between border-b border-dotted border-gray-200 pb-1"><span>Bazu</span><span className="font-bold">{order.measurements.bazu}</span></div>
                  <div className="flex justify-between border-b border-dotted border-gray-200 pb-1"><span>Gala</span><span className="font-bold">{order.measurements.gala}</span></div>
                  <div className="flex justify-between border-b border-dotted border-gray-200 pb-1"><span>Chhaati</span><span className="font-bold">{order.measurements.chhaati}</span></div>
                  <div className="flex justify-between border-b border-dotted border-gray-200 pb-1"><span>Kamar</span><span className="font-bold">{order.measurements.kamar}</span></div>
                  <div className="flex justify-between border-b border-dotted border-gray-200 pb-1"><span>Ghera</span><span className="font-bold">{order.measurements.ghera}</span></div>
                  <div className="flex justify-between border-b border-dotted border-gray-200 pb-1"><span>Sh. Lambai</span><span className="font-bold">{order.measurements.shalwarLambai}</span></div>
                  <div className="flex justify-between border-b border-dotted border-gray-200 pb-1"><span>Paincha</span><span className="font-bold">{order.measurements.paincha}</span></div>
                  <div className="flex justify-between border-b border-dotted border-gray-200 pb-1"><span>Asan</span><span className="font-bold">{order.measurements.asan}</span></div>
                </div>
              </div>}

              <div className="mt-4 text-xs">
                <div className="flex gap-2 mb-1"><span className="font-bold">{label('Style', 'ڈیزائن')}:</span> {order.collarType}, {order.damanType}, {order.cuffType}, {order.pockets}</div>
                {order.specialNotes && <div className="italic text-gray-600">"{order.specialNotes}"</div>}
              </div>

              <div className="mt-4 pt-4 border-t-2 border-emerald-800 text-sm">
                <div className="flex justify-between mb-1">
                  <span>{label('Total stitching', 'کل سلائی')}</span>
                  <span className="font-mono">Rs {order.totalAmount}</span>
                </div>
                <div className="flex justify-between mb-2 pb-2 border-b border-gray-200">
                  <span>{label('Paid', 'ادا شدہ')}</span>
                  <span className="font-mono">Rs {order.advanceAmount}</span>
                </div>
                <div className="flex justify-between font-bold text-lg">
                  <span>{label('Balance', 'باقی')}</span>
                  <span className="font-mono">Rs {baqi}</span>
                </div>
              </div>
              
              {baqi > 0 && (details || qr) && (
                <div className="mt-4 pt-4 border-t-2 border-dashed border-gray-200 text-center" data-testid="receipt-payment-block">
                  <div className="text-xs font-bold tracking-widest uppercase text-emerald-900">{label(`Pay Rs ${baqi.toLocaleString()}`, `${baqi.toLocaleString()} روپے ادا کریں`)}</div>
                  {details && <pre className="mt-2 text-[11px] leading-relaxed whitespace-pre-wrap font-sans text-gray-700">{details}</pre>}
                  <div className="text-[11px] text-gray-600">{label('Reference', 'حوالہ')}: <b className="font-mono">{order.serialNumber || order.id}</b></div>
                  {qr && (
                    <div className="mt-3 inline-block relative">
                      <img src={qr} alt="Demo payment QR, not bank-scannable" className="w-36 h-36 mx-auto opacity-90" />
                      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 bg-red-600/90 text-white text-[10px] font-black py-1 -rotate-6">DEMO QR · NOT BANK SCANNABLE</div>
                    </div>
                  )}
                  {qr && <p className="mt-1 text-[10px] text-gray-500 leading-snug">Future merchant integration: scan with Zindigi/Raast. This placeholder will not work in banking apps today.<br /><span className="font-urdu">یہ نمونہ کیو آر ہے، بینک ایپ میں کام نہیں کرے گا</span></p>}
                  {!hasAccount && <p className="text-[10px] text-gray-500">{label('Add wallet details in Settings for QR', 'QR کے لیے سیٹنگز میں اکاؤنٹ درج کریں')}</p>}
                </div>
              )}

              <div className="mt-4 text-center text-[10px] text-gray-400 uppercase tracking-widest border-t border-gray-100 pt-3">
                Powered by Darzi Khata
              </div>
            </div>
          </div>

          {demoMode && baqi > 0 && (
            <div className="px-4 pb-3 print:hidden">
              <button onClick={demoMarkPaid} className="w-full min-h-[44px] rounded-xl border-2 border-dashed border-amber-400 bg-amber-50 text-amber-900 text-sm font-bold flex items-center justify-center gap-2" data-testid="btn-demo-mark-paid">
                <FlaskConical size={16} /> Demo: mark paid via Zindigi / ڈیمو ادائیگی
              </button>
            </div>
          )}
          {/* Action Buttons - Hidden in Print */}
          <div className="bg-white p-4 border-t rounded-b-2xl flex gap-2 print:hidden sticky bottom-0">
            <button 
              onClick={() => window.print()}
              className="flex-1 flex flex-col items-center justify-center min-h-[48px] py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
              data-testid="btn-print-receipt"
            >
              <Printer size={18} className="mb-1" />
              <span className="text-xs font-bold">{label('Print', 'پرنٹ')}</span>
            </button>
            <button 
              onClick={copyToClipboard}
              className="flex-1 flex flex-col items-center justify-center min-h-[48px] py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
              data-testid="btn-copy-receipt"
            >
              <Copy size={18} className="mb-1" />
              <span className="text-xs font-bold">{label('Copy', 'کاپی')}</span>
            </button>
            <a 
              href={`https://wa.me/${normalizePakistaniPhone(order.phone)}?text=${generateWhatsAppMessage()}`}
              target="_blank" rel="noreferrer"
              className="flex-[2] flex flex-col items-center justify-center py-2 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-lg transition-colors"
              data-testid="btn-wa-receipt"
            >
              <MessageCircle size={18} className="mb-1" />
              <span className="text-xs font-bold">{label('WhatsApp receipt', 'واٹس ایپ پرچی')}</span>
            </a>
          </div>

          <Dialog.Close asChild className="print:hidden">
            <button className="absolute top-4 right-4 bg-white shadow-md rounded-full p-2 text-gray-500 hover:text-gray-900 transition-colors" data-testid="btn-close-receipt">
              <X size={20} />
            </button>
          </Dialog.Close>

        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
