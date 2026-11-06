import { useState } from 'react';
import { usePreferences } from '../hooks/use-preferences';
import { useSettings } from '../hooks/use-settings';
import { recoveryCustomers, recoveredThisMonth } from '../lib/shop-tools';
import { money, fill, DICT } from '../lib/i18n';
import { balance, paymentDetailsText } from '../lib/payments';
import { normalizePakistaniPhone } from '../lib/reminders';
import { signSnapshot, snapshotUrl } from '../lib/public-token';
import type { Order } from '../types/order';
import { ToolLayout, actionClass, panelClass } from './tool-layout';

export function RecoveryTools({ orders }: { orders: Order[] }) {
  const { label, lang } = usePreferences();
  const { settings } = useSettings();
  const [links, setLinks] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const groups = recoveryCustomers(orders);
  return <ToolLayout title={label('feature_recovery')}>
    <section className={panelClass}><p className="text-sm">{label('feature_recovered')}</p><p className="text-2xl num font-semibold" data-testid="recovered-month">{money(recoveredThisMonth(orders))}</p><p className="text-sm text-muted-foreground">{label('feature_recovery_note')}</p></section>
    <p className="text-sm text-muted-foreground">{label('feature_tracking_note')} {label('feature_qr_note')}</p>
    {error && <p role="alert">{error}</p>}
    {!groups.length && <p>{label('feature_no_baqi')}</p>}
    <ul className="space-y-3">{groups.map(group => <li key={group.id} className={panelClass}>
      <div className="flex justify-between gap-3"><h2 className="font-semibold">{group.name}</h2><b className="num text-danger">{money(group.amount)}</b></div>
      <p className="text-sm text-muted-foreground">{label('feature_days', { days: group.age })}</p>
      {group.orders.map(order => <div key={order.id} className="border-t border-border pt-3 space-y-2">
        <p className="text-sm num">{order.serialNumber} · {money(balance(order))}</p>
        {links[order.id] ? <a href={links[order.id]} className={actionClass} target="_blank" rel="noreferrer" data-testid={`recovery-send-${order.id}`}>{label('feature_remind')}</a>
          : <button className={actionClass} disabled={!!busy || !/^923\d{9}$/.test(normalizePakistaniPhone(order.phone))} data-testid={`recovery-create-${order.id}`} onClick={() => {
            setBusy(order.id); setError('');
            const issuedAt = Date.now();
            const details = paymentDetailsText(settings, lang);
            void signSnapshot({ kind: 'track', lang, shop: settings.shopName, reference: order.serialNumber || order.id,
              status: order.status, deliveryDate: order.deliveryDate, issuedAt, expiresAt: issuedAt + 7 * 86400000,
              payment: { balance: balance(order), account: settings.raastId || settings.zindigiWallet || '', title: settings.accountTitle || '', details },
            }).then(token => {
              const url = snapshotUrl('track', token);
              const text = fill(DICT.feature_reminder_text[lang], { name: order.customerName, amount: money(balance(order)), shop: settings.shopName,
                reference: order.serialNumber || order.id, details, url }, lang);
              setLinks(prev => ({ ...prev, [order.id]: `https://wa.me/${normalizePakistaniPhone(order.phone)}?text=${encodeURIComponent(text)}` }));
            }).catch(() => setError(label('feature_error'))).finally(() => setBusy(''));
          }}>{busy === order.id ? label('loading') : label('feature_remind')}</button>}
      </div>)}
    </li>)}</ul>
  </ToolLayout>;
}
