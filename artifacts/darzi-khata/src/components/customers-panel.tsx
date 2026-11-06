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
  const { label, one } = usePreferences();
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
    <section className="dk-rise" aria-label={label('customers')}>
      <div className="flex items-center justify-between mb-3 gap-2">
        <h2 className={`text-xl font-bold `}>{label('customers')} <span className="text-sm text-muted-foreground font-bold">({rows.length})</span></h2>
        <button onClick={() => setEditing(emptyCustomer())} className="min-h-[44px] px-3 rounded-lg bg-primary text-primary-foreground text-sm font-bold flex items-center gap-1.5" data-testid="btn-new-customer"><UserPlus size={16} aria-hidden /> {label('add_2')}</button>
      </div>
      <div className="relative mb-3">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={17} aria-hidden />
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} aria-label={label('search_customers')} placeholder={label('name_phone_or_last_4_digits')} className="w-full min-h-[48px] ps-10 pe-3 rounded-lg border border-border bg-card text-sm outline-none focus:ring-2 focus:ring-ring" data-testid="input-search-customers" />
      </div>
      {rows.length === 0 ? (
        <div className="text-center py-10 bg-card rounded-lg border border-dashed border-border"><Users className="mx-auto text-muted-foreground mb-2" size={32} aria-hidden /><p className="text-sm text-muted-foreground">{label('no_customers_yet_add_one_or_create_an_or')}</p></div>
      ) : filtered.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-8">{label('no_match_for')} "{q}"</p>
      ) : (
        <ul className="space-y-2">
          {filtered.map((r) => (
            <li key={r.customer?.id ?? r.phone} className="bg-card border border-card-border rounded-lg p-3" data-testid={`row-customer-${r.customer?.id ?? r.phone}`}>
              <div className="flex items-start gap-3">
                <div className="h-11 w-11 rounded-full bg-warning-soft  text-accent-foreground  font-bold flex items-center justify-center shrink-0">{r.name.trim().slice(0, 1).toUpperCase() || '?'}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold truncate">{r.name}</div>
                  <div className="text-sm text-muted-foreground font-mono" dir="ltr">{formatPhone(r.phone)}</div>
                  <div className="flex flex-wrap gap-1.5 mt-1 text-xs">
                    <span className="bg-muted rounded-full px-2 py-0.5">{r.orders} {label('orders')}</span>
                    {r.due > 0 && <span className="bg-danger-soft  text-danger  rounded-full px-2 py-0.5 font-bold" dir="ltr">{rs(r.due)}</span>}
                    {!!r.customer?.profiles.length && <span className="bg-primary-soft  text-primary  rounded-full px-2 py-0.5 inline-flex items-center gap-1"><Ruler size={10} aria-hidden />{r.customer.profiles.length}</span>}
                  </div>
                  {r.customer?.notes && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{r.customer.notes}</p>}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-1.5 mt-2">
                <button onClick={() => setEditing(r.customer ?? emptyCustomer(r.name, r.phone))} className="min-h-[64px] py-2 px-1 rounded-md bg-muted text-sm font-medium flex flex-col items-center justify-center gap-1" aria-label={r.customer ? label('edit') : label('save')} data-testid="btn-edit-customer"><Pencil size={20} aria-hidden /> {r.customer ? one('edit') : one('save')}</button>
                <button onClick={() => onHistory(r.phone)} disabled={r.orders === 0} className="min-h-[64px] py-2 px-1 rounded-md bg-muted text-sm font-medium flex flex-col items-center justify-center gap-1 disabled:opacity-40" aria-label={label('history')} data-testid="btn-customer-history"><History size={20} aria-hidden /> {one('history')}</button>
                <button onClick={() => onQuickOrder(r.customer ?? emptyCustomer(r.name, r.phone))} className="min-h-[64px] py-2 px-1 rounded-md bg-accent text-accent-foreground text-sm font-medium flex flex-col items-center justify-center gap-1" aria-label={label('quick_order_x')} data-testid="btn-customer-quick"><Zap size={20} aria-hidden /> {one('quick_order_x')}</button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <CustomerEditor customer={editing} onClose={() => setEditing(null)} />
    </section>
  );
}
