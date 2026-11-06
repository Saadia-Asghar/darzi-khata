import { type ReactNode, useEffect, lazy, Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { bi } from './lib/i18n';
import { AuthScreen } from './components/auth-screen';
import { useAuth } from './hooks/use-auth';
import { AuthContext } from './context/auth-context';
import { FirstRunIntro } from './components/first-run-intro';
import { AppLockGate } from './components/app-lock';
import { AppPreferences } from './hooks/use-preferences';
import {
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
} from 'wouter';

const queryClient = new QueryClient();
// Keep the sign-in shell small. Charts, receipts and order tools load after sign-in.
const Dashboard = lazy(() => import('./pages/dashboard'));
const KarigarDashboard = lazy(() => import('./components/karigar-dashboard').then(m => ({ default: m.KarigarDashboard })));
function ScreenLoading() {
  return <main className="min-h-[100dvh] p-6 bg-background text-foreground" role="status">{bi('loading')}</main>;
}

function Router() {
  return (
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/">{() => <Dashboard section="orders" />}</Route>
        <Route path="/customers">{() => <Dashboard section="customers" />}</Route>
        <Route path="/customers/:phone">{(p) => <Dashboard section="customer" phone={decodeURIComponent(p.phone)} />}</Route>
        <Route path="/hisaab">{() => <Dashboard section="hisaab" />}</Route>
        <Route path="/more">{() => <Dashboard section="more" />}</Route>
        <Route path="/settings">{() => <Dashboard section="settings" />}</Route>
        <Route path="/earnings">{() => <Dashboard section="earnings" />}</Route>
        <Route path="/credit">{() => <Dashboard section="credit" />}</Route>
        <Route path="/worksheet">{() => <Dashboard section="worksheet" />}</Route>
        <Route path="/work-sheet">{() => <Dashboard section="worksheet" />}</Route>
        <Route path="/team">{() => <Dashboard section="team" />}</Route>
        <Route path="/impact">{() => <Dashboard section="impact" />}</Route>
        <Route path="/reminders">{() => <Dashboard section="reminders" />}</Route>
        <Route path="/due">{() => <Dashboard section="due" />}</Route>
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
      <AppPreferences><AppLockGate key={currentUser.id}>
      <FirstRunIntro />
      <Suspense fallback={<ScreenLoading />}>{currentUser.role === 'karigar' ? (
        // Karigar sees a simplified task view
        <KarigarDashboard />
      ) : (
        // Owner sees the full shop dashboard
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
      )}</Suspense>
      </AppLockGate></AppPreferences>
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
