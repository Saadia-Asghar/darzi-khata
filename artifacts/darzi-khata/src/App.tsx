import { type ReactNode, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import Dashboard from './pages/dashboard';
import { KarigarDashboard } from './components/karigar-dashboard';
import { AuthScreen } from './components/auth-screen';
import { useAuth } from './hooks/use-auth';
import { AuthContext } from './context/auth-context';
import { FirstRunIntro } from './components/first-run-intro';
import {
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
} from 'wouter';

const queryClient = new QueryClient();

function Router() {
  return (
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function AppShell() {
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

  // dataOwnerId: for orders/karigars/templates
  //   - owner: use own id
  //   - karigar: use their owner's id so they share the shop's data
  const dataOwnerId =
    currentUser.role === 'karigar'
      ? (currentUser.ownerId ?? currentUser.id)
      : currentUser.id;

  return (
    <AuthContext.Provider
      value={{ currentUser, userId: currentUser.id, dataOwnerId, logout, updateCurrentUser }}
    >
      <FirstRunIntro />
      {currentUser.role === 'karigar' ? (
        // Karigar sees a simplified task view
        <KarigarDashboard />
      ) : (
        // Owner sees the full shop dashboard
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
      )}
    </AuthContext.Provider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppShell />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
