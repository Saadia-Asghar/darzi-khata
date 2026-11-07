import { useEffect, useState, type MouseEvent, type ReactNode } from 'react';
import { ArrowRight, Check, Github, MessageCircle, Play, ShieldCheck } from 'lucide-react';
import { DICT, fill, money, type DictKey, type Lang } from '../lib/i18n';
import { BASE, LOGIN_PATH, go } from '../lib/app-paths';
import { BrandMark } from '../components/brand-mark';
import type { LandingStats } from './landing-stats';

declare const __DARZI_BUILD__: string;

const LANG_KEY = 'darzi-khata-auth-lang';
// Real contact details are configured at build time. Nothing is invented here.
const WHATSAPP = (import.meta.env.VITE_CONTACT_WHATSAPP as string | undefined)?.replace(/\D/g, '');
const GITHUB = 'https://github.com/Saadia-Asghar/darzi-khata';

const shot = (name: string, lang: Lang) => `${BASE}/screens/${name}-${lang}.webp`;
// Captured at a 375 x 812 phone viewport.
const SHOT_W = 375, SHOT_H = 812;

function readLang(): Lang {
  try { return localStorage.getItem(LANG_KEY) === 'ur' ? 'ur' : 'en'; } catch { return 'en'; }
}

function Folio({ n, children, id }: { n: string; children: ReactNode; id?: string }) {
  return (
    <div className="flex items-baseline gap-3" id={id}>
      <span className="num text-sm text-muted-foreground" dir="ltr" aria-hidden>{n}</span>
      <h2 className="text-xl font-semibold text-foreground">{children}</h2>
    </div>
  );
}

function Phone({ src, alt, eager }: { src: string; alt: string; eager?: boolean }) {
  return (
    <div className="rounded-lg border-[6px] border-foreground bg-foreground overflow-hidden w-full max-w-[280px] mx-auto">
      <img src={src} alt={alt} width={SHOT_W} height={SHOT_H}
        loading={eager ? 'eager' : 'lazy'} decoding={eager ? 'sync' : 'async'}
        fetchPriority={eager ? 'high' : 'auto'}
        className="block w-full h-auto bg-card" />
    </div>
  );
}

