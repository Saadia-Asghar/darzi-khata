import { money, tl, shortDate } from '../lib/i18n';
import { receiptMessage, receiptShopName, receiptStyle, receiptThanks } from '../lib/receipt-message';
import { haptic } from '../lib/haptics';
import { QR_INK, QR_PAPER } from '../lib/brand';
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
  const { label, lang, paperSize, setPaperSize } = usePreferences();
  const { recordPayment } = useOrders();
  const { demoMode } = useDemoMode();
  const { toast } = useToast();
  const [qr, setQr] = useState<string>('');
  const hasAccount = !!(settings.zindigiWallet || settings.raastId);
  const payload = useMemo(() => (order && hasAccount && balance(order) > 0 ? buildPaymentPayload(order, settings) : ''), [order, settings, hasAccount]);

  useEffect(() => {
    let alive = true;
    if (!payload) { setQr(''); return; }
    QRCode.toDataURL(payload, { margin: 1, width: 220, color: { dark: QR_INK, light: QR_PAPER } })
      .then((url) => { if (alive) setQr(url); })
      .catch(() => { if (alive) setQr(''); });
    return () => { alive = false; };
  }, [payload]);

  if (!order) return null;

  const baqi = balance(order);
  const paperChooser = (
    <div className="print:hidden print-hide px-6 pt-4" role="radiogroup" aria-label={label('paper_size')}>
      <div className="text-sm font-medium text-muted-foreground mb-2">{label('paper_size')}</div>
      <div className="grid grid-cols-3 gap-2">
        {(['a4', '80', '58'] as const).map((p) => (
          <button key={p} type="button" role="radio" aria-checked={paperSize === p} onClick={() => setPaperSize(p)} className={`min-h-[44px] rounded-md border text-sm font-medium ${paperSize === p ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border'}`} data-testid={`paper-${p}`}>{label(p === 'a4' ? 'paper_a4' : p === '80' ? 'paper_80' : 'paper_58')}</button>
        ))}
      </div>
    </div>
  );
  const details = paymentDetailsText(settings, lang);

  const generateWhatsAppMessage = () => {
    return encodeURIComponent(receiptMessage(order, settings, lang));
  };

  const copyToClipboard = async () => {
    const text = decodeURIComponent(generateWhatsAppMessage());
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: tl('m_copied') });
    } catch {
      toast({ title: tl('m_copy_failed'), description: tl('m_use_whatsapp_button_instead'), variant: 'destructive' });
    }
  };

  const demoMarkPaid = () => {
    if (!demoMode || baqi <= 0) return;
    try {
      recordPayment(order.id, baqi, 'zindigi', new Date().toISOString(), true);
      haptic();
      toast({ title: tl('m_demo_marked_paid_via_zindigi'), description: tl('m_simulation_only_no_bank_or_wallet_was_co') });
    } catch (e) {
      toast({ title: tl('m_could_not_record'), description: e instanceof Error ? e.message : '', variant: 'destructive' });
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-foreground/60 z-50  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 print:hidden" />
        <Dialog.Content dir={lang === 'ur' ? 'rtl' : 'ltr'} lang={lang} aria-describedby={undefined} data-testid="receipt-dialog" className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg bg-card p-0  outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 print:static print:transform-none print:shadow-none print:max-w-none print:p-0 max-h-[90vh] overflow-y-auto">
          <Dialog.Title className="sr-only">{label('receipt')}</Dialog.Title>
          {paperChooser}
          {/* Printable Area */}
          <div className="p-6 md:p-8" id="receipt-print-area">
            <div className="print-paper border-2 border-dashed border-border p-5 relative bg-card mx-auto max-w-[400px]" data-paper={paperSize}>
              {/* Corner Ornaments */}
              <div className="absolute top-1 left-1 w-3 h-3 border-t-2 border-l-2 border-primary"></div>
              <div className="absolute top-1 right-1 w-3 h-3 border-t-2 border-r-2 border-primary"></div>
              <div className="absolute bottom-1 left-1 w-3 h-3 border-b-2 border-l-2 border-primary"></div>
              <div className="absolute bottom-1 right-1 w-3 h-3 border-b-2 border-r-2 border-primary"></div>

              <div className="text-center mb-4 border-b-2 border-double border-border pb-4">
                <div className="flex justify-center text-primary mb-2"><Scissors size={28} /></div>
                <h1 className={`text-2xl font-bold text-primary mb-1 ${lang === 'ur' ? 'font-urdu' : ''}`} lang={lang}>{receiptShopName(settings, lang)}</h1>
              </div>

              {/* Serial Number */}
              {order.serialNumber && (
                <div className="text-center mb-3">
                  <span className="bg-primary text-primary-foreground text-sm font-bold px-3 py-1 rounded-full ">
                    {label('receipt_number')} {order.serialNumber}
                  </span>
                </div>
              )}

              <div className="space-y-2 text-sm font-medium text-foreground">
                <div className="flex justify-between items-center border-b border-border pb-2">
                  <span className="text-muted-foreground">{label('name')}:</span>
                  <span className="font-bold text-base ">{order.customerName}</span>
                </div>
                <div className="flex justify-between items-center border-b border-border pb-2">
                  <span className="text-muted-foreground">{label('phone')}:</span>
                  <span className="font-mono">{order.phone}</span>
                </div>
                <div className="flex justify-between items-center border-b border-border pb-2">
                  <span className="text-muted-foreground">{label('delivery')}:</span>
                  <span className={`font-bold ${order.urgent ? 'text-danger' : ''}`}>
                    {shortDate(order.deliveryDate, lang)} {order.urgent ? `(${label('urgent')})` : ''}
                  </span>
                </div>
                <div className="flex justify-between items-center border-b border-border pb-2 gap-2">
                  <span className="text-muted-foreground">{label('garments')}:</span>
                  <span className="flex items-center gap-2"><FabricThumb id={order.fabricPhotoId} size={40} />{label('t_n_pcs', { suitCount: order.suitCount })} ({order.fabric})</span>
                </div>
                {order.items && order.items.length > 0 && (
                  <ul className="border-b border-border pb-2 text-sm space-y-1" data-testid="receipt-items">
                    {order.items.map((it, i) => (
                      <li key={it.id}>
                        <div className="flex justify-between font-bold"><span>{i + 1}. {label(garment(it.garmentType).tk)} x{it.quantity}</span><span className="font-mono">{money(it.unitPrice * it.quantity)}</span></div>
                        <div className="font-mono text-xs text-muted-foreground">{garment(it.garmentType).fields.map((f) => `${label(f.tk)} ${it.measurements[f.key]}`).join(' · ')}</div>
                      </li>
                    ))}
                  </ul>
                )}
                {order.karigar && (
                  <div className="flex justify-between items-center border-b border-border pb-2">
                    <span className="text-muted-foreground">{label('karigar')}:</span>
                    <span className="font-medium">{order.karigar}</span>
                  </div>
                )}
              </div>

              {!order.items?.length && <div className="mt-4">
                <h3 className="bg-muted text-center py-1 font-bold text-sm   mb-3 text-muted-foreground border border-border">{label('measurements_inches')}</h3>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm font-mono">
                  <div className="flex justify-between border-b border-dotted border-border pb-1"><span>{tl('d_length')}</span><span className="font-bold">{order.measurements.kameezLambai}</span></div>
                  <div className="flex justify-between border-b border-dotted border-border pb-1"><span>{tl('d_shoulder')}</span><span className="font-bold">{order.measurements.teera}</span></div>
                  <div className="flex justify-between border-b border-dotted border-border pb-1"><span>{tl('d_sleeve')}</span><span className="font-bold">{order.measurements.bazu}</span></div>
                  <div className="flex justify-between border-b border-dotted border-border pb-1"><span>{tl('d_neck')}</span><span className="font-bold">{order.measurements.gala}</span></div>
                  <div className="flex justify-between border-b border-dotted border-border pb-1"><span>{tl('d_chest')}</span><span className="font-bold">{order.measurements.chhaati}</span></div>
                  <div className="flex justify-between border-b border-dotted border-border pb-1"><span>{tl('d_waist')}</span><span className="font-bold">{order.measurements.kamar}</span></div>
                  <div className="flex justify-between border-b border-dotted border-border pb-1"><span>{tl('d_hem')}</span><span className="font-bold">{order.measurements.ghera}</span></div>
                  <div className="flex justify-between border-b border-dotted border-border pb-1"><span>{tl('d_shalwar_length')}</span><span className="font-bold">{order.measurements.shalwarLambai}</span></div>
                  <div className="flex justify-between border-b border-dotted border-border pb-1"><span>{tl('d_ankle')}</span><span className="font-bold">{order.measurements.paincha}</span></div>
                  <div className="flex justify-between border-b border-dotted border-border pb-1"><span>{tl('d_rise')}</span><span className="font-bold">{order.measurements.asan}</span></div>
                </div>
              </div>}

              <div className="mt-4 text-sm">
                <div className="flex gap-2 mb-1"><span className="font-bold">{label('style')}:</span> {[order.collarType, order.damanType, order.cuffType, order.pockets].map(value => receiptStyle(value, lang)).join(' · ')}</div>
                {order.specialNotes && <div className="italic text-muted-foreground">"{order.specialNotes}"</div>}
              </div>

              <div className="mt-4 pt-4 border-t-2 border-primary text-sm">
                <div className="flex justify-between mb-1">
                  <span>{label('total_stitching')}</span>
                  <span className="font-mono">{money(order.totalAmount)}</span>
                </div>
                <div className="flex justify-between mb-2 pb-2 border-b border-border">
                  <span>{label('paid_2')}</span>
                  <span className="font-mono">{money(order.advanceAmount)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg">
                  <span>{label('balance_2')}</span>
                  <span className="font-mono">{money(baqi)}</span>
                </div>
              </div>
              
              {baqi > 0 && (details || qr) && (
                <div className="mt-4 pt-4 border-t-2 border-dashed border-border text-center" data-testid="receipt-payment-block">
                  <div className="text-sm font-bold   text-primary">{label('t_pay_rs_n', { amount: money(baqi) })}</div>
                  {details && <pre className="mt-2 text-xs leading-relaxed whitespace-pre-wrap font-sans text-foreground">{details}</pre>}
                  <div className="text-xs text-muted-foreground">{label('reference')}: <b className="font-mono">{order.serialNumber || order.id}</b></div>
                  {qr && (
                    <div className="mt-3 inline-block relative">
                      <img src={qr} alt={tl('qr_demo_alt')} className="w-36 h-36 mx-auto opacity-90" />
                      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 bg-danger/90 text-danger-foreground text-xs font-bold py-1 -rotate-6">{tl('qr_demo_flag')}</div>
                    </div>
                  )}
                  {qr && <p className="mt-1 text-xs text-muted-foreground leading-snug">{tl('qr_future_note')}</p>}
                  {!hasAccount && <p className="text-xs text-muted-foreground">{label('add_wallet_details_in_settings_for_qr')}</p>}
                </div>
              )}

              <div className="mt-4 text-center text-xs text-muted-foreground   border-t border-border pt-3">
                <p>{receiptThanks(settings, lang)}</p>
                {label('receipt_footer')}
              </div>
            </div>
          </div>

          {demoMode && baqi > 0 && (
            <div className="px-4 pb-3 print:hidden">
              <button onClick={demoMarkPaid} className="w-full min-h-[44px] rounded-lg border-2 border-dashed border-warning bg-warning-soft text-accent-foreground text-sm font-bold flex items-center justify-center gap-2" data-testid="btn-demo-mark-paid">
                <FlaskConical size={16} /> {label('receipt_demo_paid')}
              </button>
            </div>
          )}
          {/* Action Buttons - Hidden in Print */}
          <div className="bg-card p-4 border-t rounded-b-lg flex gap-2 print:hidden sticky bottom-0">
            <button 
              onClick={() => window.print()}
              className="flex-1 flex flex-col items-center justify-center min-h-[48px] py-2 bg-muted hover:bg-muted text-foreground rounded-lg transition-colors"
              data-testid="btn-print-receipt"
            >
              <Printer size={18} className="mb-1" />
              <span className="text-sm font-bold">{label('print')}</span>
            </button>
            <button 
              onClick={copyToClipboard}
              className="flex-1 flex flex-col items-center justify-center min-h-[48px] py-2 bg-muted hover:bg-muted text-foreground rounded-lg transition-colors"
              data-testid="btn-copy-receipt"
            >
              <Copy size={18} className="mb-1" />
              <span className="text-sm font-bold">{label('copy_2')}</span>
            </button>
            <a 
              href={`https://wa.me/${normalizePakistaniPhone(order.phone)}?text=${generateWhatsAppMessage()}`}
              target="_blank" rel="noreferrer"
              className="flex-[2] flex flex-col items-center justify-center py-2 bg-success hover:bg-success text-primary-foreground rounded-lg transition-colors"
              data-testid="btn-wa-receipt"
            >
              <MessageCircle size={18} className="mb-1" />
              <span className="text-sm font-bold">{label('whatsapp_receipt')}</span>
            </a>
          </div>

          <Dialog.Close asChild className="print:hidden">
            <button className="absolute top-4 right-4 bg-card  rounded-full p-2 text-muted-foreground hover:text-foreground transition-colors" data-testid="btn-close-receipt">
              <X size={20} />
            </button>
          </Dialog.Close>

        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
