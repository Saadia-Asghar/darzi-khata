import { useState, useEffect, useCallback } from 'react';
import { Order, OrderStatus } from '../types/order';

const STORAGE_KEY = 'darzi-khata-orders';
const SERIAL_KEY = 'darzi-khata-serial-counter';

const getDate = (offsetDays: number) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString();
};

const M = {
  kameezLambai: 40, teera: 18, bazu: 24, gala: 15,
  chhaati: 22, kamar: 21, ghera: 23, shalwarLambai: 38,
  paincha: 7.5, asan: 16, shalwarGhera: 40,
};

const DEMO_ORDERS: Order[] = [
  {
    id: 'demo-1', serialNumber: 'DK-001',
    customerName: 'Muhammad Rizwan', phone: '03001111111',
    orderDate: getDate(-7), deliveryDate: getDate(0),
    urgent: true, suitCount: 2, fabric: 'White Cotton',
    measurements: { ...M },
    collarType: 'Normal Collar', damanType: 'Choras (Square)',
    pockets: '2 Side Pockets', cuffType: 'Button Cuff',
    specialNotes: 'Double silai, matching button',
    totalAmount: 2500, advanceAmount: 1500,
    status: 'stitching', karigar: 'Ustad Bashir',
    createdAt: getDate(-7),
  },
  {
    id: 'demo-2', serialNumber: 'DK-002',
    customerName: 'Tariq Mehmood', phone: '03002222222',
    orderDate: getDate(-5), deliveryDate: getDate(0),
    urgent: false, suitCount: 1, fabric: 'Boski Kurta Shalwar',
    measurements: { ...M, kameezLambai: 42, chhaati: 24 },
    collarType: 'Sherwani/Ban', damanType: 'Gol (Round)',
    pockets: 'Front Pocket', cuffType: 'Cut Cuff',
    specialNotes: '',
    totalAmount: 1500, advanceAmount: 1000,
    status: 'ready', karigar: 'Ahmed Karigar',
    createdAt: getDate(-5),
  },
  {
    id: 'demo-3', serialNumber: 'DK-003',
    customerName: 'Hamza Ali', phone: '03003333333',
    orderDate: getDate(-3), deliveryDate: getDate(3),
    urgent: false, suitCount: 1, fabric: 'Wash & Wear Dark Blue',
    measurements: { ...M, teera: 17, bazu: 23 },
    collarType: 'Kurta Open', damanType: 'Choras (Square)',
    pockets: '1 Side Pocket', cuffType: 'Simple',
    specialNotes: '',
    totalAmount: 1200, advanceAmount: 1200,
    status: 'stitching', karigar: undefined,
    createdAt: getDate(-3),
  },
  {
    id: 'demo-4', serialNumber: 'DK-004',
    customerName: 'Khalid Hussain', phone: '03004444444',
    orderDate: getDate(-10), deliveryDate: getDate(-3),
    urgent: false, suitCount: 3, fabric: 'Latha Safaid',
    measurements: { ...M, kameezLambai: 38, chhaati: 20, kamar: 19 },
    collarType: 'Normal Collar', damanType: 'Choras (Square)',
    pockets: '2 Side Pockets', cuffType: 'Simple',
    specialNotes: 'Teen joray — ek khanda gala chahiye',
    totalAmount: 3600, advanceAmount: 2000,
    status: 'pending', karigar: 'Rustam Ustad',
    createdAt: getDate(-10),
  },
  {
    id: 'demo-5', serialNumber: 'DK-005',
    customerName: 'Imran Butt', phone: '03005555555',
    orderDate: getDate(-2), deliveryDate: getDate(5),
    urgent: true, suitCount: 1, fabric: 'Karandi Brown',
    measurements: { ...M, kameezLambai: 41, teera: 19, chhaati: 23 },
    collarType: 'Round/Gol Gala', damanType: 'Gol (Round)',
    pockets: 'Mobile Zip Pocket', cuffType: 'Button Cuff',
    specialNotes: 'Ustad ne pehlay kiya hua — size wahi rakhna',
    totalAmount: 1800, advanceAmount: 500,
    status: 'pending', karigar: 'Ustad Bashir',
    createdAt: getDate(-2),
  },
  {
    id: 'demo-6', serialNumber: 'DK-006',
    customerName: 'Asif Raza', phone: '03006666666',
    orderDate: getDate(-15), deliveryDate: getDate(-8),
    urgent: false, suitCount: 2, fabric: 'Chaap Kapra Cream',
    measurements: { ...M, shalwarLambai: 40, paincha: 8 },
    collarType: 'Normal Collar', damanType: 'Choras (Square)',
    pockets: '2 Side Pockets', cuffType: 'Simple',
    specialNotes: '',
    totalAmount: 2000, advanceAmount: 2000,
    status: 'delivered', karigar: 'Ahmed Karigar',
    createdAt: getDate(-15),
  },
  {
    id: 'demo-7', serialNumber: 'DK-007',
    customerName: 'Naveed Ahmad', phone: '03007777777',
    orderDate: getDate(-4), deliveryDate: getDate(7),
    urgent: false, suitCount: 1, fabric: 'Khaddar Sindhi',
    measurements: { ...M, kameezLambai: 44, chhaati: 25, kamar: 23, ghera: 25 },
    collarType: 'Kurta Open', damanType: 'Gol (Round)',
    pockets: '1 Side Pocket', cuffType: 'Simple',
    specialNotes: 'Bohat ghera rakha jaye',
    totalAmount: 900, advanceAmount: 0,
    status: 'pending', karigar: undefined,
    createdAt: getDate(-4),
  },
  {
    id: 'demo-8', serialNumber: 'DK-008',
    customerName: 'Salman Chaudhry', phone: '03008888888',
    orderDate: getDate(-1), deliveryDate: getDate(1),
    urgent: true, suitCount: 2, fabric: 'Blended Shalwar Kameez',
    measurements: { ...M },
    collarType: 'Normal Collar', damanType: 'Choras (Square)',
    pockets: '2 Side Pockets', cuffType: 'Cut Cuff',
    specialNotes: 'Eid ke liye — zaroor time par tayar karna',
    totalAmount: 3000, advanceAmount: 2500,
    status: 'stitching', karigar: 'Rustam Ustad',
    createdAt: getDate(-1),
  },
  {
    id: 'demo-9', serialNumber: 'DK-009',
    customerName: 'Farooq Shah', phone: '03009999999',
    orderDate: getDate(-20), deliveryDate: getDate(-14),
    urgent: false, suitCount: 1, fabric: 'Silk Sherwani',
    measurements: { ...M, kameezLambai: 52, teera: 20, chhaati: 26 },
    collarType: 'Sherwani/Ban', damanType: 'Gol (Round)',
    pockets: 'Front Pocket', cuffType: 'Button Cuff',
    specialNotes: 'Buttons sirf ek taraf',
    totalAmount: 5000, advanceAmount: 5000,
    status: 'delivered', karigar: 'Ustad Bashir',
    createdAt: getDate(-20),
  },
  {
    id: 'demo-10', serialNumber: 'DK-010',
    customerName: 'Zubair Malik', phone: '03010101010',
    orderDate: getDate(0), deliveryDate: getDate(10),
    urgent: false, suitCount: 4, fabric: 'Kali Chaap Mixed',
    measurements: { ...M },
    collarType: 'Normal Collar', damanType: 'Choras (Square)',
    pockets: '2 Side Pockets', cuffType: 'Simple',
    specialNotes: 'Char bhai — ek size',
    totalAmount: 4800, advanceAmount: 2400,
    status: 'pending', karigar: 'Ahmed Karigar',
    createdAt: getDate(0),
  },
];

