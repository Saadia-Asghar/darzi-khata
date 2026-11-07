import { useRef, type ReactNode } from 'react';
import { Gauge, HandCoins, BellRing, UserCog, ClipboardList, BarChart2, Settings, LogOut, CalendarClock, Share2, MessageCircle, ChevronRight, Store, Wallet, Ruler, Languages, Moon, ShieldCheck, DatabaseBackup, FlaskConical, LifeBuoy, type LucideIcon } from 'lucide-react';
import { useLocation } from 'wouter';
import { usePreferences } from '../hooks/use-preferences';
import { useSettings } from '../hooks/use-settings';
import { useToast } from '@/hooks/use-toast';
import { normalizePakistaniPhone } from '../lib/reminders';
import type { DictKey } from '../lib/i18n';

export type MoreTool = 'credit' | 'impact' | 'reminders' | 'team' | 'worksheet' | 'earnings' | 'due' | 'settings' | 'pitch' | 'share-profile' | 'recovery' | 'rush' | 'expenses' | 'savings';
export const TOOL_PATHS: Record<MoreTool, string> = {
  credit: '/credit', impact: '/impact', reminders: '/reminders', team: '/team', worksheet: '/worksheet', earnings: '/earnings', due: '/due', settings: '/settings',
  pitch: '/pitch', 'share-profile': '/share-profile', recovery: '/recovery', rush: '/rush', expenses: '/expenses', savings: '/savings',
};
const TOOLS: { id: MoreTool; icon: LucideIcon; k: DictKey; d: DictKey }[] = [
  { id: 'pitch', icon: Gauge, k: 'feature_pitch', d: 'dk_d_pitch' },
  { id: 'share-profile', icon: Share2, k: 'feature_share_profile', d: 'dk_d_share' },
  { id: 'recovery', icon: HandCoins, k: 'feature_recovery', d: 'dk_d_recovery' },
  { id: 'rush', icon: CalendarClock, k: 'feature_rush', d: 'dk_d_rush' },
  { id: 'expenses', icon: BarChart2, k: 'feature_expenses', d: 'dk_d_expenses' },
  { id: 'savings', icon: HandCoins, k: 'feature_savings', d: 'dk_d_savings' },
  { id: 'reminders', icon: BellRing, k: 'tool_reminders', d: 'dk_d_reminders' },
  { id: 'due', icon: CalendarClock, k: 'tool_due', d: 'dk_d_due' },
  { id: 'worksheet', icon: ClipboardList, k: 'tool_worksheet', d: 'dk_d_worksheet' },
  { id: 'earnings', icon: BarChart2, k: 'open_earnings', d: 'dk_d_earnings' },
  { id: 'credit', icon: Gauge, k: 'tool_credit', d: 'dk_tile_credit' },
  { id: 'impact', icon: HandCoins, k: 'tool_impact', d: 'dk_tile_impact' },
  { id: 'team', icon: UserCog, k: 'team', d: 'dk_tile_team' },
  { id: 'settings', icon: Settings, k: 'tool_settings', d: 'dk_d_settings' },
];
type Tile = { id: string; icon: LucideIcon; k: DictKey; d: DictKey; anchor?: string; href?: string };
/** The twelve settings tiles requested for tablet/desktop. Anchors open the settings page section. */
const SETTINGS_TILES: Tile[] = [
  { id: 'shop', icon: Store, k: 'shop_details', d: 'dk_tile_shop', anchor: 'shop' },
  { id: 'payment', icon: Wallet, k: 'payment_details', d: 'dk_tile_payment', anchor: 'payment' },
  { id: 'team', icon: UserCog, k: 'team', d: 'dk_tile_team', anchor: 'team' },
  { id: 'templates', icon: Ruler, k: 'measurement_templates', d: 'dk_tile_templates', anchor: 'templates' },
  { id: 'language', icon: Languages, k: 'language', d: 'dk_tile_language', anchor: 'language' },
  { id: 'dark', icon: Moon, k: 'dark_mode', d: 'dk_tile_dark', anchor: 'dark' },
  { id: 'pin', icon: ShieldCheck, k: 'optional_app_lock', d: 'dk_tile_pin', anchor: 'pin' },
  { id: 'backup', icon: DatabaseBackup, k: 'data_backup', d: 'dk_tile_backup', anchor: 'backup' },
  { id: 'demo', icon: FlaskConical, k: 'demo_mode', d: 'dk_tile_demo', anchor: 'demo' },
  { id: 'credit', icon: Gauge, k: 'tool_credit', d: 'dk_tile_credit', href: '/credit' },
  { id: 'impact', icon: HandCoins, k: 'tool_impact', d: 'dk_tile_impact', href: '/impact' },
  { id: 'help', icon: LifeBuoy, k: 'more_help', d: 'dk_tile_help' },
];
declare const __DARZI_BUILD__: string;
const APP_VERSION = __DARZI_BUILD__;

