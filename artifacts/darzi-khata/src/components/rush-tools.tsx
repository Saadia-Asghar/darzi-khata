import { useState } from 'react';
import { usePreferences } from '../hooks/use-preferences';
import { useSettings } from '../hooks/use-settings';
import { localDate, rushCapacity } from '../lib/shop-tools';
import { shortDate } from '../lib/i18n';
import type { Order } from '../types/order';
import { ToolLayout, Field, fieldClass, actionClass, panelClass } from './tool-layout';

export function RushTools({ orders }: { orders: Order[] }) {
  const { label, lang } = usePreferences();
  const { settings, saveSettings } = useSettings();
  const initial = new Date(); initial.setDate(initial.getDate() + 14);
  const [deadline, setDeadline] = useState(settings.rushPlan?.deadline || localDate(initial));
  const [workers, setWorkers] = useState(settings.rushPlan?.workers ?? Math.max(1, new Set(orders.map(o => o.karigarId).filter(Boolean)).size));
  const [daily, setDaily] = useState(settings.rushPlan?.dailyPerKarigar ?? 2);
  const [message, setMessage] = useState('');
  const plan = rushCapacity(orders, deadline, workers, daily);
  return <ToolLayout title={label('feature_rush')}>
    <form className={panelClass} onSubmit={e => { e.preventDefault(); try {
      saveSettings({ ...settings, rushPlan: { deadline, workers, dailyPerKarigar: daily } }); setMessage(label('feature_saved'));
    } catch { setMessage(label('feature_error')); } }}>
      <Field title={label('feature_deadline')}><input className={fieldClass} type="date" required min={localDate(new Date())} value={deadline} onChange={e => setDeadline(e.target.value)} data-testid="rush-deadline" /></Field>
      <Field title={label('feature_workers')}><input className={fieldClass} type="number" min="1" max="100" required value={workers} onChange={e => setWorkers(Number(e.target.value))} data-testid="rush-workers" /></Field>
      <Field title={label('feature_daily')}><input className={fieldClass} type="number" min="1" max="100" required value={daily} onChange={e => setDaily(Number(e.target.value))} data-testid="rush-daily" /></Field>
      <p className="text-sm text-muted-foreground">{label('feature_capacity_note')}</p>
      <button className={actionClass}>{label('feature_save')}</button>{message && <p role="status">{message}</p>}
    </form>
    <section className={panelClass} data-testid="rush-result">
      <h2 className="text-xl font-semibold">{label('feature_capacity', { suits: plan.suits, capacity: plan.capacity })}</h2>
      {plan.shortfall > 0 && <p className="text-danger font-medium" role="status">{label('feature_shortfall', { count: plan.shortfall })}</p>}
      <p className="text-sm">{label('feature_cutoff')}: <strong>{shortDate(plan.cutOff, lang)}</strong></p>
      <ul className="divide-y divide-border">{plan.byKarigar.map(x => <li key={x.name} className="flex justify-between gap-3 py-3"><span>{x.name || label('feature_unassigned')}</span><b className="num">{x.suits}</b></li>)}</ul>
    </section>
  </ToolLayout>;
}