function getNextSerial(): string {
  const current = parseInt(localStorage.getItem(SERIAL_KEY) || '10', 10);
  const next = current + 1;
  localStorage.setItem(SERIAL_KEY, String(next));
  return `DK-${String(next).padStart(3, '0')}`;
}

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEMO_ORDERS));
      localStorage.setItem(SERIAL_KEY, '10');
      setOrders(DEMO_ORDERS);
    } else {
      try {
        setOrders(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse orders', e);
        setOrders([]);
      }
    }
    setIsLoaded(true);
  }, []);

  const saveOrders = useCallback((newOrders: Order[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newOrders));
    setOrders(newOrders);
  }, []);

  const addOrder = useCallback((order: Omit<Order, 'id' | 'createdAt' | 'serialNumber'>) => {
    const newOrder: Order = {
      ...order,
      id: crypto.randomUUID(),
      serialNumber: getNextSerial(),
      createdAt: new Date().toISOString(),
    };
    setOrders((prev) => {
      const updated = [newOrder, ...prev];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
    return newOrder;
  }, []);

  const updateOrder = useCallback((id: string, updates: Partial<Order>) => {
    setOrders((prev) => {
      const updated = prev.map((o) => (o.id === id ? { ...o, ...updates } : o));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const deleteOrder = useCallback((id: string) => {
    setOrders((prev) => {
      const updated = prev.filter((o) => o.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const updateOrderStatus = useCallback((id: string, status: OrderStatus) => {
    updateOrder(id, { status });
  }, [updateOrder]);

  return {
    orders,
    isLoaded,
    addOrder,
    updateOrder,
    deleteOrder,
    updateOrderStatus,
    setAllOrders: saveOrders,
  };
}
