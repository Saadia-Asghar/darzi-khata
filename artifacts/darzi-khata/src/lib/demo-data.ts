import type { Measurements, Order, OrderComment, Payment, PaymentMethod } from '../types/order';
const measurements: Measurements = {
  kameezLambai: 40, teera: 18, bazu: 24, gala: 15, chhaati: 22,
  kamar: 21, ghera: 23, shalwarLambai: 38, paincha: 7.5, asan: 16, shalwarGhera: 40,
};
const team = [
  { id: 'demo-bashir', name: 'Ustad Bashir' },
  { id: 'demo-ahmed', name: 'Ahmed Karigar' },
  { id: 'demo-rustam', name: 'Rustam Ustad' },
];
const names = ['Rizwan', 'Tariq', 'Hamza', 'Khalid', 'Imran', 'Asif', 'Naveed', 'Salman', 'Farooq', 'Zubair', 'Ali', 'Usman'];

// Deterministic six-calendar-month fixture; no real shop records are changed.
export function createFinancialDemo(now = new Date(), ownerId = 'demo-account'): Order[] {
  const result: Order[] = [];
  let serial = 0;
  const counts = [15, 19, 23, 27, 31, 35]; // exactly 150, growing business
  for (let monthIndex = 0; monthIndex < 6; monthIndex++) {
    const month = new Date(now.getFullYear(), now.getMonth() - 5 + monthIndex, 1, 10);
    const days = monthIndex === 5 ? now.getDate() : new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    for (let i = 0; i < counts[monthIndex]; i++) {
      serial++;
      const id = `finance-demo-${serial}`;
      const date = new Date(month.getFullYear(), month.getMonth(), 1 + Math.floor(i / counts[monthIndex] * Math.max(1, days - 1)), 9);
      const due = new Date(date); due.setDate(due.getDate() + 5);
      const worker = team[serial % team.length];
      const recent = monthIndex === 5 && i >= 24;
      const overdueDemo = monthIndex === 4 && i >= counts[monthIndex] - 2;
      if (overdueDemo) {
        due.setTime(now.getTime());
        due.setDate(due.getDate() - 2);
      }
      const status: Order['status'] = overdueDemo ? (i % 2 === 0 ? 'pending' : 'ready')
        : recent ? (i % 3 === 0 ? 'pending' : i % 3 === 1 ? 'stitching' : 'ready') : 'delivered';
      const totalAmount = 1500 + monthIndex * 250 + (serial % 4) * 500;
      const advance = recent || serial % 17 === 0 ? Math.round(totalAmount * 0.5) : totalAmount;
      const method: PaymentMethod = serial % 5 === 0 ? 'cash' : serial % 3 === 0 ? 'raast' : serial % 7 === 0 ? 'bank' : 'zindigi';
      const paidAt = new Date(date); paidAt.setDate(paidAt.getDate() + 1);
      if (paidAt > now) paidAt.setTime(now.getTime());
      const payments: Payment[] = [{ id: `${id}-p1`, amount: advance, method, date: paidAt.toISOString(), demo: true }];
      const delivered = new Date(due); delivered.setDate(delivered.getDate() + (serial % 11 === 0 ? 2 : -1));
      // Recent orders whose promised dates are still ahead have not been delivered.
      const actualStatus = status === 'delivered' && delivered > now ? 'stitching' : status;
      const readyDate = new Date(Math.max(date.getTime(), now.getTime() - 4 * 86400000));
      const comments: OrderComment[] = [
        { id: `${id}-c1`, authorId: ownerId, authorName: 'Shop Owner / مالک', role: 'owner', text: 'Please follow the measurements and delivery date / ناپ اور تاریخ کا خیال رکھیں', createdAt: date.toISOString() },
        { id: `${id}-c2`, authorId: worker.id, authorName: worker.name, role: 'karigar', text: actualStatus === 'delivered' ? 'Completed and checked / کام مکمل اور چیک ہو گیا' : 'Working on this order / اس آرڈر پر کام جاری ہے', createdAt: paidAt.toISOString() },
      ];
      result.push({
        id, serialNumber: `DK-${String(serial).padStart(3, '0')}`, customerName: `${names[serial % names.length]} ${['Ali', 'Shah', 'Ahmed'][serial % 3]}`,
        // Reserved synthetic phone values for demo only; do not send reminders automatically.
        phone: `0300${String(1000000 + serial % 48).padStart(7, '0')}`,
        orderDate: date.toISOString(), deliveryDate: due.toISOString(), urgent: recent && i % 2 === 0,
        suitCount: 1 + serial % 2, fabric: ['Cotton / کاٹن', 'Wash & Wear', 'Boski / بوسکی', 'Khaddar / کھدر'][serial % 4],
        measurements: { ...measurements }, collarType: 'Normal Collar', damanType: 'Choras (Square)',
        pockets: '2 Side Pockets', cuffType: 'Button Cuff', specialNotes: 'Synthetic demo order / نمائشی آرڈر',
        totalAmount, advanceAmount: advance, status: actualStatus,
        ...(serial % 19 ? { karigar: worker.name, karigarId: worker.id } : {}),
        payments, comments, createdAt: date.toISOString(),
        ...(actualStatus === 'delivered' ? { deliveredAt: delivered.toISOString() } : {}),
        ...(actualStatus === 'ready' ? { readyAt: readyDate.toISOString() } : {}),
      });
    }
  }
  return result;
}
