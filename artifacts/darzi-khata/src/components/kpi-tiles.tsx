import { useMemo } from 'react';
import type { Order } from '../types/order';
import { usePreferences } from '../hooks/use-preferences';
import { useSettings } from '../hooks/use-settings';
import { balance, paymentShare } from '../lib/payments';
import { profitSummary } from '../lib/shop-tools';
import { computeCreditScore } from '../lib/credit-score';
import { money } from '../lib/i18n';
import type { DictKey } from '../lib/i18n';

type Tile = { k: DictKey; v: string; tone?: 'danger' | 'primary' };
export type KpiKind = 'hisaab' | 'credit' | 'payments';

/** Four number tiles computed from the shop's real records. Never sample numbers. */
export function KpiTiles({ orders, kind }: { orders: Order[]; kind: KpiKind }) {
  const { label } = usePreferences();
  const { settings } = useSettings();
  const tiles = useMemo<Tile[]>(() => {
    if (kind === 'hisaab') {
      const p = profitSummary(orders, settings.expenses || []);
      const due = orders.filter((o) => o.status !== 'delivered' || balance(o) > 0).reduce((s, o) => s + balance(o), 0);
      return [
        { k: 'feature_income', v: money(p.income), tone: 'primary' },
        { k: 'feature_spending', v: money(p.spending) },
        { k: 'feature_profit', v: money(p.profit) },
        { k: 'dk_to_collect', v: money(due), tone: due > 0 ? 'danger' : undefined },
      ];
    }
    const c = computeCreditScore(orders, new Date(), settings.expenses || []);
    if (kind === 'credit') {
      return [
        { k: 'dk_kpi_score', v: `${c.score}/100`, tone: 'primary' },
        { k: 'dk_kpi_on_time', v: c.observedDeliveries ? `${c.onTimePercent.toFixed(1)}%` : '-' },
        { k: 'dk_kpi_collection', v: c.totalRevenue ? `${c.collectionPercent.toFixed(1)}%` : '-' },
        { k: 'dk_kpi_months', v: String(c.monthsActive) },
      ];
    }
    const s = paymentShare(orders);
    return [
      { k: 'dk_kpi_collected', v: money(c.collected), tone: 'primary' },
      { k: 'dk_kpi_digital', v: s.total ? `${s.digitalPercent.toFixed(1)}%` : '-' },
      { k: 'dk_kpi_orders', v: String(c.totalOrders) },
      { k: 'dk_kpi_revenue', v: money(c.totalRevenue) },
    ];
  }, [orders, kind, settings.expenses]);
  return (
    <div className="dk-span-all grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-3" data-testid={`kpi-${kind}`}>
      {tiles.map((t, i) => (
        <div key={t.k} className="rounded-lg border border-border bg-card p-3 lg:p-4 min-w-0" data-testid={`kpi-${kind}-${i}`}>
          <p className="text-xs text-muted-foreground truncate">{label(t.k)}</p>
          <p dir="ltr" className={`num text-lg font-semibold truncate ${t.tone === 'danger' ? 'text-danger' : t.tone === 'primary' ? 'text-primary' : 'text-foreground'}`}>{t.v}</p>
        </div>
      ))}
    </div>
  );
}
