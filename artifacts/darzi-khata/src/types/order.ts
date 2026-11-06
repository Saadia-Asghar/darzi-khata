export type OrderStatus = "pending" | "stitching" | "ready" | "delivered";

export type CollarType = "Normal Collar" | "Sherwani/Ban" | "Kurta Open" | "Round/Gol Gala";
export type DamanType = "Choras (Square)" | "Gol (Round)";
export type PocketType = "Front Pocket" | "1 Side Pocket" | "2 Side Pockets" | "Mobile Zip Pocket";
export type CuffType = "Simple" | "Button Cuff" | "Cut Cuff";

export interface Measurements {
  kameezLambai: number;
  teera: number;
  bazu: number;
  gala: number;
  chhaati: number;
  kamar: number;
  ghera: number;
  shalwarLambai: number;
  paincha: number;
  asan: number;
  shalwarGhera: number;
}

export interface OrderComment {
  id: string;
  authorId: string;
  authorName: string;
  role: 'owner' | 'karigar';
  text: string;
  createdAt: string;
}

export type PaymentMethod = 'cash' | 'zindigi' | 'raast' | 'bank';
export interface Payment {
  id: string;
  amount: number;
  method: PaymentMethod;
  date: string;
  demo?: boolean;
}

export interface Order {
  id: string;
  serialNumber?: string;
  customerName: string;
  phone: string;
  orderDate: string;
  deliveryDate: string;
  urgent: boolean;
  suitCount: number;
  fabric: string;
  measurements: Measurements;
  collarType: CollarType;
  damanType: DamanType;
  pockets: PocketType;
  cuffType: CuffType;
  specialNotes: string;
  totalAmount: number;
  advanceAmount: number;
  status: OrderStatus;
  karigar?: string;
  karigarId?: string;   // linked karigar account ID
  comments?: OrderComment[];
  createdAt: string;
  payments?: Payment[];
  deliveredAt?: string;
  readyAt?: string;
}
