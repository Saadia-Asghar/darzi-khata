import { tl as bi } from './i18n';
import type { Order } from '../types/order';
import { paymentShare } from './payments';

export interface CreditFactor { key: string; label: string; weight: number; score: number; tip: string }
export interface CreditProfile {
  score: number; band: string; enoughData: boolean; monthsActive: number;
  factors: CreditFactor[]; monthly: { month: string; revenue: number; orders: number }[];
  averageMonthlyRevenue: number; eligibleLoan: number; onTimePercent: number;
  observedDeliveries: number; collectionPercent: number; digitalPercent: number;
  totalRevenue: number; collected: number; totalOrders: number; customers: number; karigars: number;
}
const clamp = (n: number) => Math.min(100, Math.max(0, Number.isFinite(n) ? n : 0));
const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

// An explainable, illustrative on-device score, NOT a lender or credit-bureau model.
export function computeCreditScore(orders: Order[], now = new Date()): CreditProfile {
  const valid = orders.filter(o => Number.isFinite(Date.parse(o.orderDate)) && Date.parse(o.orderDate) <= now.getTime());
  const earliest = valid.length ? new Date(Math.min(...valid.map(o => Date.parse(o.orderDate)))) : now;
  const monthsActive = valid.length ? Math.max(1, (now.getFullYear() - earliest.getFullYear()) * 12 + now.getMonth() - earliest.getMonth() + 1) : 0;
  const count = Math.min(6, Math.max(1, monthsActive));
  const monthly = Array.from({ length: count }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - count + 1 + i, 1);
    const month = monthKey(d);
    const group = valid.filter(o => monthKey(new Date(o.orderDate)) === month);
    return { month, revenue: group.reduce((sum, o) => sum + o.totalAmount, 0), orders: group.length };
  });
  const averageMonthlyRevenue = monthly.reduce((sum, m) => sum + m.revenue, 0) / count;
  const meanVolume = valid.length ? monthly.reduce((sum, m) => sum + m.orders, 0) / count : 0;
  const variance = monthly.reduce((sum, m) => sum + (m.orders - meanVolume) ** 2, 0) / count;
  const consistency = meanVolume ? clamp(100 * (1 - Math.sqrt(variance) / meanVolume)) : 0;
  const first = monthly[0]?.revenue || 0;
  const last = monthly.at(-1)?.revenue || 0;
  const growth = monthly.length > 1 && first > 0 ? clamp(50 + (last - first) / first * 50) : 0;
  const observed = valid.filter(o => o.status === 'delivered' && o.deliveredAt && Number.isFinite(Date.parse(o.deliveredAt)));
  const onTime = observed.filter(o => o.deliveredAt!.slice(0, 10) <= o.deliveryDate.slice(0, 10)).length;
  const onTimePercent = observed.length ? onTime / observed.length * 100 : 0;
  const totalRevenue = valid.reduce((sum, o) => sum + o.totalAmount, 0);
  const collected = valid.reduce((sum, o) => sum + Math.min(o.totalAmount, o.advanceAmount), 0);
  const collectionPercent = totalRevenue ? collected / totalRevenue * 100 : 0;
  const digitalPercent = paymentShare(valid).digitalPercent;
  const factors: CreditFactor[] = [
    { key: 'age', label: bi('m_business_age'), weight: 15, score: clamp(monthsActive / 12 * 100), tip: bi('m_record_regularly') },
    { key: 'volume', label: bi('m_volume_consistency'), weight: 20, score: clamp(meanVolume / 30 * 60 + consistency * 0.4), tip: bi('m_keep_a_steady_order_book') },
    { key: 'growth', label: bi('m_revenue_trend'), weight: 20, score: growth, tip: bi('m_grow_monthly_sales') },
    { key: 'delivery', label: bi('m_on_time_delivery'), weight: 20, score: onTimePercent, tip: bi('m_mark_delivery_on_the_actual_day') },
    { key: 'collection', label: bi('m_collection_rate'), weight: 15, score: collectionPercent, tip: bi('m_collect_outstanding_balances') },
    { key: 'digital', label: bi('m_digital_payments'), weight: 10, score: digitalPercent, tip: bi('m_record_wallet_and_bank_payments') },
  ];
  const enoughData = valid.length >= 5 && monthsActive >= 2;
  const score = Math.round(factors.reduce((sum, f) => sum + f.score * f.weight / 100, 0));
  return {
    score, band: score < 40 ? bi('m_starter') : score < 70 ? bi('m_growing') : bi('m_trusted'),
    enoughData, monthsActive, factors, monthly, averageMonthlyRevenue,
    eligibleLoan: enoughData ? Math.min(300000, Math.round(1.5 * averageMonthlyRevenue * score / 100)) : 0,
    onTimePercent, observedDeliveries: observed.length, collectionPercent, digitalPercent,
    totalRevenue, collected, totalOrders: valid.length,
    customers: new Set(valid.map(o => o.phone.replace(/\D/g, '') || o.customerName)).size,
    karigars: new Set(valid.map(o => o.karigarId || o.karigar).filter(Boolean)).size,
  };
}
