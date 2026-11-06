import { Gauge, HandCoins, BellRing, UserCog, ClipboardList, BarChart2, Settings, LogOut, CalendarClock, type LucideIcon } from 'lucide-react';
import { usePreferences } from '../hooks/use-preferences';

export type MoreTool = 'credit' | 'impact' | 'reminders' | 'team' | 'worksheet' | 'earnings' | 'due' | 'settings';
const TOOLS: { id: MoreTool; icon: LucideIcon; en: string; ur: string; hint: [string, string]; tone: string }[] = [
  { id: 'reminders', icon: BellRing, en: 'Reminders', ur: 'یاد دہانی', hint: ['WhatsApp messages to send', 'بھیجنے والے پیغامات'], tone: 'bg-card' },
  { id: 'due', icon: CalendarClock, en: 'Due today', ur: 'آج کی ڈیلیوری', hint: ['Deliveries for today and tomorrow', 'آج اور کل کی ڈیلیوری'], tone: 'bg-card' },
  { id: 'worksheet', icon: ClipboardList, en: 'Work sheet', ur: 'کام کی شیٹ', hint: ['Printable cutting list', 'پرنٹ کے لیے فہرست'], tone: 'bg-card' },
  { id: 'earnings', icon: BarChart2, en: 'Earnings', ur: 'آمدنی', hint: ['Monthly income', 'ماہانہ آمدنی'], tone: 'bg-card' },
  { id: 'credit', icon: Gauge, en: 'Credit profile', ur: 'کریڈٹ', hint: ['Business record for lenders', 'قرض کے لیے ریکارڈ'], tone: 'bg-emerald-900 text-white' },
  { id: 'impact', icon: HandCoins, en: 'Impact', ur: 'اثر', hint: ['Digital payments share', 'ڈیجیٹل ادائیگی'], tone: 'bg-amber-500 text-emerald-950' },
  { id: 'team', icon: UserCog, en: 'Team', ur: 'ٹیم', hint: ['Karigar accounts', 'کاریگر اکاؤنٹ'], tone: 'bg-card' },
  { id: 'settings', icon: Settings, en: 'Settings', ur: 'سیٹنگز', hint: ['Language, font, lock, backup', 'زبان، فونٹ، لاک، بیک اپ'], tone: 'bg-card' },
];

export function MorePanel({ onOpen, onLogout, pendingCount }: { onOpen: (t: MoreTool) => void; onLogout: () => void; pendingCount: number }) {
  const { label, urduFirst } = usePreferences();
  return (
    <section aria-label={label('More tools', 'مزید')} className="dk-rise">
      <h2 className={`text-xl font-black mb-3 ${urduFirst ? 'font-urdu leading-loose' : ''}`}>{label('More tools', 'مزید')}</h2>
      <div className="grid grid-cols-2 gap-2.5">
        {TOOLS.map(({ id, icon: Icon, en, ur, hint, tone }) => (
          <button key={id} onClick={() => onOpen(id)} className={`relative min-h-[96px] rounded-2xl border border-border p-3 text-start flex flex-col justify-between active:scale-[0.98] transition-transform motion-reduce:transition-none ${tone}`} data-testid={`btn-open-${id}`}>
            <Icon size={22} aria-hidden />
            <span><span className="block font-bold text-sm">{label(en, ur)}</span><span className="block text-[11px] opacity-75">{label(hint[0], hint[1])}</span></span>
            {id === 'reminders' && pendingCount > 0 && <span className="absolute top-2 end-2 min-w-6 h-6 px-1 rounded-full bg-red-600 text-white text-xs font-bold flex items-center justify-center">{pendingCount}</span>}
          </button>
        ))}
      </div>
      <button onClick={onLogout} className="mt-4 w-full min-h-[48px] rounded-xl border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 font-bold flex items-center justify-center gap-2" data-testid="btn-logout">
        <LogOut size={18} aria-hidden /> {label('Log out', 'لاگ آؤٹ')}
      </button>
      <p className="text-[11px] text-muted-foreground text-center mt-4 px-4">{label('All data stays on this phone. No cloud sync.', 'سارا ڈیٹا صرف اسی فون پر ہے، کوئی کلاؤڈ نہیں')}</p>
    </section>
  );
}