export default function Landing() {
  const [lang, setLang] = useState<Lang>(readLang);
  const [stats, setStats] = useState<LandingStats | null>(null);
  const t = (k: DictKey, vars?: Record<string, string | number>) => fill(DICT[k][lang], vars, lang);
  const ur = lang === 'ur';

  useEffect(() => {
    const el = document.documentElement;
    el.lang = lang; el.dir = ur ? 'rtl' : 'ltr';
    el.classList.remove('dark');
    document.title = DICT.land_title[lang];
    try { localStorage.setItem(LANG_KEY, lang); } catch { /* private mode */ }
  }, [lang, ur]);

  // Counters are computed off the critical path, after the hero has painted.
  useEffect(() => {
    let live = true;
    const run = () => { void import('./landing-stats').then(m => { if (live) setStats(m.landingStats()); }); };
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
    if (w.requestIdleCallback) w.requestIdleCallback(run, { timeout: 2500 }); else setTimeout(run, 300);
    return () => { live = false; };
  }, []);

  const nav = (to: string) => (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault(); go(to);
  };
  const openHref = LOGIN_PATH;
  const signupHref = LOGIN_PATH;
  const demoHref = `${LOGIN_PATH}?demo=1`;
  const version = typeof __DARZI_BUILD__ === 'string' ? __DARZI_BUILD__ : 'dev';

  const btnPrimary = 'inline-flex items-center justify-center gap-2 min-h-[48px] px-5 rounded-md bg-primary text-primary-foreground text-base font-semibold hover:opacity-95 transition-opacity';
  const btnSecondary = 'inline-flex items-center justify-center gap-2 min-h-[48px] px-5 rounded-md border border-border bg-card text-foreground text-base font-semibold hover:bg-muted transition-colors';
  const wrap = 'mx-auto w-full max-w-[1040px] px-4 sm:px-6';
  const section = `${wrap} py-10 sm:py-16`;

  const steps: [DictKey, DictKey][] = [['land_step_1', 'land_step_1_body'], ['land_step_2', 'land_step_2_body'], ['land_step_3', 'land_step_3_body']];
  const screens: [string, DictKey][] = [['parchi', 'land_cap_parchi'], ['payments', 'land_cap_payments'], ['credit', 'land_cap_credit']];
  const lenderRows: DictKey[] = ['land_lend_profile', 'land_lend_ontime', 'land_lend_collect', 'land_lend_digital', 'land_lend_consent'];
  const counters: { k: DictKey; v: (s: LandingStats) => string }[] = [
    { k: 'land_impact_orders', v: s => fill('{n}', { n: s.orders }, lang) },
    { k: 'land_impact_rs', v: s => money(s.handled) },
    { k: 'land_impact_digital', v: s => fill('{n}%', { n: s.digitalPercent }, lang) },
    { k: 'land_impact_score', v: s => fill('{n}', { n: s.score }, lang) },
  ];

  return (
    <div className="min-h-[100dvh] bg-background text-foreground" lang={lang} dir={ur ? 'rtl' : 'ltr'}>
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:start-2 focus:z-50 focus:bg-card focus:p-3 focus:rounded-md">{t('land_skip')}</a>

      <header className="sticky top-0 z-40 bg-background border-b border-border">
        <div className={`${wrap} flex items-center gap-2 min-h-16 py-2`}>
          <a href={`${BASE}/`} className="flex items-center gap-1.5 min-h-[44px] shrink-0" data-testid="link-home">
            <BrandMark size={28} />
            <span className="text-sm sm:text-lg font-semibold" lang="en" dir="ltr">Darzi Khata</span>
          </a>
          <nav className="hidden md:flex items-center gap-1 ms-4 text-sm text-muted-foreground" aria-label={t('land_nav_how')}>
            <a href="#how" className="px-3 py-2 rounded-md hover:bg-muted hover:text-foreground">{t('land_nav_how')}</a>
            <a href="#lenders" className="px-3 py-2 rounded-md hover:bg-muted hover:text-foreground">{t('land_nav_lenders')}</a>
          </nav>
          <div className="ms-auto flex items-center gap-2">
            <div role="group" aria-label={DICT.language[lang]} dir="ltr" className="inline-flex rounded-md border border-border bg-card p-0.5">
              {(['en', 'ur'] as const).map(l => (
                <button key={l} type="button" aria-pressed={lang === l} onClick={() => setLang(l)} lang={l}
                  className={`min-h-[44px] min-w-[44px] px-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors ${lang === l ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'} ${l === 'ur' ? 'font-urdu' : ''}`}
                  data-testid={`landing-lang-${l}`}>
                  {DICT[l === 'en' ? 'language_en' : 'language_ur'][lang]}
                </button>
              ))}
            </div>
            <a href={openHref} onClick={nav(openHref)} className="min-h-[44px] inline-flex items-center justify-center px-2.5 rounded-md bg-primary text-primary-foreground text-xs sm:text-sm font-semibold shrink-0" data-testid="link-open-app">{t('land_open_app')}</a>
          </div>
        </div>
      </header>

      <main id="main">
        {/* Hero */}
        <section className={`${wrap} pt-10 pb-10 sm:pt-16 sm:pb-16 grid gap-10 md:grid-cols-[1.15fr_0.85fr] md:items-center`}>
          <div className="dk-rise">
            <p className="text-sm font-medium text-primary">{t('land_kicker')}</p>
            <h1 className="mt-3 text-2xl sm:text-[36px] sm:leading-[1.2] font-semibold text-foreground max-w-[18ch]" data-testid="text-hero">{t('land_hero')}</h1>
            <div className="mt-5 h-[3px] w-16 bg-accent rounded-sm" aria-hidden />
            <p className="mt-5 text-lg text-muted-foreground">{t('land_hero_sub')}</p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <a href={signupHref} onClick={nav(signupHref)} className={btnPrimary} data-testid="link-start-free">
                {t('land_start_free')} <ArrowRight size={20} className="rtl:-scale-x-100" aria-hidden />
              </a>
              <a href={demoHref} onClick={nav(demoHref)} className={btnSecondary} data-testid="link-try-demo">
                <Play size={20} aria-hidden /> {t('land_try_demo')}
              </a>
            </div>
            <p className="mt-4 text-sm text-muted-foreground max-w-[46ch]">{t('land_demo_note')}</p>
          </div>
          <figure>
            <Phone src={shot('orders', lang)} alt={t('land_shot_orders')} eager />
            <figcaption className="mt-3 text-center text-xs text-muted-foreground">{t('land_shot_orders')}</figcaption>
          </figure>
        </section>

        {/* Problem: ruled register lines */}
        <section className="border-y border-border bg-card">
          <div className={section}>
            <Folio n="01">{t('land_problem_title')}</Folio>
            <ol className="mt-6 border-t border-border">
              {(['land_problem_1', 'land_problem_2', 'land_problem_3'] as const).map((k, i) => (
                <li key={k} className="flex gap-4 py-4 border-b border-border">
                  <span className="num text-sm text-muted-foreground w-6 shrink-0 pt-0.5" dir="ltr" aria-hidden>{fill('{n}', { n: i + 1 }, lang)}</span>
                  <p className="text-lg text-foreground">{t(k)}</p>
                </li>
              ))}
            </ol>
            <div className="mt-8 grid gap-4 md:grid-cols-[auto_1fr] md:items-center">
              <p className="num text-[48px] leading-none font-semibold text-primary" dir="ltr">{fill('{n}%', { n: 92 }, lang)}</p>
              <div>
                <p className="text-lg text-foreground">{t('land_stat')}</p>
                <a href="https://www.sbp.org.pk/assets/document/publications/PS-Review-Q2FY26.pdf" target="_blank" rel="noreferrer" className="mt-1 text-xs text-muted-foreground underline inline-flex min-h-[44px] items-center">{t('land_stat_source')}</a>
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className={section} id="how">
          <Folio n="02">{t('land_how_title')}</Folio>
          <ol className="mt-8 grid gap-6 md:grid-cols-3">
            {steps.map(([title, body], i) => (
              <li key={title} className="border-t-2 border-primary pt-4">
                <span className="num inline-flex items-center justify-center w-9 h-9 rounded-md bg-primary-soft text-primary text-base font-semibold">{fill('{n}', { n: i + 1 }, lang)}</span>
                <h3 className="mt-3 text-lg font-semibold">{t(title)}</h3>
                <p className="mt-2 text-base text-muted-foreground">{t(body)}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Screens */}
        <section className="border-y border-border bg-card">
          <div className={section}>
            <Folio n="03">{t('land_screens_title')}</Folio>
            <div className="mt-8 grid gap-10 sm:grid-cols-3 sm:gap-6">
              {screens.map(([name, cap]) => (
                <figure key={name}>
                  <Phone src={shot(name, lang)} alt={t(cap)} />
                  <figcaption className="mt-3 text-base text-center text-foreground max-w-[30ch] mx-auto">{t(cap)}</figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        {/* Lenders */}
        <section className={section} id="lenders">
          <div className="grid gap-8 md:grid-cols-2">
            <div>
              <Folio n="04">{t('land_lenders_title')}</Folio>
              <p className="mt-4 text-lg text-foreground">{t('land_lenders_body')}</p>
              <p className="mt-4 text-sm text-muted-foreground flex gap-2"><ShieldCheck size={18} className="shrink-0 mt-0.5 text-primary" aria-hidden />{t('land_lend_note')}</p>
            </div>
            <ul className="rounded-lg border border-border bg-card divide-y divide-border">
              {lenderRows.map(k => (
                <li key={k} className="flex gap-3 px-4 py-3.5">
                  <Check size={20} className="shrink-0 mt-0.5 text-success" aria-hidden />
                  <span className="text-base">{t(k)}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Impact counters: demo ledger */}
        <section className="border-y border-border bg-card">
          <div className={section}>
            <div className="flex flex-wrap items-center gap-3">
              <Folio n="05">{t('land_impact_title')}</Folio>
              <span className="rounded-md bg-warning-soft text-warning px-2 py-0.5 text-xs font-semibold" data-testid="badge-demo-data">{t('land_demo_badge')}</span>
            </div>
            <dl className="mt-6 border-t border-border" aria-busy={!stats}>
              {counters.map(c => (
                <div key={c.k} className="flex items-baseline gap-3 py-4 border-b border-border">
                  <dt className="text-base text-muted-foreground">{t(c.k)}</dt>
                  <span className="flex-1 border-b border-dotted border-border translate-y-[-4px]" aria-hidden />
                  <dd className="num text-xl font-semibold text-foreground" dir="ltr" data-testid={`stat-${c.k}`}>
                    {stats ? c.v(stats) : <span className="inline-block h-6 w-20 rounded-sm bg-muted animate-pulse" aria-label={t('land_loading_counts')} />}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 text-sm text-muted-foreground">{t('land_impact_note')}</p>
          </div>
        </section>

        {/* Team */}
        <section className={section}>
          <Folio n="06">{t('land_team_title')}</Folio>
          <p className="mt-4 text-lg">{t('land_team_body')}</p>
          {(WHATSAPP || GITHUB) && (
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              {WHATSAPP && (
                <a href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noopener noreferrer" className={btnPrimary} data-testid="link-whatsapp">
                  <MessageCircle size={20} aria-hidden /> {t('land_whatsapp')}
                </a>
              )}
              {GITHUB && (
                <a href={GITHUB} target="_blank" rel="noopener noreferrer" className={btnSecondary} data-testid="link-github">
                  <Github size={20} aria-hidden /> {t('land_github')}
                </a>
              )}
            </div>
          )}
          <div className="mt-10 flex flex-col sm:flex-row gap-3">
            <a href={signupHref} onClick={nav(signupHref)} className={btnPrimary} data-testid="link-start-free-bottom">{t('land_start_free')}</a>
            <a href={openHref} onClick={nav(openHref)} className={btnSecondary} data-testid="link-open-app-bottom">{t('land_open_app')}</a>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className={`${wrap} py-8 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between text-sm text-muted-foreground`}>
          <p className="flex items-center gap-2"><ShieldCheck size={18} className="text-primary shrink-0" aria-hidden />{t('land_privacy')}</p>
          <p className="num" data-testid="text-version">{t('land_version', { v: version })}</p>
        </div>
      </footer>
    </div>
  );
}
