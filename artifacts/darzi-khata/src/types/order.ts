export type OrderStatus = "pending" | "stitching" | "ready" | "delivered";

export type CollarType = "Normal Collar" | "Sherwani/Ban" | "Kurta Open" | "Round/Gol Gala";
export type DamanType = "Choras (Square)" | "Gol (Round)";
export type PocketType = "Front Pocket" | "1 Side Pocket" | "2 Side Pockets" | "Mobile Zip Pocket";
export type CuffType = "Simple" | "Button Cuff" | "Cut Cuff";

export interface Measurements {
  // Kameez/Kurta
  kameezLambai: number;  // Length
  teera: number;         // Shoulder
  bazu: number;          // Sleeves
  gala: number;          // Neck/Collar
  chhaati: number;       // Chest
  kamar: number;         // Waist
  ghera: number;         // Daman width
  // Shalwar/Pajama
  shalwarLambai: number; // Shalwar length
  paincha: number;       // Bottom opening
  asan: number;          // Crotch
  shalwarGhera: number;  // Shalwar width
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
  createdAt: string;       
}
