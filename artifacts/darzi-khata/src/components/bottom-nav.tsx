import { ClipboardList, Plus, Users, BookOpenText, Menu, type LucideIcon } from 'lucide-react';
import { Link } from 'wouter';
import { usePreferences } from '../hooks/use-preferences';
import { DICT, type DictKey } from '../lib/i18n';

export type NavTab = 'orders' | 'customers' | 'hisaab' | 'more';

function Label({ k }: { k: DictKey }) {
  const { urduFirst } = usePreferences();
  const e = DICT[k];
  return (
    <span className="flex flex-col items-center leading-none">
      <span className={urduFirst ? 'font-urdu text-sm' : 'text-sm font-medium'} lang={urduFirst ? 'ur' : 'en'} dir={urduFirst ? 'rtl' : 'ltr'} style={{ lineHeight: urduFirst ? 2 : 1.5 }}>{urduFirst ? e.ur : e.en}</span>
    </span>
  );
}

/** Bottom tab bar: icon + short label, real links, aria-current on the active tab. */
export function BottomNav({ tab, onNew, badge }: { tab: NavTab | null; onNew: () => void; badge?: number }) {
  const { label } = usePreferences();
  const Item = ({ id, href, icon: Icon, k }: { id: NavTab; href: string; icon: LucideIcon; k: DictKey }) => {
    const on = tab === id;
    return (
      <Link href={href} aria-label={label(k)} aria-current={on ? 'page' : undefined}
        className={`relative min-w-0 min-h-[64px] flex flex-col items-center justify-center gap-0.5 ${on ? 'text-primary' : 'text-muted-foreground'}`} data-testid={`nav-${id}`}>
        {on && <span className="absolute top-0 inset-x-5 h-[3px] rounded-b-sm bg-primary" aria-hidden />}
        <Icon size={20} aria-hidden strokeWidth={on ? 2.25 : 1.75} />
        <Label k={k} />
        {id === 'more' && !!badge && <span className="num absolute top-1.5 end-[22%] min-w-5 h-5 px-1 rounded-full bg-danger text-danger-foreground text-xs leading-5 text-center" aria-hidden>{badge}</span>}
      </Link>
    );
  };
  return (
    <nav aria-label={label('main_navigation')} data-bottom-nav className="fixed bottom-0 inset-x-0 z-30 bg-card border-t border-border pb-[env(safe-area-inset-bottom)] print:hidden">
      <div className="max-w-2xl mx-auto grid grid-cols-5 items-stretch">
        <Item id="orders" href="/" icon={ClipboardList} k="nav_orders" />
        <Item id="customers" href="/customers" icon={Users} k="nav_customers" />
        <div className="min-w-0 flex items-center justify-center">
          <button onClick={onNew} className="min-h-[52px] min-w-[64px] px-3 rounded-md bg-accent text-accent-foreground border border-accent-border flex flex-col items-center justify-center gap-0.5 font-semibold" aria-label={label('new_order')} data-testid="nav-new">
            <Plus size={20} aria-hidden strokeWidth={2.5} />
            <Label k="nav_new" />
          </button>
        </div>
        <Item id="hisaab" href="/hisaab" icon={BookOpenText} k="nav_hisaab" />
        <Item id="more" href="/more" icon={Menu} k="nav_more" />
      </div>
    </nav>
  );
}