export function MorePanel({ onLogout, pendingCount }: { onLogout: () => void; pendingCount: number; renderSettings?: (onClose: () => void) => ReactNode }) {
  const { label } = usePreferences();
  const [, navigate] = useLocation();
  const helpRef = useRef<HTMLDetailsElement>(null);
  /** Every tile opens a real page in the content area. Settings tiles jump to their section. */
  const openTile = (t: Tile) => {
    if (t.href) { navigate(t.href); return; }
    if (t.anchor) { navigate(`/settings#${t.anchor}`); return; }
    const el = helpRef.current;
    if (el) { el.open = true; el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  };
  const helpSteps = (
    <ol className="space-y-2">
      {(['help_1', 'help_2', 'help_3'] as const).map((h, i) => (
        <li key={h} className="flex gap-3 text-sm">
          <span className="num shrink-0 h-6 w-6 rounded-full bg-primary-soft text-primary text-xs font-semibold flex items-center justify-center">{i + 1}</span>
          <span>{label(h)}</span>
        </li>
      ))}
    </ol>
  );
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
  const grid = 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 lg:gap-3';
  const tileCls = 'group h-full w-full min-h-[64px] text-start rounded-lg border border-border bg-card p-3 lg:p-4 flex items-start gap-2 hover:border-primary/40 hover:bg-primary-soft/40 transition-colors';
  const TileBody = ({ icon: Icon, k, d, badge }: { icon: LucideIcon; k: DictKey; d: DictKey; badge?: number }) => (
    <>
      <Icon size={20} aria-hidden className="text-primary shrink-0 mt-0.5" />
      <span className="flex-1 min-w-0">
        <span className="flex items-center gap-1.5 min-w-0">
          <span className="block truncate text-sm font-semibold">{label(k)}</span>
          {!!badge && <span className="num shrink-0 min-w-5 h-5 px-1 rounded-full bg-danger text-danger-foreground text-xs leading-5 text-center">{badge}</span>}
        </span>
        <span className="block text-xs text-muted-foreground truncate" title={label(d)}>{label(d)}</span>
      </span>
      <ChevronRight size={16} aria-hidden className="hidden md:block shrink-0 mt-0.5 text-muted-foreground rtl:rotate-180" />
    </>
  );
  const row = 'flex items-center gap-3 min-h-[48px] px-3 text-start w-full hover:bg-muted';
  return (
    <section aria-labelledby="more-title" className="dk-rise space-y-4">
      <h1 id="more-title" className="text-lg font-semibold">{label('more_title')}</h1>

      <div>
        <h2 className="text-sm font-medium text-muted-foreground mb-2">{label('dk_settings_tiles')}</h2>
        <ul className={grid} data-testid="settings-tile-grid">
          {SETTINGS_TILES.map((t) => (
            <li key={t.id} className="min-w-0">
              <button type="button" onClick={() => openTile(t)} className={tileCls} data-testid={`tile-${t.id}`}>
                <TileBody icon={t.icon} k={t.k} d={t.d} />
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h2 className="text-sm font-medium text-muted-foreground mb-2">{label('dk_other_tools')}</h2>
        <ul className={grid} data-testid="tools-tile-grid">
          {TOOLS.filter(({ id }) => !['credit', 'impact'].includes(id)).map(({ id, icon, k, d }) => (
            <li key={id} className="min-w-0">
              <button type="button" onClick={() => navigate(TOOL_PATHS[id])} className={tileCls} data-testid={`btn-open-${id}`}>
                <TileBody icon={icon} k={k} d={d} badge={id === 'reminders' ? pendingCount : undefined} />
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="grid gap-2 lg:gap-3 md:grid-cols-2 md:items-start">
        <details ref={helpRef} className="bg-card border border-border rounded-lg px-3 scroll-mt-20" id="more-help">
          <summary className="min-h-[48px] flex items-center cursor-pointer text-sm font-medium">{label('more_help')}</summary>
          <div className="pb-3">{helpSteps}</div>
        </details>

        <ul className="bg-card border border-border rounded-lg divide-y divide-border overflow-hidden">
          <li>
            {shopWa ? (
              <a href={`https://wa.me/${shopWa}`} target="_blank" rel="noreferrer" className={row} data-testid="link-support">
                <MessageCircle size={20} aria-hidden className="text-success shrink-0" />
                <span className="flex-1 min-w-0"><span className="block text-sm font-medium">{label('more_support')}</span><span dir="ltr" className="num block truncate text-xs text-muted-foreground">{label('support_shop_number')}: {settings.phone}</span></span>
              </a>
            ) : (
              <div className={row} data-testid="support-unavailable">
                <MessageCircle size={20} aria-hidden className="text-muted-foreground shrink-0" />
                <span className="flex-1 min-w-0"><span className="block text-sm font-medium">{label('more_support')}</span><span className="block truncate text-xs text-muted-foreground">{label('support_unavailable')}</span></span>
              </div>
            )}
          </li>
          <li><button onClick={share} className={row} data-testid="btn-share-app"><Share2 size={20} aria-hidden className="text-primary shrink-0" /><span className="flex-1 text-sm font-medium">{label('share_app')}</span></button></li>
          <li><button onClick={onLogout} className={`${row} text-danger`} data-testid="btn-logout"><LogOut size={20} aria-hidden className="shrink-0" /><span className="flex-1 text-sm font-medium">{label('log_out')}</span></button></li>
        </ul>
      </div>

      <div className="text-center space-y-0.5">
        <p className="text-xs text-muted-foreground">{label('data_note')}</p>
        <p className="num text-xs text-muted-foreground" data-testid="app-version">{label('version')} {APP_VERSION}</p>
      </div>
    </section>
  );
}
