import { Check, ChevronDown } from 'lucide-react';
import type { Order, OrderStatus } from '../types/order';
import { usePreferences } from '../hooks/use-preferences';
import { STATUS_META, STATUS_ORDER, visualStatus } from './status-meta';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

/** Tappable status chip that opens a proper menu: icon + colour + bilingual label per state. */
export function StatusMenu({ order, onChange, compact = false }: { order: Order; onChange: (id: string, s: OrderStatus) => void; compact?: boolean }) {
  const { label } = usePreferences();
  const shown = visualStatus(order);
  const m = STATUS_META[shown];
  const Icon = m.icon;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className={`inline-flex items-center rounded-md border font-medium whitespace-nowrap ${compact ? 'gap-1 min-h-[28px] h-7 px-2 text-xs' : 'gap-1.5 min-h-[44px] px-3 text-sm'} ${m.cls}`}
          aria-label={`${label('change_status')}: ${label(m.key)}`} data-testid={`status-${order.id}`}>
          <Icon size={compact ? 14 : 16} aria-hidden />
          <span>{label(m.key)}</span>
          <ChevronDown size={compact ? 14 : 16} aria-hidden />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[240px] rounded-lg p-1">
        <DropdownMenuLabel className="text-sm font-medium text-muted-foreground">{label('change_status')}</DropdownMenuLabel>
        {STATUS_ORDER.map((s) => {
          const sm = STATUS_META[s];
          const SIcon = sm.icon;
          const active = order.status === s;
          return (
            <DropdownMenuItem key={s} onSelect={() => { if (!active) onChange(order.id, s); }} className="min-h-[48px] gap-3 text-base" data-testid={`status-option-${s}`}>
              <span className={`inline-flex h-8 w-8 items-center justify-center rounded-md border ${sm.cls}`}><SIcon size={16} aria-hidden /></span>
              <span className="flex-1">{label(sm.key)}</span>
              {active && <Check size={18} aria-hidden className="text-primary" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
