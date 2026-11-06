import { useMemo, useState } from 'react';
import { Search, UserPlus, Pencil, History, Zap, Users, Ruler } from 'lucide-react';
import type { Customer, Order } from '../types/order';
import { useCustomers } from '../hooks/use-customers';
import { usePreferences } from '../hooks/use-preferences';
import { normalizePakistaniPhone } from '../lib/reminders';
import { balance } from '../lib/payments';
import { CustomerEditor, emptyCustomer } from './customer-editor';
import { formatPhone, matchesCustomer, rs } from './format';

interface Row { customer?: Customer; name: string; phone: string; orders: number; due: number; last?: string }

export function CustomersPanel({ orders, onHistory, onQuickOrder }: { orders: Order[]; onHistory: (phone: string) => void; onQuickOrder: (c: Customer) => void }) {
  const { customers } = useCustomers();
  const { label, urduFirst } = usePreferences();
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState<Customer | null>(null);

  const rows = useMemo<Row[]>(() => {
    const map = new Map<string, Row>();
    for (const c of customers) map.set(c.id, { customer: c, name: c.name, phone: c.phone, orders: 0, due: 0 });
    const byPhone = new Map(customers.map((c) => [normalizePakistaniPhone(c.phone), c.id]));
    for (const o of orders) {
      const key = (o.customerId && map.has(o.customerId)) ? o.customerId : byPhone.get(normalizePakistaniPhone(o.phone)) ?? `phone:${normalizePakistaniPhone(o.phone)}`;
      const r = map.get(key) ?? { name: o.customerName, phone: o.phone, orders: 0, due: 0 };
      r.orders += 1; r.due += balance(o);
      if (!r.last || o.orderDate > r.last) r.last = o.orderDate;
      map.set(key, r);
    }
    return Array.from(map.values()).sort((a, b) => (b.last ?? '').localeCompare(a.last ?? '') || a.name.localeCompare(b.name));
  }, [customers, orders]);
  const filtered = rows.filter((r) => matchesCustomer(q, r.name, r.phone));

  return (
    <section className="dk-rise" aria-label={label('Customers', 'گاہک')}>
      <div className="flex items-center justify-between mb-3 gap-2">
        <h2 className={`text-xl font-black ${urduFirst ? 'font-urdu leading-loose' : ''}`}>{label('Customers', 'گاہک')} <span className="text-sm text-muted-foreground font-bold">({rows.length})</span></h2>
        <button onClick={() => setEditing(emptyCustomer())} className="min-h-[44px] px-3 rounded-xl bg-emerald-800 text-white text-sm font-bold flex items-center gap-1.5" data-testid="btn-new-customer"><UserPlus size={16} aria-hidden /> {label('Add', 'نیا گاہک')}</button>
      </div>
      <div className="relative mb-3">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={17} aria-hidden />
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} aria-label={label('Search customers', 'گاہک تلاش کریں')} placeholder={label('Name, phone or last 4 digits', 'نام، فون یا آخری 4 ہندسے')} className="w-full min-h-[48px] ps-10 pe-3 rounded-xl border border-border bg-card text-sm outline-none focus:ring-2 focus:ring-emerald-500" data-testid="input-search-customers" />
      </div>
      {rows.length === 0 ? (
        <div className="text-center py-10 bg-card rounded-xl border border-dashed border-border"><Users className="mx-auto text-muted-foreground mb-2" size={32} aria-hidden /><p className="text-sm text-muted-foreground">{label('No customers yet. Add one or create an order.', 'ابھی کوئی گاہک نہیں')}</p></div>
      ) : filtered.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-8">{label('No match for', 'کوئی نتیجہ نہیں')} "{q}"</p>
      ) : (
        <ul className="space-y-2">
          {filtered.map((r) => (
            <li key={r.customer?.id ?? r.phone} className="bg-card border border-card-border rounded-xl p-3" data-testid={`row-customer-${r.customer?.id ?? r.phone}`}>
              <div className="flex items-start gap-3">
                <div className="h-11 w-11 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-200 font-black flex items-center justify-center shrink-0">{r.name.trim().slice(0, 1).toUpperCase() || '?'}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold truncate">{r.name}</div>
                  <div className="text-xs text-muted-foreground font-mono" dir="ltr">{formatPhone(r.phone)}</div>
                  <div className="flex flex-wrap gap-1.5 mt-1 text-[11px]">
                    <span className="bg-muted rounded-full px-2 py-0.5">{r.orders} {label('orders', 'آرڈر')}</span>
                    {r.due > 0 && <span className="bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 rounded-full px-2 py-0.5 font-bold" dir="ltr">{rs(r.due)}</span>}
                    {!!r.customer?.profiles.length && <span className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 rounded-full px-2 py-0.5 inline-flex items-center gap-1"><Ruler size={10} aria-hidden />{r.customer.profiles.length}</span>}
                  </div>
                  {r.customer?.notes && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{r.customer.notes}</p>}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-1.5 mt-2">
                <button onClick={() => setEditing(r.customer ?? emptyCustomer(r.name, r.phone))} className="min-h-[44px] rounded-lg bg-muted text-xs font-bold flex items-center justify-center gap-1" data-testid="btn-edit-customer"><Pencil size={13} aria-hidden /> {r.customer ? label('Edit', 'ترمیم') : label('Save', 'محفوظ')}</button>
                <button onClick={() => onHistory(r.phone)} disabled={r.orders === 0} className="min-h-[44px] rounded-lg bg-muted text-xs font-bold flex items-center justify-center gap-1 disabled:opacity-40" data-testid="btn-customer-history"><History size={13} aria-hidden /> {label('History', 'ریکارڈ')}</button>
                <button onClick={() => onQuickOrder(r.customer ?? emptyCustomer(r.name, r.phone))} className="min-h-[44px] rounded-lg bg-amber-500 text-emerald-950 text-xs font-bold flex items-center justify-center gap-1" data-testid="btn-customer-quick"><Zap size={13} aria-hidden /> {label('Quick order', 'فوری آرڈر')}</button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <CustomerEditor customer={editing} onClose={() => setEditing(null)} />
    </section>
  );
}
