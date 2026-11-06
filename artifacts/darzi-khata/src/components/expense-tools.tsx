import { useState } from 'react';
import { Link } from 'wouter';
import { useSettings } from '../hooks/use-settings';
import { usePreferences } from '../hooks/use-preferences';
import { EXPENSE_CATEGORIES, localDate, profitSummary, validateExpense, type Expense, type ExpenseCategory } from '../lib/shop-tools';
import { money, shortDate } from '../lib/i18n';
import type { Order } from '../types/order';
import { ToolLayout, Field, RemoveEntry, fieldClass, actionClass, panelClass } from './tool-layout';

export function ProfitSummary({ orders }: { orders: Order[] }) {
  const { settings } = useSettings();
  const { label } = usePreferences();
  const p = profitSummary(orders, settings.expenses || []);
  return <section className={panelClass} data-testid="profit-summary">
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">{([
      ['feature_income', p.income], ['feature_spending', p.spending], ['feature_profit', p.profit],
    ] as const).map(([key, value]) => <div key={key}><p className="text-sm text-muted-foreground">{label(key)}</p><p className="text-xl font-semibold num" data-testid={key}>{money(value)}</p></div>)}</div>
    <p className="text-sm text-muted-foreground">{label('feature_profit_note')}</p>
    <Link href="/expenses" className="min-h-[44px] inline-flex items-center underline text-primary">{label('feature_expenses')}</Link>
  </section>;
}
export function ExpenseTools({ orders }: { orders: Order[] }) {
  const { settings, saveSettings } = useSettings();
  const { label, lang } = usePreferences();
  const [category, setCategory] = useState<ExpenseCategory>('thread');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(localDate(new Date()));
  const [note, setNote] = useState('');
  const [message, setMessage] = useState('');
  const [remove, setRemove] = useState<string>();
  const expenses = settings.expenses || [];
  return <ToolLayout title={label('feature_expenses')}>
    <ProfitSummary orders={orders} />
    <form className={panelClass} onSubmit={e => {
      e.preventDefault();
      const expense: Expense = { id: crypto.randomUUID(), category, amount: Number(amount), date, note: note.trim() };
      if (!validateExpense(expense)) { setMessage(label('feature_invalid')); return; }
      try { saveSettings({ ...settings, expenses: [...expenses, expense] }); setAmount(''); setNote(''); setMessage(label('feature_saved')); }
      catch { setMessage(label('feature_error')); }
    }}>
      <Field title={label('feature_category')}><select className={fieldClass} value={category} onChange={e => setCategory(e.target.value as ExpenseCategory)} data-testid="expense-category">{EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{label(`feature_${c}`)}</option>)}</select></Field>
      <Field title={label('feature_amount')}><input className={fieldClass} type="number" inputMode="decimal" min="0.01" step="0.01" required value={amount} onChange={e => setAmount(e.target.value)} data-testid="expense-amount" /></Field>
      <Field title={label('feature_date')}><input className={fieldClass} type="date" required max={localDate(new Date())} value={date} onChange={e => setDate(e.target.value)} /></Field>
      <Field title={label('feature_note')}><input className={fieldClass} maxLength={500} value={note} onChange={e => setNote(e.target.value)} /></Field>
      {message && <p role="status" className="text-sm">{message}</p>}
      <button className={actionClass} data-testid="expense-save">{label('feature_add_expense')}</button>
    </form>
    {!expenses.length && <p>{label('feature_empty_expenses')}</p>}
    <ul className="space-y-3">{[...expenses].sort((a, b) => b.date.localeCompare(a.date)).map(x => <li key={x.id} className={panelClass}>
      <div className="flex justify-between gap-3"><strong>{label(`feature_${x.category}`)}</strong><b className="num">{money(x.amount)}</b></div>
      <p className="text-sm text-muted-foreground">{shortDate(x.date, lang)} {x.note}</p>
      <button className="min-h-[44px] px-3 rounded-md border border-border" onClick={() => setRemove(x.id)}>{label('delete')}</button>
    </li>)}</ul>
    <RemoveEntry open={!!remove} onClose={() => setRemove(undefined)} onRemove={() => {
      try { saveSettings({ ...settings, expenses: expenses.filter(x => x.id !== remove) }); setRemove(undefined); }
      catch { setMessage(label('feature_error')); }
    }} />
  </ToolLayout>;
}
