import { bi } from '../lib/i18n';
import { useMemo, useEffect, useCallback } from 'react';
import { Order, OrderStatus, OrderComment, PaymentMethod, Customer } from '../types/order';
import { useAuthContext } from '../context/auth-context';
import { useDemoMode, scopedOrdersKey } from './use-demo-mode';
import { createFinancialDemo } from '../lib/demo-data';
import { claimLegacyShop, useStoredValue, writeStorage, writeStorageBatch } from '../lib/local-store';
import { appendPayment, migrateOrder } from '../lib/payments';
import { storage as localStorage, readJSON, noteSchema } from '../lib/storage';
import { migrateRegister, highestSerial } from '../lib/migrations';
import { validateOrders } from '../lib/order-validation';

const ago = (days: number, hours = 0) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(d.getHours() - hours);
  return d.toISOString();
};
const future = (days: number) => {
  const d = new Date(); d.setDate(d.getDate() + days); return d.toISOString();
};

const M = { kameezLambai: 40, teera: 18, bazu: 24, gala: 15, chhaati: 22, kamar: 21, ghera: 23, shalwarLambai: 38, paincha: 7.5, asan: 16, shalwarGhera: 40 };

// Owner = 'demo-account', Karigars match their account IDs
const ownerComment = (text: string, hoursAgo: number): OrderComment => ({
  id: crypto.randomUUID(), authorId: 'demo-account', authorName: 'Arif Malik', role: 'owner', text, createdAt: ago(0, hoursAgo),
});
const bashirComment = (text: string, hoursAgo: number): OrderComment => ({
  id: crypto.randomUUID(), authorId: 'demo-bashir', authorName: 'Ustad Bashir', role: 'karigar', text, createdAt: ago(0, hoursAgo),
});
const ahmedComment = (text: string, hoursAgo: number): OrderComment => ({
  id: crypto.randomUUID(), authorId: 'demo-ahmed', authorName: 'Ahmed Karigar', role: 'karigar', text, createdAt: ago(0, hoursAgo),
});
const rustamComment = (text: string, hoursAgo: number): OrderComment => ({
  id: crypto.randomUUID(), authorId: 'demo-rustam', authorName: 'Rustam Ustad', role: 'karigar', text, createdAt: ago(0, hoursAgo),
});

