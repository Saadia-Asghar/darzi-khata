/**
 * Landing counters, loaded lazily after first paint. Derived from the same
 * deterministic six-month fixture the demo shop uses, so they are labelled
 * "Demo data" on the page until real pilot numbers exist.
 */
import { createFinancialDemo } from '../lib/demo-data';
import { computeCreditScore } from '../lib/credit-score';
import { paymentShare } from '../lib/payments';

export interface LandingStats { orders: number; handled: number; digitalPercent: number; score: number }

export function landingStats(now = new Date()): LandingStats {
  const orders = createFinancialDemo(now);
  const share = paymentShare(orders);
  const profile = computeCreditScore(orders, now);
  return {
    orders: orders.length,
    handled: share.total,
    digitalPercent: Math.round(share.digitalPercent * 10) / 10,
    score: profile.score,
  };
}
