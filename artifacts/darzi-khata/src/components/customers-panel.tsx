import { useMemo, useState } from 'react';
import { Search, UserPlus, Pencil, History, Zap, Users, Ruler, Phone } from 'lucide-react';
import type { Customer, Order } from '../types/order';
import { useCustomers } from '../hooks/use-customers';
import { usePreferences } from '../hooks/use-preferences';
import { normalizePakistaniPhone } from '../lib/reminders';
import { balance } from '../lib/payments';
import { CustomerEditor, emptyCustomer } from './customer-editor';
import { formatPhone, matchesCustomer, rs } from './format';
import { shortDate } from '../lib/i18n';
import { StatusBadge } from './status-meta';

interface Row { key: string; customer?: Customer; name: string; phone: string; orders: number; total: number; due: number; last?: string; list: Order[] }

export function CustomersPanel({ orders, onHistory, onQuickOrder }: { orders: Order[]; onHistory: (phone: string) => void; onQuickOrder: (c: Customer) => void }) {
  const { customers } = useCustomers();
  const { label, one, lang } = usePreferences();
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState<Customer | null>(null);

  const rows = useMemo<Row[]>(() => {
    const map = new Map<string, Row>();
    for (const c of customers) map.set(c.id, { key: c.id, customer: c, name: c.name, phone: c.phone, orders: 0, total: 0, due: 0, list: [] });
    for (const o of orders) {
      const key = o.customerId ?? `order:${o.id}`;
      const r = map.get(key) ?? { key, name: o.customerName, phone: o.phone, orders: 0, total: 0, due: 0, list: [] };
      r.orders += 1; r.due += balance(o); r.total += o.totalAmount; r.list.push(o);
      if (!r.last || o.orderDate > r.last) r.last = o.orderDate;
      map.set(key, r);
    }
    return Array.from(map.values()).sort((a, b) => (b.last ?? '').localeCompare(a.last ?? '') || a.name.localeCompare(b.name));
  }, [customers, orders]);
  const filtered = rows.filter((r) => matchesCustomer(q, r.name, r.phone));
  const selected = filtered.find((r) => r.key === selectedKey) ?? filtered[0];
  const editRow = (r: Row) => setEditing(r.customer ?? emptyCustomer(r.name, r.phone));

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
        <ul className="space-y-2 lg:hidden">
          {filtered.map((r) => (
            <li key={r.key} className="bg-card border border-card-border rounded-lg p-3" data-testid={`row-customer-${r.customer?.id ?? r.phone}`}>
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
                <button onClick={() => editRow(r)} className="min-h-[64px] py-2 px-1 rounded-md bg-muted text-sm font-medium flex flex-col items-center justify-center gap-1" aria-label={r.customer ? label('edit') : label('save')} data-testid="btn-edit-customer"><Pencil size={20} aria-hidden /> {r.customer ? one('edit') : one('save')}</button>
                <button onClick={() => onHistory(r.customer?.id ?? r.phone)} disabled={r.orders === 0} className="min-h-[64px] py-2 px-1 rounded-md bg-muted text-sm font-medium flex flex-col items-center justify-center gap-1 disabled:opacity-40" aria-label={label('history')} data-testid="btn-customer-history"><History size={20} aria-hidden /> {one('history')}</button>
                <button onClick={() => onQuickOrder(r.customer ?? emptyCustomer(r.name, r.phone))} className="min-h-[64px] py-2 px-1 rounded-md bg-accent text-accent-foreground text-sm font-medium flex flex-col items-center justify-center gap-1" aria-label={label('quick_order_x')} data-testid="btn-customer-quick"><Zap size={20} aria-hidden /> {one('quick_order_x')}</button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {filtered.length > 0 && (
        <div className="hidden lg:grid lg:grid-cols-[minmax(0,1fr)_380px] gap-6 items-start">
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <table className="w-full text-sm" data-testid="customers-table">
              <thead className="bg-muted text-muted-foreground">
                <tr>
                  <th scope="col" className="text-start font-medium px-4 py-2.5">{label('name')}</th>
                  <th scope="col" className="text-start font-medium px-3 py-2.5">{label('phone')}</th>
                  <th scope="col" className="text-end font-medium px-3 py-2.5">{label('orders')}</th>
                  <th scope="col" className="text-end font-medium px-3 py-2.5">{label('total')}</th>
                  <th scope="col" className="text-end font-medium px-3 py-2.5">{label('baqi')}</th>
                  <th scope="col" className="text-end font-medium px-4 py-2.5">{label('dk_last_order')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((r) => {
                  const on = selected?.key === r.key;
                  return (
                    <tr key={r.key} onClick={() => setSelectedKey(r.key)} aria-selected={on}
                      className={`cursor-pointer ${on ? 'bg-primary-soft' : 'hover:bg-muted/60'}`} data-testid={`table-row-customer-${r.key}`}>
                      <td className="px-4 py-2.5 max-w-0 w-[30%]">
                        <button type="button" onClick={() => setSelectedKey(r.key)} className="min-h-0 font-semibold truncate block max-w-full text-start">{r.name}</button>
                      </td>
                      <td className="px-3 py-2.5 num whitespace-nowrap" dir="ltr">{formatPhone(r.phone)}</td>
                      <td className="px-3 py-2.5 num text-end">{r.orders}</td>
                      <td className="px-3 py-2.5 num text-end whitespace-nowrap" dir="ltr">{rs(r.total)}</td>
                      <td className={`px-3 py-2.5 num text-end whitespace-nowrap ${r.due > 0 ? 'text-danger font-semibold' : 'text-muted-foreground'}`} dir="ltr">{rs(r.due)}</td>
                      <td className="px-4 py-2.5 text-end whitespace-nowrap text-muted-foreground">{r.last ? shortDate(r.last, lang) : '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {selected && (
            <aside className="sticky top-[88px] rounded-lg border border-border bg-card p-4 space-y-4 dk-rise" key={selected.key} data-testid="customer-detail-pane">
              <div className="flex items-start gap-3">
                <div className="h-12 w-12 rounded-full bg-warning-soft text-accent-foreground font-bold flex items-center justify-center shrink-0">{selected.name.trim().slice(0, 1).toUpperCase() || '?'}</div>
                <div className="min-w-0 flex-1">
                  <p className="text-lg font-semibold truncate">{selected.name}</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1.5"><Phone size={14} aria-hidden /><span className="num" dir="ltr">{formatPhone(selected.phone)}</span></p>
                </div>
              </div>
              <dl className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-md bg-muted p-2"><dt className="text-xs text-muted-foreground">{label('orders')}</dt><dd className="num font-semibold">{selected.orders}</dd></div>
                <div className="rounded-md bg-muted p-2"><dt className="text-xs text-muted-foreground">{label('total')}</dt><dd className="num font-semibold" dir="ltr">{rs(selected.total)}</dd></div>
                <div className="rounded-md bg-danger-soft p-2"><dt className="text-xs text-danger">{label('baqi')}</dt><dd className="num font-semibold text-danger" dir="ltr">{rs(selected.due)}</dd></div>
              </dl>
              {!!selected.customer?.profiles.length && <p className="text-sm inline-flex items-center gap-1.5 text-primary"><Ruler size={14} aria-hidden /> {label('measurement_templates')}: <span className="num">{selected.customer.profiles.length}</span></p>}
              {selected.customer?.notes && <p className="text-sm text-muted-foreground">{selected.customer.notes}</p>}
              <div className="grid grid-cols-3 gap-2">
                <button onClick={() => editRow(selected)} className="min-h-[44px] rounded-md border border-border text-sm font-medium inline-flex items-center justify-center gap-1.5 hover:bg-muted" data-testid="detail-edit-customer"><Pencil size={16} aria-hidden /> {selected.customer ? one('edit') : one('save')}</button>
                <button onClick={() => onHistory(selected.customer?.id ?? selected.phone)} disabled={selected.orders === 0} className="min-h-[44px] rounded-md border border-border text-sm font-medium inline-flex items-center justify-center gap-1.5 hover:bg-muted disabled:opacity-40" data-testid="detail-customer-history"><History size={16} aria-hidden /> {one('history')}</button>
                <button onClick={() => onQuickOrder(selected.customer ?? emptyCustomer(selected.name, selected.phone))} className="min-h-[44px] rounded-md bg-accent text-accent-foreground text-sm font-semibold inline-flex items-center justify-center gap-1.5" data-testid="detail-customer-quick"><Zap size={16} aria-hidden /> {one('quick_order_x')}</button>
              </div>
              {selected.list.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">{label('dk_recent_orders')}</h3>
                  <ul className="divide-y divide-border border border-border rounded-md">
                    {[...selected.list].sort((a, b) => b.orderDate.localeCompare(a.orderDate)).slice(0, 5).map((o) => (
                      <li key={o.id} className="flex items-center gap-2 px-3 py-2 text-sm">
                        <span className="num font-medium" dir="ltr">{o.serialNumber || '-'}</span>
                        <span className="flex-1 text-muted-foreground truncate">{shortDate(o.deliveryDate, lang)}</span>
                        <StatusBadge order={o} compact />
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </aside>
          )}
        </div>
      )}
      <CustomerEditor customer={editing} onClose={() => setEditing(null)} />
    </section>
  );
}