const DEMO_ORDERS: Order[] = [
  {
    id: 'demo-1', serialNumber: 'DK-001', customerName: 'Muhammad Rizwan', phone: '03001111111',
    orderDate: ago(7), deliveryDate: future(0), urgent: true, suitCount: 2, fabric: 'White Cotton',
    measurements: { ...M }, collarType: 'Normal Collar', damanType: 'Choras (Square)', pockets: '2 Side Pockets', cuffType: 'Button Cuff',
    specialNotes: 'Double stitching and matching buttons', totalAmount: 2500, advanceAmount: 1500, status: 'stitching',
    karigar: 'Ustad Bashir', karigarId: 'demo-bashir',
    comments: [
      ownerComment('Bashir, this is urgent. The customer arrives tomorrow evening. Please finish both suits tonight.', 5),
      bashirComment('One suit is complete. I am adding matching buttons to the second.', 4),
      ownerComment('Please finish promptly. The customer has already paid an advance.', 3),
      bashirComment('Both suits will have double stitching and be ready tomorrow morning.', 2),
      ownerComment('Thank you. Good work.', 1),
    ],
    createdAt: ago(7),
  },
  {
    id: 'demo-2', serialNumber: 'DK-002', customerName: 'Tariq Mehmood', phone: '03002222222',
    orderDate: ago(5), deliveryDate: ago(1), urgent: false, suitCount: 1, fabric: 'Boski Kurta Shalwar',
    measurements: { ...M, kameezLambai: 42, chhaati: 24 }, collarType: 'Sherwani/Ban', damanType: 'Gol (Round)', pockets: 'Front Pocket', cuffType: 'Cut Cuff',
    specialNotes: '', totalAmount: 1500, advanceAmount: 1000, status: 'ready',
    karigar: 'Ahmed Karigar', karigarId: 'demo-ahmed',
    comments: [
      ownerComment('Ahmed, this Boski suit needs a straight Sherwani collar.', 28),
      ahmedComment('Understood. I will finish the cut cuffs carefully too.', 26),
      ahmedComment('The suit is complete and the collar is ready for inspection.', 6),
      ownerComment('Good work. Give the customer the receipt at collection.', 5),
    ],
    createdAt: ago(5),
  },
  {
    id: 'demo-3', serialNumber: 'DK-003', customerName: 'Hamza Ali', phone: '03003333333',
    orderDate: ago(3), deliveryDate: future(3), urgent: false, suitCount: 1, fabric: 'Wash & Wear Dark Blue',
    measurements: { ...M, teera: 17, bazu: 23 }, collarType: 'Kurta Open', damanType: 'Choras (Square)', pockets: '1 Side Pocket', cuffType: 'Simple',
    specialNotes: '', totalAmount: 1200, advanceAmount: 1200, status: 'stitching',
    comments: [
      ownerComment('This order is not assigned. Please let me know when a worker is available.', 20),
    ],
    createdAt: ago(3),
  },
  {
    id: 'demo-4', serialNumber: 'DK-004', customerName: 'Khalid Hussain', phone: '03004444444',
    orderDate: ago(10), deliveryDate: future(1), urgent: false, suitCount: 3, fabric: 'White Latha',
    measurements: { ...M, kameezLambai: 38, chhaati: 20, kamar: 19 }, collarType: 'Normal Collar', damanType: 'Choras (Square)', pockets: '2 Side Pockets', cuffType: 'Simple',
    specialNotes: 'Three suits; one needs a special neckline', totalAmount: 3600, advanceAmount: 2000, status: 'pending',
    karigar: 'Rustam Ustad', karigarId: 'demo-rustam',
    comments: [
      ownerComment('Rustam, there are three suits. One needs a special neckline and two normal collars. Please confirm.', 48),
      rustamComment('Confirmed. I will make the special neckline first, then the normal collars.', 46),
      ownerComment('Delivery is tomorrow. Please collect the remaining advance.', 24),
      rustamComment('Two suits are complete; the third will be ready tomorrow morning.', 12),
    ],
    createdAt: ago(10),
  },
  {
    id: 'demo-5', serialNumber: 'DK-005', customerName: 'Imran Butt', phone: '03005555555',
    orderDate: ago(2), deliveryDate: future(5), urgent: true, suitCount: 1, fabric: 'Karandi Brown',
    measurements: { ...M, kameezLambai: 41, teera: 19, chhaati: 23 }, collarType: 'Round/Gol Gala', damanType: 'Gol (Round)', pockets: 'Mobile Zip Pocket', cuffType: 'Button Cuff',
    specialNotes: 'Reuse the previous measurements in the worker record', totalAmount: 1800, advanceAmount: 500, status: 'pending',
    karigar: 'Ustad Bashir', karigarId: 'demo-bashir',
    comments: [
      ownerComment('Bashir, use Imran’s previous measurements, round hem and zipped phone pocket.', 36),
      bashirComment('I found the record. I will use the same measurements and zipped phone pocket.', 34),
    ],
    createdAt: ago(2),
  },
  {
    id: 'demo-6', serialNumber: 'DK-006', customerName: 'Asif Raza', phone: '03006666666',
    orderDate: ago(15), deliveryDate: ago(8), urgent: false, suitCount: 2, fabric: 'Cream printed fabric',
    measurements: { ...M, shalwarLambai: 40, paincha: 8 }, collarType: 'Normal Collar', damanType: 'Choras (Square)', pockets: '2 Side Pockets', cuffType: 'Simple',
    specialNotes: '', totalAmount: 2000, advanceAmount: 2000, status: 'delivered',
    karigar: 'Ahmed Karigar', karigarId: 'demo-ahmed',
    comments: [
      ownerComment('Ahmed, are both suits complete? The customer arrives tomorrow.', 200),
      ahmedComment('Both suits are pressed and ready for delivery.', 198),
      ownerComment('The customer collected them and was happy. Thank you.', 190),
    ],
    createdAt: ago(15),
  },
  {
    id: 'demo-7', serialNumber: 'DK-007', customerName: 'Naveed Ahmad', phone: '03007777777',
    orderDate: ago(4), deliveryDate: future(7), urgent: false, suitCount: 1, fabric: 'Khaddar Sindhi',
    measurements: { ...M, kameezLambai: 44, chhaati: 25, kamar: 23, ghera: 25 }, collarType: 'Kurta Open', damanType: 'Gol (Round)', pockets: '1 Side Pocket', cuffType: 'Simple',
    specialNotes: 'The customer requests a wide hem', totalAmount: 900, advanceAmount: 0, status: 'pending',
    comments: [],
    createdAt: ago(4),
  },
  {
    id: 'demo-8', serialNumber: 'DK-008', customerName: 'Salman Chaudhry', phone: '03008888888',
    orderDate: ago(1), deliveryDate: future(1), urgent: true, suitCount: 2, fabric: 'Blended Shalwar Kameez',
    measurements: { ...M }, collarType: 'Normal Collar', damanType: 'Choras (Square)', pockets: '2 Side Pockets', cuffType: 'Cut Cuff',
    specialNotes: 'Eid order; delivery must be on time', totalAmount: 3000, advanceAmount: 2500, status: 'stitching',
    karigar: 'Rustam Ustad', karigarId: 'demo-rustam',
    comments: [
      ownerComment('Rustam, both Eid suits are needed by 10 tomorrow morning.', 20),
      rustamComment('One suit is ready. I will finish the second tonight.', 18),
      ownerComment('The customer paid an extra 500 for the additional work.', 10),
      rustamComment('Thank you. I will bring both suits by 8 tomorrow morning.', 8),
    ],
    createdAt: ago(1),
  },
  {
    id: 'demo-9', serialNumber: 'DK-009', customerName: 'Farooq Shah', phone: '03009999999',
    orderDate: ago(20), deliveryDate: ago(14), urgent: false, suitCount: 1, fabric: 'Silk Sherwani',
    measurements: { ...M, kameezLambai: 52, teera: 20, chhaati: 26 }, collarType: 'Sherwani/Ban', damanType: 'Gol (Round)', pockets: 'Front Pocket', cuffType: 'Button Cuff',
    specialNotes: 'Gold buttons on one side only', totalAmount: 5000, advanceAmount: 5000, status: 'delivered',
    karigar: 'Ustad Bashir', karigarId: 'demo-bashir',
    comments: [
      ownerComment('Bashir, this silk Sherwani needs gold buttons on one side. Please finish carefully.', 340),
      bashirComment('I have the gold buttons. It will be ready in three days.', 336),
      bashirComment('The Sherwani is ready for quality inspection.', 300),
      ownerComment('Excellent work. The customer was very happy.', 290),
    ],
    createdAt: ago(20),
  },
  {
    id: 'demo-10', serialNumber: 'DK-010', customerName: 'Zubair Malik', phone: '03010101010',
    orderDate: future(0), deliveryDate: future(10), urgent: false, suitCount: 4, fabric: 'Mixed black printed fabric',
    measurements: { ...M }, collarType: 'Normal Collar', damanType: 'Choras (Square)', pockets: '2 Side Pockets', cuffType: 'Simple',
    specialNotes: 'Four brothers with the same measurements. Number the suits 1–4.', totalAmount: 4800, advanceAmount: 2400, status: 'pending',
    karigar: 'Ahmed Karigar', karigarId: 'demo-ahmed',
    comments: [
      ownerComment('Ahmed, number the four identical-size suits 1–4 to avoid mistakes. Delivery is in ten days.', 2),
      ahmedComment('I will number them and finish one per day.', 1),
    ],
    createdAt: ago(0),
  },
];

