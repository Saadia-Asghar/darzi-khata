import { createFinancialDemo } from './demo-data';
// A small, explicitly synthetic register makes the collection improvement
// visible in the same model used by the real credit page.
export function createPitchDemo(now = new Date(), ownerId = 'demo-account') {
  return createFinancialDemo(now, ownerId).filter((_, index) => index % 30 === 0).map(order => ({
    ...order, totalAmount: 1500, advanceAmount: 500, suitCount: 1, items: undefined,
    payments: [{ id: `pitch-advance-${order.id}`, amount: 500, method: 'cash' as const, date: order.orderDate, demo: true }],
  }));
}
