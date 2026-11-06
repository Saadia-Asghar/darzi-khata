import { useState } from 'react';
import { usePreferences } from '../hooks/use-preferences';
import { useSettings } from '../hooks/use-settings';
import { savingsSuggestion, localDate } from '../lib/shop-tools';
import { money, shortDate } from '../lib/i18n';
import type { Order } from '../types/order';
import { ToolLayout, Field, RemoveEntry, fieldClass, actionClass, panelClass } from './tool-layout';

export function SavingsTools({ orders }: { orders: Order[] }) {
  const { label, lang } = usePreferences();
  const { settings, saveSettings } = useSettings();
  const goal = settings.savings;
  const [name, setName] = useState(goal?.name || '');
  const [target, setTarget] = useState(String(goal?.target ?? 60000));
  const [percent, setPercent] = useState(String(goal?.percent ?? 5));
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(localDate(new Date()));
  const [message, setMessage] = useState('');
  const [remove, setRemove] = useState<string>();
  const result = savingsSuggestion(orders, goal);
  const persist = (next: NonNullable<typeof goal>) => { try { saveSettings({ ...settings, savings: next }); setMessage(label('feature_saved')); return true; } catch { setMessage(label('feature_error')); return false; } };
  return <ToolLayout title={label('feature_savings')}>
    <p className="text-sm text-muted-foreground">{label('feature_savings_note')}</p>
    <form className={panelClass} onSubmit={e => {
      e.preventDefault(); const n = Number(target), p = Number(percent);
      if (!name.trim() || !Number.isFinite(n) || n <= 0 || n < result.saved || !Number.isFinite(p) || p < 0 || p > 100) { setMessage(label('feature_invalid')); return; }
      persist({ name: name.trim(), target: n, percent: p, contributions: goal?.contributions || [] });
    }}>
      <Field title={label('feature_goal_name')}><input className={fieldClass} required maxLength={100} value={name} onChange={e => setName(e.target.value)} data-testid="savings-name" /></Field>
      <Field title={label('feature_target')}><input className={fieldClass} required type="number" min="1" value={target} onChange={e => setTarget(e.target.value)} /></Field>
      <Field title={label('feature_percent')}><input className={fieldClass} required type="number" min="0" max="100" value={percent} onChange={e => setPercent(e.target.value)} /></Field>
      <button className={actionClass} data-testid="savings-save">{label('feature_save')}</button>
    </form>
    {goal && <section className={panelClass}>
      <h2 className="text-xl font-semibold">{goal.name}</h2>
      <p className="num">{label('feature_saved_amount')}: {money(result.saved)} / {money(goal.target)}</p>
      <progress className="w-full h-3 accent-primary" max={goal.target} value={result.saved} aria-label={goal.name} />
      <p>{label('feature_suggested')}: <strong className="num">{money(result.suggested)}</strong></p>
      <form className="space-y-3" onSubmit={e => {
        e.preventDefault(); const n = Number(amount);
        if (!Number.isFinite(n) || n <= 0 || n > result.remaining || !date || date > localDate(new Date())) { setMessage(label('feature_invalid')); return; }
        if (persist({ ...goal, contributions: [...goal.contributions, { id: crypto.randomUUID(), amount: n, date }] })) setAmount('');
      }}>
        <Field title={label('feature_amount')}><input className={fieldClass} required type="number" min="0.01" step="0.01" max={result.remaining} value={amount} onChange={e => setAmount(e.target.value)} data-testid="savings-amount" /></Field>
        <Field title={label('feature_date')}><input className={fieldClass} required type="date" max={localDate(new Date())} value={date} onChange={e => setDate(e.target.value)} /></Field>
        <button className={actionClass} disabled={!result.remaining} data-testid="savings-contribute">{label('feature_contribute')}</button>
      </form>
      <ul>{goal.contributions.map(c => <li key={c.id} className="flex items-center gap-2 justify-between border-t border-border py-2"><span className="text-sm">{shortDate(c.date, lang)} · {money(c.amount)}</span><button className="min-h-[44px] px-3" onClick={() => setRemove(c.id)}>{label('delete')}</button></li>)}</ul>
    </section>}
    {message && <p role="status">{message}</p>}
    <RemoveEntry open={!!remove} onClose={() => setRemove(undefined)} onRemove={() => { if (goal && persist({ ...goal, contributions: goal.contributions.filter(c => c.id !== remove) })) setRemove(undefined); }} />
  </ToolLayout>;
}
