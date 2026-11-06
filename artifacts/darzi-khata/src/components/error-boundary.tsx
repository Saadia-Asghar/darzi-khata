import { tl } from '../lib/i18n';
import {
  Component,
  type ComponentType,
  type ErrorInfo,
  type ReactNode,
} from 'react';

export interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  FallbackComponent?: ComponentType<ErrorFallbackProps>;
  /** Changing this clears a caught error. Pass the route to recover on navigation. */
  resetKey?: unknown;
}

interface ErrorBoundaryState {
  error: Error | null;
}

function toError(value: unknown): Error {
  if (value instanceof Error) {
    return value;
  }
  if (typeof value === 'string') {
    return new Error(value);
  }
  try {
    return new Error(JSON.stringify(value));
  } catch {
    return new Error(String(value));
  }
}

function DefaultFallback({ error, resetError }: ErrorFallbackProps) {
  // Rendered outside providers; the selected language is available to helpers.
  const d = (k: 'error_title' | 'error_body' | 'reload' | 'try_again') => tl(k);
  return (
    <div className="min-h-[100dvh] w-full flex items-center justify-center bg-background p-6" role="alert">
      <div className="max-w-md w-full rounded-lg border border-border bg-card p-6 text-center">
        <h1 className="text-lg font-semibold text-foreground">{d('error_title')}</h1>
        <p className="mt-2 text-base text-muted-foreground">{d('error_body')}</p>
        {import.meta.env.DEV ? (
          <pre className="mt-4 overflow-x-auto rounded-md bg-muted p-3 text-start text-sm text-foreground">{error.message || String(error)}</pre>
        ) : null}
        <div className="mt-5 grid gap-2">
          <button type="button" onClick={() => window.location.reload()} className="min-h-[48px] rounded-md bg-primary px-4 text-base font-semibold text-primary-foreground" data-testid="btn-error-reload">{d('reload')}</button>
          <button type="button" onClick={resetError} className="min-h-[44px] rounded-md border border-border px-4 text-base font-medium text-foreground">{d('try_again')}</button>
        </div>
      </div>
    </div>
  );
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return { error: toError(error) };
  }

  componentDidCatch(error: unknown, info: ErrorInfo): void {
    console.error(
      'ErrorBoundary caught an error:',
      toError(error),
      info.componentStack,
    );
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    if (
      this.state.error !== null &&
      prevProps.resetKey !== this.props.resetKey
    ) {
      this.resetError();
    }
  }

  resetError = (): void => {
    this.setState({ error: null });
  };

  render(): ReactNode {
    const { error } = this.state;
    if (error === null) {
      return this.props.children;
    }
    const Fallback = this.props.FallbackComponent ?? DefaultFallback;
    return <Fallback error={error} resetError={this.resetError} />;
  }
}
