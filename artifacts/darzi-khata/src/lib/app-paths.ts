/** Public site lives at BASE, the signed-in app at BASE/app. One place for both. */
export const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');
export const APP_PATH = `${BASE}/app`;
export const LOGIN_PATH = `${APP_PATH}/login`;

export type TopRoute =
  | { kind: 'landing' }
  | { kind: 'app' }
  | { kind: 'public'; page: 'lender' | 'track'; token: string };

export function routeOf(pathname: string): TopRoute {
  const p = (pathname.startsWith(BASE) ? pathname.slice(BASE.length) : pathname) || '/';
  if (p === '/app' || p.startsWith('/app/')) return { kind: 'app' };
  const m = p.match(/^\/(lender|track)\/([^/]+)\/?$/);
  if (m) return { kind: 'public', page: m[1] as 'lender' | 'track', token: decodeURIComponent(m[2]) };
  return { kind: 'landing' };
}

export function isStandalone() {
  try {
    return window.matchMedia('(display-mode: standalone)').matches
      || (navigator as Navigator & { standalone?: boolean }).standalone === true;
  } catch { return false; }
}

/** Client-side navigation between the landing page and the app shell. */
export function go(to: string) {
  window.history.pushState(null, '', to);
  window.dispatchEvent(new PopStateEvent('popstate'));
  window.scrollTo(0, 0);
}
