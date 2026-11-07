import { useState, type ReactNode } from 'react';
import * as SidePanel from '@radix-ui/react-dialog';
import { Gauge, HandCoins, BellRing, UserCog, ClipboardList, BarChart2, Settings, LogOut, CalendarClock, Share2, MessageCircle, ChevronRight, Store, Wallet, Ruler, Languages, Moon, ShieldCheck, DatabaseBackup, FlaskConical, LifeBuoy, X, type LucideIcon } from 'lucide-react';
import { Link, useLocation } from 'wouter';
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
const TOOLS: { id: MoreTool; icon: LucideIcon; k: DictKey }[] = [
  { id: 'pitch', icon: Gauge, k: 'feature_pitch' },
  { id: 'share-profile', icon: Share2, k: 'feature_share_profile' },
  { id: 'recovery', icon: HandCoins, k: 'feature_recovery' },
  { id: 'rush', icon: CalendarClock, k: 'feature_rush' },
  { id: 'expenses', icon: BarChart2, k: 'feature_expenses' },
  { id: 'savings', icon: HandCoins, k: 'feature_savings' },
  { id: 'reminders', icon: BellRing, k: 'tool_reminders' },
  { id: 'due', icon: CalendarClock, k: 'tool_due' },
  { id: 'worksheet', icon: ClipboardList, k: 'tool_worksheet' },
  { id: 'earnings', icon: BarChart2, k: 'open_earnings' },
  { id: 'credit', icon: Gauge, k: 'tool_credit' },
  { id: 'impact', icon: HandCoins, k: 'tool_impact' },
  { id: 'team', icon: UserCog, k: 'team' },
  { id: 'settings', icon: Settings, k: 'tool_settings' },
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

export function MorePanel({ onLogout, pendingCount, renderSettings }: { onLogout: () => void; pendingCount: number; renderSettings: (onClose: () => void) => ReactNode }) {
  const { label } = usePreferences();
  const [, navigate] = useLocation();
  const [panel, setPanel] = useState<Tile | null>(null);
  const isDesktop = () => window.matchMedia('(min-width: 1024px)').matches;
  const openTile = (t: Tile) => {
    if (t.href) { navigate(t.href); return; }
    if (!t.anchor) { setPanel(t); return; }
    if (isDesktop()) {
      window.history.replaceState(window.history.state, '', `${window.location.pathname}#${t.anchor}`);
      setPanel(t);
    } else navigate(`/settings#${t.anchor}`);
  };
  const closePanel = () => {
    setPanel(null);
    if (window.location.hash) window.history.replaceState(window.history.state, '', window.location.pathname);
  };
  const helpSteps = (
    <ol className="space-y-3">
      {(['help_1', 'help_2', 'help_3'] as const).map((h, i) => (
        <li key={h} className="flex gap-3 text-base">
          <span className="num shrink-0 h-7 w-7 rounded-full bg-primary-soft text-primary text-sm font-semibold flex items-center justify-center">{i + 1}</span>
          <span>{label(h)}</span>
        </li>
      ))}
    </ol>
  );
  const tileCls = 'group h-full w-full text-start rounded-lg border border-border bg-card p-4 flex items-start gap-3 hover:border-primary/40 hover:bg-primary-soft/40 transition-colors';
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
        <h2 className="text-sm font-medium text-muted-foreground mb-2">{label('dk_settings_tiles')}</h2>
        <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5" data-testid="settings-tile-grid">
          {SETTINGS_TILES.map((t) => (
            <li key={t.id}>
              <button type="button" onClick={() => openTile(t)} className={tileCls} data-testid={`tile-${t.id}`}>
                <t.icon size={20} aria-hidden className="text-primary shrink-0 mt-0.5" />
                <span className="flex-1 min-w-0">
                  <span className="block text-base font-semibold">{label(t.k)}</span>
                  <span className="block text-sm text-muted-foreground truncate" title={label(t.d)}>{label(t.d)}</span>
                  <span className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-primary">{label('dk_open')}<ChevronRight size={16} aria-hidden className="rtl:rotate-180" /></span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h2 className="text-sm font-medium text-muted-foreground mb-2">{label('dk_other_tools')}</h2>
        <ul className="bg-card border border-border rounded-lg divide-y divide-border overflow-hidden md:grid md:grid-cols-2 lg:grid-cols-3 md:divide-y-0 md:gap-px md:bg-border">
          {TOOLS.filter(({ id }) => !['credit', 'impact', 'team', 'settings'].includes(id)).map(({ id, icon: Icon, k }) => (
            <li key={id} className="bg-card">
              <Link href={TOOL_PATHS[id]} className={row} data-testid={`btn-open-${id}`}>
                <Icon size={20} aria-hidden className="text-primary shrink-0" />
                <span className="flex-1 text-base font-medium">{label(k)}</span>
                {id === 'reminders' && pendingCount > 0 && <span className="num min-w-6 h-6 px-1.5 rounded-full bg-danger text-danger-foreground text-sm leading-6 text-center">{pendingCount}</span>}
                <ChevronRight size={20} aria-hidden className="text-muted-foreground rtl:rotate-180" />
              </Link>
            </li>
          ))}
          <li className="bg-card"><Link href="/settings" className={row} data-testid="btn-open-settings"><Settings size={20} aria-hidden className="text-primary shrink-0" /><span className="flex-1 text-base font-medium">{label('tool_settings')}</span><ChevronRight size={20} aria-hidden className="text-muted-foreground rtl:rotate-180" /></Link></li>
          <li className="bg-card"><Link href="/team" className={row} data-testid="btn-open-team"><UserCog size={20} aria-hidden className="text-primary shrink-0" /><span className="flex-1 text-base font-medium">{label('team')}</span><ChevronRight size={20} aria-hidden className="text-muted-foreground rtl:rotate-180" /></Link></li>
        </ul>
      </div>

      <SidePanel.Root open={!!panel} onOpenChange={(v) => { if (!v) closePanel(); }}>
        <SidePanel.Portal>
          <SidePanel.Overlay className="fixed inset-0 z-40 bg-overlay/50 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
          <SidePanel.Content data-testid="settings-side-panel" aria-describedby={undefined}
            className="fixed inset-y-0 end-0 z-50 w-full max-w-[560px] bg-background border-s border-border shadow-xl flex flex-col outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0">
            <div className="flex items-center gap-2 px-4 min-h-[56px] border-b border-border bg-card shrink-0">
              <SidePanel.Title className="flex-1 text-base font-semibold truncate">{panel ? label(panel.k) : ''}</SidePanel.Title>
              <SidePanel.Close className="h-11 w-11 inline-flex items-center justify-center rounded-md hover:bg-muted" aria-label={label('dk_close_panel')} data-testid="btn-close-side-panel"><X size={20} aria-hidden /></SidePanel.Close>
            </div>
            <div className="flex-1 overflow-y-auto">
              {panel?.anchor ? renderSettings(closePanel) : <div className="p-5">{helpSteps}</div>}
            </div>
          </SidePanel.Content>
        </SidePanel.Portal>
      </SidePanel.Root>

      <details className="bg-card border border-border rounded-lg px-4" id="more-help">
        <summary className="min-h-[56px] flex items-center cursor-pointer text-base font-medium">{label('more_help')}</summary>
        <div className="pb-4">{helpSteps}</div>
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
