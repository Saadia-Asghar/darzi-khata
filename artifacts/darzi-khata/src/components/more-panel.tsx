import { Gauge, HandCoins, BellRing, UserCog, ClipboardList, BarChart2, Settings, LogOut, CalendarClock, Share2, MessageCircle, ChevronRight, type LucideIcon } from 'lucide-react';
import { Link } from 'wouter';
import { usePreferences } from '../hooks/use-preferences';
import { useSettings } from '../hooks/use-settings';
import { useToast } from '@/hooks/use-toast';
import { normalizePakistaniPhone } from '../lib/reminders';
import type { DictKey } from '../lib/i18n';

export type MoreTool = 'credit' | 'impact' | 'reminders' | 'team' | 'worksheet' | 'earnings' | 'due' | 'settings';
export const TOOL_PATHS: Record<MoreTool, string> = {
  credit: '/credit', impact: '/impact', reminders: '/reminders', team: '/team', worksheet: '/worksheet', earnings: '/earnings', due: '/due', settings: '/settings',
};
const TOOLS: { id: MoreTool; icon: LucideIcon; k: DictKey }[] = [
  { id: 'reminders', icon: BellRing, k: 'tool_reminders' },
  { id: 'due', icon: CalendarClock, k: 'tool_due' },
  { id: 'worksheet', icon: ClipboardList, k: 'tool_worksheet' },
  { id: 'earnings', icon: BarChart2, k: 'open_earnings' },
  { id: 'credit', icon: Gauge, k: 'tool_credit' },
  { id: 'impact', icon: HandCoins, k: 'tool_impact' },
  { id: 'team', icon: UserCog, k: 'team' },
  { id: 'settings', icon: Settings, k: 'tool_settings' },
];
declare const __DARZI_BUILD__: string;
const APP_VERSION = __DARZI_BUILD__;

export function MorePanel({ onLogout, pendingCount }: { onLogout: () => void; pendingCount: number }) {
  const { label } = usePreferences();
  const { settings } = useSettings();
  const { toast } = useToast();
  const shopWa = settings.phone ? normalizePakistaniPhone(settings.phone) : '';
  const share = async () => {
    const url = window.location.origin + import.meta.env.BASE_URL;
    const text = label('share_text');
    try {
      if (navigator.share) { await navigator.share({ title: 'Darzi Khata', text, url }); return; }
      await navigator.clipboard.writeText(`${text} ${url}`);
      toast({ title: label('link_copied') });
    } catch { /* user cancelled share */ }
  };
  const row = 'flex items-center gap-3 min-h-[56px] px-4 text-start w-full hover:bg-muted';
  return (
    <section aria-labelledby="more-title" className="dk-rise space-y-6">
      <h1 id="more-title" className="text-xl font-semibold">{label('more_title')}</h1>

      <div>
        <h2 className="text-sm font-medium text-muted-foreground mb-2">{label('tools')}</h2>
        <ul className="bg-card border border-border rounded-lg divide-y divide-border overflow-hidden">
          {TOOLS.map(({ id, icon: Icon, k }) => (
            <li key={id}>
              <Link href={TOOL_PATHS[id]} className={row} data-testid={`btn-open-${id}`}>
                <Icon size={20} aria-hidden className="text-primary shrink-0" />
                <span className="flex-1 text-base font-medium">{label(k)}</span>
                {id === 'reminders' && pendingCount > 0 && <span className="num min-w-6 h-6 px-1.5 rounded-full bg-danger text-danger-foreground text-sm leading-6 text-center">{pendingCount}</span>}
                <ChevronRight size={20} aria-hidden className="text-muted-foreground rtl:rotate-180" />
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <details className="bg-card border border-border rounded-lg px-4">
        <summary className="min-h-[56px] flex items-center cursor-pointer text-base font-medium">{label('more_help')}</summary>
        <ol className="pb-4 space-y-3">
          {(['help_1', 'help_2', 'help_3'] as const).map((h, i) => (
            <li key={h} className="flex gap-3 text-base">
              <span className="num shrink-0 h-7 w-7 rounded-full bg-primary-soft text-primary text-sm font-semibold flex items-center justify-center">{i + 1}</span>
              <span>{label(h)}</span>
            </li>
          ))}
        </ol>
      </details>

      <ul className="bg-card border border-border rounded-lg divide-y divide-border overflow-hidden">
        <li>
          {shopWa ? (
            <a href={`https://wa.me/${shopWa}`} target="_blank" rel="noreferrer" className={row} data-testid="link-support">
              <MessageCircle size={20} aria-hidden className="text-success shrink-0" />
              <span className="flex-1"><span className="block text-base font-medium">{label('more_support')}</span><span dir="ltr" className="num block text-sm text-muted-foreground">{label('support_shop_number')}: {settings.phone}</span></span>
            </a>
          ) : (
            <div className={row} data-testid="support-unavailable">
              <MessageCircle size={20} aria-hidden className="text-muted-foreground shrink-0" />
              <span className="flex-1"><span className="block text-base font-medium">{label('more_support')}</span><span className="block text-sm text-muted-foreground">{label('support_unavailable')}</span></span>
            </div>
          )}
        </li>
        <li><button onClick={share} className={row} data-testid="btn-share-app"><Share2 size={20} aria-hidden className="text-primary shrink-0" /><span className="flex-1 text-base font-medium">{label('share_app')}</span></button></li>
        <li><button onClick={onLogout} className={`${row} text-danger`} data-testid="btn-logout"><LogOut size={20} aria-hidden className="shrink-0" /><span className="flex-1 text-base font-medium">{label('log_out')}</span></button></li>
      </ul>

      <div className="text-center space-y-1 pb-2">
        <p className="text-sm text-muted-foreground">{label('data_note')}</p>
        <p className="num text-sm text-muted-foreground" data-testid="app-version">{label('version')} {APP_VERSION}</p>
      </div>
    </section>
  );
}
