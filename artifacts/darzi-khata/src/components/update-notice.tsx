import { useEffect, useState } from 'react';
import { DICT } from '../lib/i18n';

/** Do not force-reload an open order form or erase any local shop data. */
export function UpdateNotice() {
  const [ready, setReady] = useState(() => sessionStorage.getItem('darzi-khata-update-ready') === 'true');
  const [lang, setLang] = useState<'en' | 'ur'>(() => document.documentElement.lang === 'ur' ? 'ur' : 'en');
  useEffect(() => {
    const show = () => setReady(true);
    window.addEventListener('darzi-khata-update-ready', show);
    const observer = new MutationObserver(() => setLang(document.documentElement.lang === 'ur' ? 'ur' : 'en'));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
    return () => { window.removeEventListener('darzi-khata-update-ready', show); observer.disconnect(); };
  }, []);
  if (!ready) return null;
  return <aside role="status" data-testid="app-update-ready" dir={lang === 'ur' ? 'rtl' : 'ltr'} className="fixed top-0 inset-x-0 z-[100] border-b border-border bg-card text-foreground p-3 shadow-sm print:hidden">
    <div className="max-w-2xl mx-auto flex items-center justify-between gap-3"><p className="text-sm">{DICT.update_available[lang]}</p>
      <button className="min-h-[44px] shrink-0 rounded-md bg-primary text-primary-foreground px-3 text-sm font-semibold" onClick={() => { sessionStorage.removeItem('darzi-khata-update-ready'); location.reload(); }}>{DICT.update_refresh[lang]}</button></div>
  </aside>;
}
