import { lazy, Suspense, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import { ErrorBoundary } from './components/error-boundary';
import { Toaster } from './components/ui/toaster';
import { TooltipProvider } from './components/ui/tooltip';
import { FirstRunIntro } from './components/first-run-intro';
import { AppLockGate } from './components/app-lock';
import { AppPreferences } from './hooks/use-preferences';
import type { useAuth } from './hooks/use-auth';
import { AuthContext } from './context/auth-context';
import NotFound from './pages/not-found';
import { bi } from './lib/i18n';
import { APP_PATH } from './lib/app-paths';

const queryClient = new QueryClient();
const Dashboard = lazy(() => import('./pages/dashboard'));
const KarigarDashboard = lazy(() => import('./components/karigar-dashboard').then(m => ({ default: m.KarigarDashboard })));

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
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
        <Route path="/pitch">{() => <Dashboard section="pitch" />}</Route>
        <Route path="/recovery">{() => <Dashboard section="recovery" />}</Route>
        <Route path="/rush">{() => <Dashboard section="rush" />}</Route>
        <Route path="/expenses">{() => <Dashboard section="expenses" />}</Route>
        <Route path="/savings">{() => <Dashboard section="savings" />}</Route>
        <Route path="/share-profile">{() => <Dashboard section="share-profile" />}</Route>
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

type SignedInProps = Pick<ReturnType<typeof useAuth>, 'logout' | 'updateCurrentUser'> & {
  currentUser: NonNullable<ReturnType<typeof useAuth>['currentUser']>;
};

export default function SignedInApp({ currentUser, logout, updateCurrentUser }: SignedInProps) {
  // Karigars share their owner's orders, templates and team, not another shop's.
  const dataOwnerId = currentUser.role === 'karigar'
    ? (currentUser.ownerId ?? currentUser.id) : currentUser.id;

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthContext.Provider value={{ currentUser, userId: currentUser.id, dataOwnerId, logout, updateCurrentUser }}>
          <AppPreferences>
            <AppLockGate key={currentUser.id}>
              <FirstRunIntro />
              <Suspense fallback={<main className="min-h-[100dvh] p-6 bg-background text-foreground" role="status">{bi('loading')}</main>}>
                {currentUser.role === 'karigar' ? <KarigarDashboard /> : (
                  <WouterRouter base={APP_PATH}>
                    <Router />
                  </WouterRouter>
                )}
              </Suspense>
            </AppLockGate>
          </AppPreferences>
        </AuthContext.Provider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