export function useOrders() {
  const { dataOwnerId } = useAuthContext();
  const { demoMode } = useDemoMode();
  const STORAGE_KEY = scopedOrdersKey(dataOwnerId, demoMode);
  const SERIAL_KEY = `darzi-khata-serial-${demoMode ? 'financial-demo-' : ''}${dataOwnerId}`;
  const scope = `${demoMode ? 'financial-demo-' : ''}${dataOwnerId}`;
  const CUSTOMER_KEY = `darzi-khata-customers-${scope}`;
  const fallback = useMemo(() => [], []) as Order[];
  const customerFallback = useMemo<Customer[]>(() => [], []);
  const savedOrders = useStoredValue<Order[]>(STORAGE_KEY, fallback);
  const savedCustomers = useStoredValue<Customer[]>(CUSTOMER_KEY, customerFallback);
  const migrated = useMemo(() => migrateRegister(savedOrders, savedCustomers), [savedOrders,savedCustomers]);
  const orders = migrated.orders;

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY) === null) return;
    noteSchema(scope);
    if (JSON.stringify(savedOrders) !== JSON.stringify(migrated.orders)) writeStorage(STORAGE_KEY,migrated.orders);
    if (JSON.stringify(savedCustomers) !== JSON.stringify(migrated.customers)) writeStorage(CUSTOMER_KEY,migrated.customers);
  }, [STORAGE_KEY,CUSTOMER_KEY,scope,savedOrders,savedCustomers,migrated]);

  useEffect(() => {
    if (!demoMode) claimLegacyShop(dataOwnerId);
    if (localStorage.getItem(STORAGE_KEY) !== null) return;
    if (demoMode) {
      writeStorage(STORAGE_KEY, createFinancialDemo(new Date(), dataOwnerId));
      return;
    }
    // Preserve the pre-account khata and original key. Claim legacy data only once,
    // never into a public demo account. A backup/import can also migrate explicitly.
    const legacy = localStorage.getItem('darzi-khata-orders');
    const claimed = localStorage.getItem('darzi-khata-legacy-claimed');
    if (legacy && !claimed && dataOwnerId !== 'demo-account') {
      const parsed = JSON.parse(legacy);
      if (!Array.isArray(parsed)) throw new Error(bi('err_legacy_invalid'));
      writeStorage(STORAGE_KEY, parsed.map(migrateOrder));
      writeStorage('darzi-khata-legacy-claimed', dataOwnerId);
    } else {
      writeStorage(STORAGE_KEY, dataOwnerId === 'demo-account' ? DEMO_ORDERS.map(migrateOrder) : []);
    }
  }, [STORAGE_KEY, dataOwnerId, demoMode]);

  const readOrders = useCallback((): Order[] =>
    migrateRegister(readJSON<Order[]>(STORAGE_KEY, []),readJSON<Customer[]>(CUSTOMER_KEY,[])).orders, [STORAGE_KEY,CUSTOMER_KEY]);

  const saveOrders = useCallback((newOrders: Order[]) => {
    validateOrders(newOrders);
    noteSchema(scope);
    const next = migrateRegister(newOrders,readJSON<Customer[]>(CUSTOMER_KEY,[]));
    writeStorageBatch([
      [CUSTOMER_KEY,next.customers],[STORAGE_KEY,next.orders],
      [SERIAL_KEY,Math.max(highestSerial(next.orders),readJSON<number>(SERIAL_KEY,0))],
    ]);
  }, [STORAGE_KEY,CUSTOMER_KEY,SERIAL_KEY,scope]);

  const getNextSerial = useCallback((): string => {
    const maxSerial = Math.max(0, ...readOrders().map(o => Number(o.serialNumber?.replace(/^DK-/, '')) || 0));
    const current = Math.max(maxSerial, parseInt(localStorage.getItem(SERIAL_KEY) || '0', 10) || 0);
    const next = current + 1;
    writeStorage(SERIAL_KEY, next);
    return `DK-${String(next).padStart(3, '0')}`;
  }, [SERIAL_KEY, readOrders]);

  const addOrder = useCallback((order: Omit<Order, 'id' | 'createdAt' | 'serialNumber'>) => {
    const newOrder = migrateOrder({ ...order, id: crypto.randomUUID(), serialNumber: getNextSerial(), createdAt: new Date().toISOString() });
    saveOrders([newOrder, ...readOrders()]);
    return newOrder;
  }, [getNextSerial, saveOrders, readOrders]);

  const updateOrder = useCallback((id: string, updates: Partial<Order>) => {
    saveOrders(readOrders().map(o => {
      if (o.id !== id) return o;
      if (updates.advanceAmount !== undefined && updates.advanceAmount < o.advanceAmount)
        throw new Error(bi('m_recorded_payments_cannot_be_reduced'));
      let updated = { ...o, ...updates };
      if (updates.advanceAmount !== undefined && updates.advanceAmount > o.advanceAmount) {
        updated = { ...updated, payments: appendPayment(o, updates.advanceAmount - o.advanceAmount, 'cash', new Date().toISOString()).payments };
      }
      if (updates.status && updates.status !== o.status) {
        if (updates.status === 'ready') updated.readyAt = new Date().toISOString();
        if (updates.status === 'delivered') updated.deliveredAt = new Date().toISOString();
        else if (o.status === 'delivered') updated.deliveredAt = undefined;
      }
      return updated;
    }));
  }, [saveOrders, readOrders]);

  const recordPayment = useCallback((id: string, amount: number, method: PaymentMethod, date: string, demo = false) => {
    if (demo && !demoMode) throw new Error(bi('err_sim_demo_only'));
    saveOrders(readOrders().map(o => o.id === id ? appendPayment(o, amount, method, date, demo) : o));
  }, [readOrders, saveOrders, demoMode]);

  const deleteOrder = useCallback((id: string) => {
    saveOrders(readOrders().filter(o => o.id !== id));
  }, [saveOrders, readOrders]);
  const restoreOrder = useCallback((order: Order) => {
    const current = readOrders();
    if (!current.some(o => o.id === order.id)) saveOrders([order,...current]);
  }, [saveOrders,readOrders]);

  const updateOrderStatus = useCallback((id: string, status: OrderStatus) => { updateOrder(id, { status }); }, [updateOrder]);

  const addComment = useCallback((orderId: string, comment: Omit<OrderComment, 'id' | 'createdAt'>) => {
    const newComment: OrderComment = { ...comment, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    saveOrders(readOrders().map(o => o.id === orderId ? { ...o, comments: [...(o.comments ?? []), newComment] } : o));
  }, [saveOrders, readOrders]);

  return { orders, isLoaded: localStorage.getItem(STORAGE_KEY) !== null, addOrder, updateOrder, deleteOrder, restoreOrder, updateOrderStatus, setAllOrders: saveOrders, addComment, recordPayment };
}
