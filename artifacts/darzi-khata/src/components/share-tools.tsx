import { useState } from 'react';
import { ExternalLink, Copy, Share2 } from 'lucide-react';
import { useSettings } from '../hooks/use-settings';
import { useDemoMode } from '../hooks/use-demo-mode';
import { usePreferences } from '../hooks/use-preferences';
import { computeCreditScore } from '../lib/credit-score';
import { profitSummary } from '../lib/shop-tools';
import { signSnapshot, snapshotUrl } from '../lib/public-token';
import { shortDate } from '../lib/i18n';
import type { Order } from '../types/order';
import { ToolLayout, actionClass, panelClass } from './tool-layout';

export function ShareLink({ url }: { url: string }) {
  const { label } = usePreferences();
  const [message, setMessage] = useState('');
  return <div className="space-y-3">
    <textarea readOnly value={url} className="w-full rounded-lg border border-input bg-card p-3 text-sm min-h-[96px] break-all" aria-label={label('feature_open_link')} data-testid="generated-link" />
    <div className="flex flex-wrap gap-2">
      <button type="button" className={actionClass} onClick={() => { void navigator.clipboard.writeText(url).then(() => setMessage(label('link_copied'))).catch(() => setMessage(label('feature_error'))); }}><Copy size={18} aria-hidden />{label('feature_copy_link')}</button>
      <a className="min-h-[48px] px-3 rounded-lg border border-border inline-flex items-center gap-2" href={url} target="_blank" rel="noreferrer"><ExternalLink size={18} aria-hidden />{label('feature_open_link')}</a>
    </div>{message && <p role="status" className="text-sm">{message}</p>}
  </div>;
}
export function ShareProfileTools({ orders }: { orders: Order[] }) {
  const { settings } = useSettings();
  const { demoMode } = useDemoMode();
  const { label, lang } = usePreferences();
  const [agree, setAgree] = useState(false);
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [expires, setExpires] = useState('');
  const p = computeCreditScore(orders, new Date(), settings.expenses);
  const summary = profitSummary(orders, settings.expenses || []);
  return <ToolLayout title={label('feature_share_profile')}>
    <section className={panelClass}>
      <h2 className="text-lg font-semibold">{settings.shopName}</h2>
      <p>{label('score')}: <b className="num">{p.score}</b> · {label('months_active')}: {p.monthsActive}</p>
      <p className="text-sm">{label('feature_self_reported')}</p>
      <p className="text-sm text-muted-foreground">{label('feature_snapshot')}</p>
      <label className="flex items-start gap-3 py-3 text-base"><input type="checkbox" className="h-5 w-5 shrink-0 mt-1" checked={agree} onChange={e => setAgree(e.target.checked)} data-testid="lender-consent" />{label('feature_consent')}</label>
      <button className={actionClass} disabled={!agree || busy} data-testid="create-lender-link" onClick={() => {
        setBusy(true); setError('');
        const issuedAt = Date.now(), expiresAt = issuedAt + 7 * 86400000;
        void signSnapshot({ kind: 'lender', lang, shop: settings.shopName, homeBased: settings.shopType !== undefined && settings.shopType !== 'shop',
          demo: demoMode, profile: p, profit: summary.profit, expenses: summary.spending, issuedAt, expiresAt,
        }).then(token => { setUrl(snapshotUrl('lender', token)); setExpires(shortDate(new Date(expiresAt), lang)); })
          .catch(() => setError(label('feature_error'))).finally(() => setBusy(false));
      }}><Share2 size={18} aria-hidden />{busy ? label('loading') : label('feature_create_link')}</button>
      {error && <p role="alert" className="text-danger">{error}</p>}
      {url && <><p className="text-sm">{label('feature_expires')}: {expires}</p><ShareLink url={url} /></>}
    </section>
  </ToolLayout>;
}
