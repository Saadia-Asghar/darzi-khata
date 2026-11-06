import { lazy, Suspense, useSyncExternalStore } from 'react';
import { APP_PATH, BASE, isStandalone, routeOf } from './lib/app-paths';
import { UpdateNotice } from './components/update-notice';

// Three separate chunks: the landing page stays small, and nothing from auth,
// storage or the signed-in shell loads until the visitor goes to /app.
const Landing = lazy(() => import('./pages/landing'));
const AppShell = lazy(() => import('./app-shell'));
const PublicPages = lazy(() => import('./pages/public-pages'));

function subscribe(cb: () => void) {
  window.addEventListener('popstate', cb);
  return () => window.removeEventListener('popstate', cb);
}
const getPath = () => window.location.pathname;

// Preserve older bookmarks after moving the register under /app.
const oldPath = window.location.pathname.slice(BASE.length);
if (/^\/(?:customers(?:\/.*)?|hisaab|more|settings|earnings|credit|worksheet|work-sheet|team|impact|reminders|due)\/?$/.test(oldPath)) {
  window.history.replaceState(null, '', `${APP_PATH}${oldPath}${location.search}${location.hash}`);
}

// An installed app starts at /app, never on the marketing page.
if (isStandalone() && routeOf(window.location.pathname).kind === 'landing' && window.location.pathname.replace(/\/$/, '') === BASE) {
  window.history.replaceState(null, '', APP_PATH);
}

function Blank() {
  return <main className="min-h-[100dvh] bg-background" aria-busy="true" />;
}

function App() {
  const path = useSyncExternalStore(subscribe, getPath);
  const route = routeOf(path);
  return (
    <><UpdateNotice /><Suspense fallback={<Blank />}>
      {route.kind === 'app' ? <AppShell />
        : route.kind === 'public' ? <PublicPages kind={route.page} token={route.token} />
        : <Landing />}
    </Suspense></>
  );
}

export default App;
