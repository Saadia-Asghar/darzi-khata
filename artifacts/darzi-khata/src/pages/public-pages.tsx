import { useEffect, useState, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import QRCode from 'qrcode';
import { verifySnapshot, type PublicSnapshot, type LenderSnapshot, type TrackingSnapshot } from '../lib/public-token';
import { DICT, fill, money, shortDate, setCurrentLang, type DictKey, type Lang, type Vars } from '../lib/i18n';
import { printElement } from '../lib/print';
import { LanguageSwitch } from '../components/language-switch';
import { QR_INK, QR_PAPER } from '../lib/brand';

export default function PublicPages({ kind, token }: { kind: 'lender' | 'track'; token: string }) {
  const [snapshot, setSnapshot] = useState<PublicSnapshot>();
  const [error, setError] = useState('');
  const [lang, setLang] = useState<Lang>('en');
  const sheet = useRef<HTMLDivElement>(null);
  const t = (key: DictKey, vars?: Vars) => fill(DICT[key][lang], vars, lang);
  useEffect(() => {
    let alive = true;
    setSnapshot(undefined); setError('');
    void verifySnapshot(token, kind).then(value => { if (alive) { setSnapshot(value); setLang(value.lang); } })
      .catch(e => { if (alive) setError(e instanceof Error && e.message === 'expired' ? 'feature_expired_link' : 'feature_invalid_link'); });
    return () => { alive = false; };
  }, [token, kind]);
  useEffect(() => {
    document.documentElement.dir = lang === 'ur' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
    document.title = t(kind === 'lender' ? 'business_profile' : 'feature_order_status') + ' | Darzi Khata';
    setCurrentLang(lang);
  }, [lang, kind]);
  useEffect(() => {
    const robots = document.createElement('meta');
    robots.name = 'robots'; robots.content = 'noindex, nofollow, noarchive';
    const referrer = document.createElement('meta');
    referrer.name = 'referrer'; referrer.content = 'no-referrer';
    document.head.append(robots, referrer);
    return () => { robots.remove(); referrer.remove(); };
  }, []);
  // Expiry is also enforced while a shared page stays open.
  useEffect(() => {
    if (!snapshot) return;
    const timer = setTimeout(() => { setSnapshot(undefined); setError('feature_expired_link'); }, Math.max(0, snapshot.expiresAt - Date.now()));
    return () => clearTimeout(timer);
  }, [snapshot]);
  return <main className="min-h-[100dvh] bg-background text-foreground p-4">
    <div className="max-w-2xl mx-auto space-y-5">
      <header className="flex justify-between gap-3 items-center print:hidden"><a className="min-h-[44px] inline-flex items-center text-primary font-semibold" href={import.meta.env.BASE_URL}>{t('app_name')}</a><LanguageSwitch value={lang} onChange={setLang} /></header>
      {error ? <div role="alert" className="rounded-lg border border-border bg-card p-5">{t(error as DictKey)}</div>
        : !snapshot ? <p role="status">{t('loading')}</p>
          : <><div ref={sheet} id="public-profile-sheet" className="rounded-lg border border-border bg-card p-4 space-y-5">
            <h1 className="text-2xl font-semibold">{snapshot.shop}</h1>
            {snapshot.kind === 'lender' ? <LenderView snapshot={snapshot} t={t} lang={lang} /> : <TrackingView snapshot={snapshot} t={t} lang={lang} />}
            <p className="text-sm text-muted-foreground">{t('feature_expires')}: {shortDate(new Date(snapshot.expiresAt), lang)}</p>
          </div>
            <p className="text-sm text-muted-foreground">{t('feature_snapshot')}</p>
            <button className="min-h-[48px] rounded-lg bg-primary text-primary-foreground px-5 font-semibold" data-testid="public-download" onClick={() => { void printElement(sheet.current, { paper: 'a4', download: true }); }}>{t('feature_download_pdf')}</button>
            <p className="text-sm text-muted-foreground">{t('feature_print_hint')}</p>
          </>}
    </div>
  </main>;
}
type Translate = (key: DictKey, vars?: Vars) => string;
function LenderView({ snapshot: s, t, lang }: { snapshot: LenderSnapshot; t: Translate; lang: Lang }) {
  const p = s.profile;
  return <>
    <div className="flex flex-wrap gap-2 text-sm">{s.demo && <b className="rounded-md bg-warning-soft text-warning px-3 py-2">{t('demo_data')}</b>}{s.homeBased && <b className="rounded-md bg-primary-soft text-primary px-3 py-2">{t('feature_home_based')}</b>}</div>
    <p className="text-sm text-muted-foreground">{t('feature_self_reported')}</p>
    <dl className="grid grid-cols-2 gap-4">{([
      ['months_active', p.monthsActive], ['score', t('score_out_of', { score: p.score })], ['m_on_time_delivery', `${p.onTimePercent.toFixed(1)}%`],
      ['m_collection_rate', `${p.collectionPercent.toFixed(1)}%`], ['m_digital_payments', `${p.digitalPercent.toFixed(1)}%`],
      ['feature_income', money(p.collected)], ['feature_spending', money(s.expenses)], ['feature_profit', money(s.profit)],
    ] as const).map(([k, value]) => <div key={k}><dt className="text-sm text-muted-foreground">{t(k)}</dt><dd className="text-lg font-semibold num">{value}</dd></div>)}</dl>
    <h2 className="font-semibold">{t('monthly_revenue_series')}</h2>
    <div className="h-52 w-full" role="img" aria-label={t('monthly_revenue_series')}>
      <ResponsiveContainer width="100%" height="100%"><BarChart data={p.monthly.map(m => ({ ...m, timestamp: new Date(m.month + '-01T12:00:00').getTime() }))}>
        <XAxis dataKey="timestamp" type="number" scale="time" domain={['dataMin', 'dataMax']} tickFormatter={n => new Date(n).toLocaleDateString(lang === 'ur' ? 'ur-PK' : 'en-PK', { month: 'short' })} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
        <YAxis tickFormatter={n => String(n)} width={56} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
        <Tooltip formatter={v => money(Number(v))} labelFormatter={v => shortDate(new Date(Number(v)), lang)} />
        <Bar dataKey="revenue" fill="hsl(var(--primary))" name={t('monthly_revenue_series')} />
      </BarChart></ResponsiveContainer>
    </div>
    <table className="w-full text-sm"><caption className="sr-only">{t('monthly_revenue_series')}</caption><tbody>{p.monthly.map(m => <tr key={m.month} className="border-t border-border"><th scope="row" className="text-start py-2">{new Date(m.month + '-01T12:00:00').toLocaleDateString(lang === 'ur' ? 'ur-PK' : 'en-PK', { month: 'long', year: 'numeric' })}</th><td className="text-end num">{money(m.revenue)}</td></tr>)}</tbody></table>
    <h2 className="font-semibold">{t('six_factors')}</h2>
    <ul className="space-y-2">{p.factors.map(f => <li key={f.key} className="flex justify-between gap-3 border-t border-border py-2 text-sm"><span>{t(({
      age: 'm_business_age', volume: 'm_volume_consistency', growth: 'm_revenue_trend', delivery: 'm_on_time_delivery', collection: 'm_collection_rate', digital: 'm_digital_payments', profit: 'feature_profit',
    } as Record<string, DictKey>)[f.key] || 'score')}</span><span className="num">{t('score_out_of', { score: Math.round(f.score) })} · {f.weight}%</span></li>)}</ul>
  </>;
}
function TrackingView({ snapshot: s, t, lang }: { snapshot: TrackingSnapshot; t: Translate; lang: Lang }) {
  const [qr, setQr] = useState('');
  useEffect(() => {
    if (!s.payment?.account) return;
    void QRCode.toDataURL(JSON.stringify({ type: 'DARZI_KHATA_DEMO_NOT_A_BANK_QR', account: s.payment.account, amount: s.payment.balance, reference: s.reference }), { width: 200, margin: 2, color: { dark: QR_INK, light: QR_PAPER } }).then(setQr);
  }, [s]);
  return <>
    <h2 className="text-xl font-semibold">{t('feature_order_status')}</h2>
    <p className="num">{t('receipt_number')}: {s.reference}</p>
    <ol className="space-y-3" aria-label={t('feature_order_status')}>{(['pending', 'stitching', 'ready', 'delivered'] as const).map(status => <li key={status} aria-current={s.status === status ? 'step' : undefined} className={`rounded-lg border p-3 ${s.status === status ? 'bg-primary-soft border-primary font-semibold' : 'border-border text-muted-foreground'}`}>{t(`status_${status}`)}</li>)}</ol>
    <p>{t('delivery_date')}: {shortDate(s.deliveryDate, lang)}</p>
    {s.payment && <section className="border-t border-border pt-3 space-y-3"><p className="num">{t('baqi')}: {money(s.payment.balance)}</p><p className="whitespace-pre-line text-sm">{s.payment.details}</p>{qr && <img src={qr} width={200} height={200} alt={t('feature_qr_note')} />}<p className="text-sm text-muted-foreground">{t('feature_qr_note')}</p></section>}
  </>;
}
