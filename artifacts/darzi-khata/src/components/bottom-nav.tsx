import { ClipboardList, Plus, Users, Wallet, LayoutGrid, type LucideIcon } from 'lucide-react';
import { usePreferences } from '../hooks/use-preferences';

export type NavTab = 'orders' | 'customers' | 'payments' | 'more';

export function BottomNav({ tab, onTab, onNew, badge }: { tab: NavTab; onTab: (t: NavTab) => void; onNew: () => void; badge?: number }) {
  const { label, urduFirst } = usePreferences();
  const Item = ({ id, icon: Icon, en, ur }: { id: NavTab; icon: LucideIcon; en: string; ur: string }) => {
    const on = tab === id;
    return (
      <button onClick={() => onTab(id)} aria-label={label(en,ur)} aria-current={on ? 'page' : undefined} className={`relative min-w-0 min-h-[96px] py-2 flex flex-col items-center justify-center gap-1 font-semibold transition-colors ${on ? 'text-emerald-800 dark:text-amber-400' : 'text-muted-foreground'}`} data-testid={`nav-${id}`}>
        {on && <span className="absolute top-0 inset-x-4 h-1 rounded-b-full bg-amber-500" aria-hidden />}
        <Icon size={21} aria-hidden />
        <span className="flex flex-col items-center max-w-full text-center" style={{gap:2}}>
          <span lang="ur" style={{fontSize:urduFirst?15:13,lineHeight:'28px',order:urduFirst?0:1,whiteSpace:'nowrap'}}>{ur}</span>
          <span lang="en" dir="ltr" style={{fontFamily:'Inter, Arial, sans-serif',fontSize:12,lineHeight:'18px',letterSpacing:'-0.3px',order:urduFirst?1:0,whiteSpace:'nowrap'}}>{en}</span>
        </span>
        {id === 'more' && !!badge && <span className="absolute top-1.5 end-[22%] min-w-5 h-5 px-1 rounded-full bg-red-600 text-white text-[10px] flex items-center justify-center">{badge}</span>}
      </button>
    );
  };
  return (
    <nav aria-label={label('Main navigation', 'مرکزی نیویگیشن')} className="fixed bottom-0 inset-x-0 z-30 bg-card/95 backdrop-blur border-t border-border pb-[env(safe-area-inset-bottom)]">
      <div className="max-w-2xl mx-auto grid grid-cols-5 items-stretch">
        <Item id="orders" icon={ClipboardList} en="Orders" ur="آرڈر" />
        <Item id="customers" icon={Users} en="Customers" ur="گاہک" />
        <div className="min-w-0 flex items-start justify-center">
          <button onClick={onNew} className="-mt-5 h-[64px] w-[64px] shrink-0 rounded-full bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-700/30 flex flex-col items-center justify-center active:scale-95 transition-transform motion-reduce:transition-none ring-4 ring-background" aria-label={label('New order', 'نیا آرڈر')} data-testid="nav-new">
            <Plus size={22} aria-hidden /><span className="text-[10px] font-bold leading-snug"><span className="block">{urduFirst?'نیا':'New'}</span><span className="block">{urduFirst?'New':'نیا'}</span></span>
          </button>
        </div>
        <Item id="payments" icon={Wallet} en="Payments" ur="ادائیگی" />
        <Item id="more" icon={LayoutGrid} en="More" ur="مزید" />
      </div>
    </nav>
  );
}
