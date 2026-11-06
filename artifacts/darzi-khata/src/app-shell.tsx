import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { bi } from './lib/i18n';
import { AuthScreen } from './components/auth-screen';
import { useAuth } from './hooks/use-auth';
import { APP_PATH, LOGIN_PATH } from './lib/app-paths';

// The lock, onboarding, routing and UI providers are only needed after sign-in.
// Workbox still precaches this chunk and its dependencies for offline use.
const SignedInApp = lazy(() => import('./signed-in-app'));

const DEMO_EMAIL = 'demo@darzikhata.com';
const DEMO_PASSWORD = 'demo1234';

function ScreenLoading() {
  return <main className="min-h-[100dvh] p-6 bg-background text-foreground" role="status">{bi('loading')}</main>;
}

/** Everything under /app: sign-in at /app/login, the shop register after it. */
export default function AppShell() {
  const { currentUser, isAuthenticated, login, signup, logout, updateCurrentUser } = useAuth();
  const [query] = useState(() => new URLSearchParams(window.location.search));
  const initialTab = query.get('mode') === 'signup' ? 'signup' : 'login';
  const wantsDemo = query.get('demo') === '1';
  const [demoPending, setDemoPending] = useState(wantsDemo && currentUser?.id !== 'demo-account');
  const demoStarted = useRef(false);

  // "Try demo shop" signs in to the real demo account, which carries demo data.
  useEffect(() => {
    if (!wantsDemo || currentUser?.id === 'demo-account' || demoStarted.current) return;
    demoStarted.current = true;
    void login(DEMO_EMAIL, DEMO_PASSWORD).finally(() => setDemoPending(false));
  }, [wantsDemo, currentUser?.id, login]);

  // Apply dark mode from user-specific settings on login.
  useEffect(() => {
    if (!currentUser) { document.documentElement.classList.remove('dark'); return; }
    try {
      const stored = localStorage.getItem(`darzi-khata-settings-${currentUser.id}`);
      document.documentElement.classList.toggle('dark', stored ? !!JSON.parse(stored).darkMode : false);
    } catch { /* ignore */ }
  }, [currentUser?.id]);

  // Keep the address bar honest before the routed shell reads it.
  const path = window.location.pathname.replace(/\/$/, '');
  if ((!isAuthenticated || !currentUser) && path !== LOGIN_PATH) {
    window.history.replaceState(null, '', `${LOGIN_PATH}${initialTab === 'signup' ? '?mode=signup' : ''}`);
  } else if (isAuthenticated && path === LOGIN_PATH) {
    window.history.replaceState(null, '', APP_PATH);
  }

  if (demoPending) return <ScreenLoading />;
  if (!isAuthenticated || !currentUser) {
    return <AuthScreen key={initialTab} initialTab={initialTab} onLogin={login} onSignup={signup} />;
  }
  return (
    <Suspense fallback={<ScreenLoading />}>
      <SignedInApp currentUser={currentUser} logout={logout} updateCurrentUser={updateCurrentUser} />
    </Suspense>
  );
}
