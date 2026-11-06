import { Link } from 'wouter';
import { usePreferences } from '../hooks/use-preferences';

export default function NotFound() {
  const { label } = usePreferences();
  return (
    <div className="min-h-[100dvh] w-full flex items-center justify-center bg-background p-6">
      <div className="max-w-sm w-full rounded-lg border border-border bg-card p-6 text-center">
        <p className="text-lg font-semibold">{label('page_not_found')}</p>
        <Link href="/" className="mt-4 inline-flex min-h-[48px] items-center justify-center rounded-md bg-primary px-5 text-base font-semibold text-primary-foreground">{label('go_home')}</Link>
      </div>
    </div>
  );
}
