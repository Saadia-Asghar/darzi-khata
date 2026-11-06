import { useEffect, lazy, Suspense } from 'react';
import { bi } from './lib/i18n';
import { AuthScreen } from './components/auth-screen';
import { useAuth } from './hooks/use-auth';

// The lock, onboarding, routing and UI providers are only needed after sign-in.
// Workbox still precaches this chunk and its dependencies for offline use.
const SignedInApp = lazy(() => import('./signed-in-app'));
function ScreenLoading() {
  return <main className="min-h-[100dvh] p-6 bg-background text-foreground" role="status">{bi('loading')}</main>;
}

function App() {
  const { currentUser, isAuthenticated, login, signup, logout, updateCurrentUser } = useAuth();

  // Apply dark mode from user-specific settings on login
  useEffect(() => {
    if (!currentUser) return;
    try {
      const stored = localStorage.getItem(`darzi-khata-settings-${currentUser.id}`);
      if (stored) {
        const s = JSON.parse(stored);
        document.documentElement.classList.toggle('dark', !!s.darkMode);
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch { /* ignore */ }
  }, [currentUser?.id]);

  if (!isAuthenticated || !currentUser) {
    return <AuthScreen onLogin={login} onSignup={signup} />;
  }

  return (
    <Suspense fallback={<ScreenLoading />}>
      <SignedInApp currentUser={currentUser} logout={logout} updateCurrentUser={updateCurrentUser} />
    </Suspense>
  );
}

export default App;
