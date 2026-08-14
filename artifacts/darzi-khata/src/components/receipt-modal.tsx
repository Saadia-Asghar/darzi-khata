import * as Dialog from '@radix-ui/react-dialog';
import { X, Printer, Copy, MessageCircle, Scissors } from 'lucide-react';
import { Order } from '../types/order';
import { useSettings } from '../hooks/use-settings';

interface ReceiptModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order | null;
}

export function ReceiptModal({ open, onOpenChange, order }: ReceiptModalProps) {
  const { settings } = useSettings();
  if (!order) return null;

  const baqi = order.totalAmount - order.advanceAmount;

  const generateWhatsAppMessage = () => {
    const text = `✂️ *${settings.shopName.toUpperCase()} — DUKAN RASEED* ✂️
━━━━━━━━━━━━━━━━━━━━━━
${order.serialNumber ? `🔖 *Raseed No:* ${order.serialNumber}\n` : ''}👤 *Gahak Ka Naam:* ${order.customerName}
📞 *Phone:* ${order.phone}
📅 *Delivery Ki Tareekh:* ${new Date(order.deliveryDate).toLocaleDateString()}${order.urgent ? " 🚨 (URGENT)" : ""}
👔 *Suit:* ${order.suitCount} Jora (${order.fabric})

📏 *MUKAMMAL NAAP / MEASUREMENTS (Inches):*
--------------------------------------
• Kameez Lambai: ${order.measurements.kameezLambai}"
• Teera: ${order.measurements.teera}" | Bazu: ${order.measurements.bazu}"
• Gala: ${order.measurements.gala}" | Chhaati: ${order.measurements.chhaati}"
• Kamar: ${order.measurements.kamar}" | Ghera: ${order.measurements.ghera}"
• Shalwar Lambai: ${order.measurements.shalwarLambai}"
• Paincha: ${order.measurements.paincha}" | Asan: ${order.measurements.asan}"

🎨 *Design / Style:*
• Gala: ${order.collarType} | Daman: ${order.damanType}
• Jeb: ${order.pockets} | Cuff: ${order.cuffType}
• Note: ${order.specialNotes || "Koi khaas hidayat nahi"}

💰 *HISAAB KITAAB:*
• Total Silai: Rs. ${order.totalAmount}
• Advance Ada: Rs. ${order.advanceAmount}
• *BAQI RAKAM (Payable): Rs. ${baqi}*
━━━━━━━━━━━━━━━━━━━━━━
_${settings.thankYouMessage}_
_Dukan: ${settings.address}. Rabta: ${settings.phone}_`;
    return encodeURIComponent(text);
  };

  const copyToClipboard = () => {
    const text = decodeURIComponent(generateWhatsAppMessage());
    navigator.clipboard.writeText(text);
    alert('Naqal Ho Gaya! (Copied)');
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
                  <span className="text-gray-500">Naam:</span>
                  <span className="font-bold text-base uppercase">{order.customerName}</span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                  <span className="text-gray-500">Phone:</span>
                  <span className="font-mono">{order.phone}</span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                  <span className="text-gray-500">Delivery:</span>
                  <span className={`font-bold ${order.urgent ? 'text-red-600' : ''}`}>
                    {new Date(order.deliveryDate).toLocaleDateString()} {order.urgent ? '(URGENT)' : ''}
                  </span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                  <span className="text-gray-500">Suit:</span>
                  <span>{order.suitCount} Jora ({order.fabric})</span>
                </div>
                {order.karigar && (
                  <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                    <span className="text-gray-500">Karigar:</span>
                    <span className="font-medium">{order.karigar}</span>
                  </div>
                )}
              </div>

              <div className="mt-4">
                <h3 className="bg-gray-100 text-center py-1 font-bold text-xs tracking-widest uppercase mb-3 text-gray-600 border border-gray-200">Measurements (Inches)</h3>
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
              </div>

              <div className="mt-4 text-xs">
                <div className="flex gap-2 mb-1"><span className="font-bold">Style:</span> {order.collarType}, {order.damanType}, {order.cuffType}, {order.pockets}</div>
                {order.specialNotes && <div className="italic text-gray-600">"{order.specialNotes}"</div>}
              </div>

              <div className="mt-4 pt-4 border-t-2 border-emerald-800 text-sm">
                <div className="flex justify-between mb-1">
                  <span>Total Silai</span>
                  <span className="font-mono">Rs. {order.totalAmount}</span>
                </div>
                <div className="flex justify-between mb-2 pb-2 border-b border-gray-200">
                  <span>Advance</span>
                  <span className="font-mono">Rs. {order.advanceAmount}</span>
                </div>
                <div className="flex justify-between font-bold text-lg">
                  <span>BAQI</span>
                  <span className="font-mono">Rs. {baqi}</span>
                </div>
              </div>
              
              <div className="mt-4 text-center text-[10px] text-gray-400 uppercase tracking-widest border-t border-gray-100 pt-3">
                Powered by Darzi Khata
              </div>
            </div>
          </div>

          {/* Action Buttons - Hidden in Print */}
          <div className="bg-white p-4 border-t rounded-b-2xl flex gap-2 print:hidden sticky bottom-0">
            <button 
              onClick={() => window.print()}
              className="flex-1 flex flex-col items-center justify-center py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
              data-testid="btn-print-receipt"
            >
              <Printer size={18} className="mb-1" />
              <span className="text-xs font-bold">Print</span>
            </button>
            <button 
              onClick={copyToClipboard}
              className="flex-1 flex flex-col items-center justify-center py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
              data-testid="btn-copy-receipt"
            >
              <Copy size={18} className="mb-1" />
              <span className="text-xs font-bold">Copy</span>
            </button>
            <a 
              href={`https://wa.me/${order.phone.replace(/^0/, '92')}?text=${generateWhatsAppMessage()}`}
              target="_blank" rel="noreferrer"
              className="flex-[2] flex flex-col items-center justify-center py-2 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-lg transition-colors"
              data-testid="btn-wa-receipt"
            >
              <MessageCircle size={18} className="mb-1" />
              <span className="text-xs font-bold">WhatsApp Parchi</span>
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
