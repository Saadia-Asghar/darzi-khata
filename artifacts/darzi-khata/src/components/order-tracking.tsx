import { useState } from 'react';
import { usePreferences } from '../hooks/use-preferences';
import { useSettings } from '../hooks/use-settings';
import { signSnapshot, snapshotUrl } from '../lib/public-token';
import { normalizePakistaniPhone } from '../lib/reminders';
import type { Order } from '../types/order';
import { ShareLink } from './share-tools';
import { actionClass } from './tool-layout';

export function OrderTracking({ order }: { order: Order }) {
  const { label, lang } = usePreferences();
  const { settings } = useSettings();
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  return <details className="print:hidden border-t border-border p-4">
    <summary className="min-h-[44px] cursor-pointer font-semibold">{label('feature_tracking')}</summary>
    <div className="space-y-3 pt-3">
      <p className="text-sm text-muted-foreground">{label('feature_tracking_note')}</p>
      <button className={actionClass} disabled={busy} data-testid="create-tracking-link" onClick={() => {
        setBusy(true); setError(''); const issuedAt = Date.now();
        void signSnapshot({ kind: 'track', lang, shop: settings.shopName, reference: order.serialNumber || order.id, status: order.status,
          deliveryDate: order.deliveryDate, issuedAt, expiresAt: issuedAt + 7 * 86400000,
        }).then(token => setUrl(snapshotUrl('track', token))).catch(() => setError(label('feature_error'))).finally(() => setBusy(false));
      }}>{label('feature_track_consent')}</button>
      {error && <p role="alert">{error}</p>}
      {url && <><ShareLink url={url} /><a className={actionClass} href={`https://wa.me/${normalizePakistaniPhone(order.phone)}?text=${encodeURIComponent(`${label('feature_order_status')}: ${url}`)}`} target="_blank" rel="noreferrer">{label('action_whatsapp')}</a></>}
    </div>
  </details>;
}
