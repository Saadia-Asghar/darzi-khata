import { useEffect, useState, useRef } from 'react';
import { useLocation } from 'wouter';
import { useOrders } from '../hooks/use-orders';
import { useDemoMode } from '../hooks/use-demo-mode';
import { useAuthContext } from '../context/auth-context';
import { usePreferences } from '../hooks/use-preferences';
import { createFinancialDemo } from '../lib/demo-data';
import { createPitchDemo } from '../lib/pitch-data';
import { computeCreditScore } from '../lib/credit-score';
import { useSettings } from '../hooks/use-settings';
import { removeStorage } from '../lib/local-store';
import { clearPhotos } from '../lib/photos';
import { balance } from '../lib/payments';
import { money } from '../lib/i18n';
import { ReceiptModal } from './receipt-modal';
import { ToolLayout, actionClass, panelClass } from './tool-layout';
import type { Order } from '../types/order';

export function PitchDemo() {
  const { label } = usePreferences();
  const { settings, saveSettings } = useSettings();
  const { dataOwnerId } = useAuthContext();
  const { demoMode, setDemoMode } = useDemoMode();
  const { orders, setAllOrders, recordPayment } = useOrders();
  const [, navigate] = useLocation();
  const [step, setStep] = useState(-1);
  const [reset, setReset] = useState(false);
  const [receipt, setReceipt] = useState(false);
  const [demoId, setDemoId] = useState('');
  const [score, setScore] = useState(0);
  const [scoreBefore, setScoreBefore] = useState(0);
  const [error, setError] = useState('');
  const settingUp = useRef(false);
  const order = orders.find(o => o.id === demoId);
  useEffect(() => {
    if (!reset || !demoMode || settingUp.current) return;
    settingUp.current = true;
    try {
      setAllOrders(createPitchDemo(new Date(), dataOwnerId));
      saveSettings({ ...settings, expenses: [], savings: undefined, rushPlan: undefined,
        zindigiWallet: '03000000000', accountTitle: 'Al-Madina Tailors', raastId: '03000000000' });
      for (const kind of ['templates', 'karigars', 'customers']) removeStorage(`darzi-khata-${kind}-financial-demo-${dataOwnerId}`);
      void clearPhotos(`financial-demo-${dataOwnerId}`).catch(() => setError(label('feature_error')));
      setStep(0); setReset(false);
    } catch { setError(label('feature_error')); setReset(false); }
    settingUp.current = false;
  }, [reset, demoMode, dataOwnerId, setAllOrders]);
  useEffect(() => {
    if (step !== 4) return;
    const after = computeCreditScore(orders, new Date(), settings.expenses).score;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setScore(after); return; }
    const start = performance.now();
    let frame = 0;
    const animate = (time: number) => {
      const part = Math.min(1, (time - start) / 700);
      setScore(Math.round(scoreBefore + (after - scoreBefore) * part));
      if (part < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [step, scoreBefore]);
  const next = () => {
    try {
      if (step === 0) {
        const sample = createFinancialDemo(new Date(), dataOwnerId)[0];
        const now = new Date().toISOString(), id = `pitch-${crypto.randomUUID()}`;
        const newOrder: Order = { ...structuredClone(sample), id, customerId: `pitch-customer-${crypto.randomUUID()}`,
          serialNumber: 'PITCH-001', customerName: sample.customerName, orderDate: now, createdAt: now,
          deliveryDate: now, status: 'stitching', deliveredAt: undefined, readyAt: undefined,
          totalAmount: 1500, advanceAmount: 0, payments: [], comments: [], items: undefined, suitCount: 1,
        };
        setAllOrders([newOrder, ...orders]); setDemoId(id); setStep(1);
      } else if (step === 1) { setReceipt(false); setStep(2); }
      else if (step === 2 && order && demoMode) {
        const before = computeCreditScore(orders, new Date(), settings.expenses).score;
        setScoreBefore(before); setScore(before);
        recordPayment(order.id, balance(order), 'zindigi', new Date().toISOString(), true); setStep(3);
      }
      else if (step === 3) setStep(4);
      else navigate('/credit');
    } catch { setError(label('feature_error')); }
  };
  const instructions = ['feature_pitch_order', 'feature_pitch_parchi', 'feature_pitch_pay', 'feature_pitch_clear', 'feature_pitch_score'];
  return <ToolLayout title={label('feature_pitch')}>
    <p className="text-sm text-muted-foreground">{label('feature_pitch_intro')}</p>
    {error && <p role="alert">{error}</p>}
    {step < 0 ? <button className={actionClass} disabled={reset} data-testid="pitch-begin" onClick={() => {
      // Only the financial-demo namespace is reset, never the real shop namespace.
      setDemoMode(true); setReset(true);
    }}>{label('feature_begin')}</button> : <section className={panelClass} data-testid="pitch-step">
      <p className="num text-sm text-muted-foreground">{step + 1} / 5</p>
      <div role="status" className="rounded-lg border border-primary bg-primary-soft p-4 text-base font-medium">{label(instructions[step])}</div>
      {step === 0 && <p className="text-sm">{label('new_order')} · {money(1500)}</p>}
      {order && <p className="text-base"><strong>{order.serialNumber}</strong> · {order.customerName} · <span className="num">{label('baqi')}: {money(balance(order))}</span></p>}
      {step === 1 && <button className="min-h-[48px] rounded-lg border border-border px-4" onClick={() => setReceipt(true)} data-testid="pitch-parchi">{label('receipt')}</button>}
      {step === 4 && <div className="text-center"><p className="text-sm">{label('feature_demo_score')}</p><p className="num text-sm">{scoreBefore} →</p><p className="num text-4xl font-semibold p-3" data-testid="pitch-score">{score}</p></div>}
      <button className={actionClass} data-testid="pitch-next" onClick={next}>{label(step === 4 ? 'feature_finish' : 'm_next')}</button>
    </section>}
    <ReceiptModal open={receipt} onOpenChange={setReceipt} order={order || null} />
  </ToolLayout>;
}
