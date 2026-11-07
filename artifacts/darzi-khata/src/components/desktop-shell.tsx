import { ClipboardList, Users, Plus, BookOpenText, Gauge, Menu, LockKeyhole, LogOut, Search, type LucideIcon } from 'lucide-react';
import { Link } from 'wouter';
import { usePreferences } from '../hooks/use-preferences';
import { useAuthContext } from '../context/auth-context';
import { useStoredValue } from '../lib/local-store';
import { pinKey, type PinLock } from '../lib/pin';
import { BrandMark } from './brand-mark';
import { LanguageSwitch } from './language-switch';
import type { DictKey } from '../lib/i18n';

export type SideTab = 'orders' | 'customers' | 'hisaab' | 'credit' | 'more' | null;

/**
 * Desktop (>= 1024px) navigation. Positioned with logical `start`, so it sits on
 * the left in English and moves to the right automatically when dir="rtl" (Urdu).
 */
export function DesktopSidebar({ tab, onNew, onLogout, onSetupPin, pendingCount }: {
  tab: SideTab; onNew: () => void; onLogout: () => void; onSetupPin: () => void; pendingCount: number;
}) {
  const { label } = usePreferences();
  const { userId } = useAuthContext();
  const lock = useStoredValue<PinLock | null>(pinKey(userId), null);
  const Item = ({ id, href, icon: Icon, k, badge }: { id: Exclude<SideTab, null>; href: string; icon: LucideIcon; k: DictKey; badge?: number }) => {
    const on = tab === id;
    return (
      <Link href={href} aria-current={on ? 'page' : undefined} data-testid={`sidebar-${id}`}
        className={`relative flex items-center gap-3 min-h-[44px] px-3 rounded-md text-base font-medium transition-colors ${on ? 'bg-primary-soft text-primary' : 'text-foreground hover:bg-muted'}`}>
        {on && <span className="absolute inset-y-2 start-0 w-[3px] rounded-full bg-primary" aria-hidden />}
        <Icon size={20} aria-hidden strokeWidth={on ? 2.25 : 1.75} className="shrink-0" />
        <span className="flex-1 min-w-0 truncate">{label(k)}</span>
        {!!badge && <span className="num min-w-6 h-6 px-1.5 rounded-full bg-danger text-danger-foreground text-xs leading-6 text-center">{badge}</span>}
      </Link>
    );
  };
  return (
    <aside aria-label={label('main_navigation')} data-testid="desktop-sidebar"
      className="hidden lg:flex fixed inset-y-0 start-0 z-30 w-64 flex-col bg-card border-e border-border print:hidden">
      <Link href="/" className="flex items-center gap-3 px-5 min-h-[72px] border-b border-border" data-testid="sidebar-logo">
        <BrandMark size={36} />
        <span className="font-semibold text-lg leading-tight">{label('app_name')}</span>
      </Link>
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        <Item id="orders" href="/" icon={ClipboardList} k="nav_orders" />
        <Item id="customers" href="/customers" icon={Users} k="nav_customers" />
        <button type="button" onClick={onNew} data-testid="sidebar-new"
          className="w-full my-2 flex items-center gap-3 min-h-[48px] px-3 rounded-md bg-accent text-accent-foreground border border-accent-border font-semibold">
          <Plus size={20} aria-hidden strokeWidth={2.5} /> <span>{label('new_order')}</span>
        </button>
        <Item id="hisaab" href="/hisaab" icon={BookOpenText} k="nav_hisaab" />
        <Item id="credit" href="/credit" icon={Gauge} k="tool_credit" />
        <Item id="more" href="/more" icon={Menu} k="dk_settings_tiles" badge={pendingCount} />
      </nav>
      <div className="p-3 border-t border-border space-y-1">
        <button type="button" data-testid="sidebar-lock"
          onClick={() => { if (lock?.enabled) window.dispatchEvent(new Event('darzi-khata-lock-now')); else onSetupPin(); }}
          className="w-full flex items-center gap-3 min-h-[44px] px-3 rounded-md text-base hover:bg-muted">
          <LockKeyhole size={20} aria-hidden className="text-primary" />
          <span className="flex-1 text-start truncate">{lock?.enabled ? label('lock_now') : label('optional_app_lock')}</span>
        </button>
        <button type="button" onClick={onLogout} data-testid="sidebar-logout"
          className="w-full flex items-center gap-3 min-h-[44px] px-3 rounded-md text-base text-danger hover:bg-danger-soft">
          <LogOut size={20} aria-hidden /> <span className="flex-1 text-start">{label('log_out')}</span>
        </button>
      </div>
    </aside>
  );
}

/** Desktop top bar: shop identity, order search and the language switch. */
export function DesktopTopBar({ shopLabel, ownerName, demo, search, onSearch }: {
  shopLabel: string; ownerName?: string; demo: boolean; search: string; onSearch: (q: string) => void;
}) {
  const { label, one, lang, setLanguage } = usePreferences();
  return (
    <header data-app-header data-testid="desktop-topbar" className="hidden lg:block sticky top-0 z-20 bg-background border-b border-border print:hidden">
      <div className="max-w-[1200px] mx-auto px-6 min-h-[72px] flex items-center gap-6">
        <div className="min-w-0 w-60 shrink-0">
          <p className="truncate text-lg font-semibold leading-tight" data-testid="text-shop-name-desktop" title={shopLabel}>{shopLabel}</p>
          <p className="truncate text-sm text-muted-foreground">
            {demo && <span className="me-1.5 rounded-md bg-warning-soft text-warning border border-warning/30 text-xs font-medium px-1.5 py-0.5">{one('demo_badge')}</span>}
            {ownerName}
          </p>
        </div>
        <div className="relative flex-1 max-w-xl">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" size={20} aria-hidden />
          <input type="search" value={search} onChange={(e) => onSearch(e.target.value)} aria-label={label('search_orders')}
            placeholder={label('dk_search_all')} data-testid="input-search-desktop"
            className="block w-full min-h-[44px] ps-10 pe-3 rounded-lg border border-input bg-card text-base placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <div className="ms-auto"><LanguageSwitch value={lang} onChange={setLanguage} /></div>
      </div>
    </header>
  );
}
