import { Order } from '../types/order';

interface StatsBarProps {
  orders: Order[];
  onDueTodayClick: () => void;
}

export function StatsBar({ orders, onDueTodayClick }: StatsBarProps) {
  const activeOrders = orders.filter((o) => o.status !== 'delivered');
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const deliveriesSoon = activeOrders.filter((o) => {
    const dDate = new Date(o.deliveryDate);
    dDate.setHours(0, 0, 0, 0);
    return dDate.getTime() <= tomorrow.getTime();
  });

  const totalBaqi = activeOrders.reduce((sum, o) => {
    const baqi = o.totalAmount - o.advanceAmount;
    return sum + (baqi > 0 ? baqi : 0);
  }, 0);

  return (
    <div className="grid grid-cols-3 gap-3 mb-6">
      <div className="bg-emerald-800 text-white rounded-xl p-3 shadow-md">
        <div className="text-[10px] text-emerald-200 uppercase font-semibold tracking-wider mb-1">Active Orders</div>
        <div className="text-2xl font-bold font-sans">{activeOrders.length}</div>
        <div className="text-xs text-emerald-300 font-urdu mt-0.5">کل آرڈرز</div>
      </div>
      
      <button onClick={onDueTodayClick} className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm relative text-left active:scale-95 transition-transform hover:bg-gray-50 outline-none">
        {deliveriesSoon.length > 0 && (
          <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-[8px] items-center justify-center text-white font-bold">{deliveriesSoon.length}</span>
          </span>
        )}
        <div className="text-[10px] text-gray-500 uppercase font-semibold tracking-wider mb-1 leading-tight">Due Today/Kal</div>
        <div className={`text-2xl font-bold font-sans ${deliveriesSoon.length > 0 ? 'text-red-600' : 'text-gray-900'}`}>{deliveriesSoon.length}</div>
        <div className="text-xs text-gray-500 font-urdu mt-0.5">جلد واپسی</div>
      </button>
      
      <div className="bg-amber-500 text-amber-950 rounded-xl p-3 shadow-md">
        <div className="text-[10px] text-amber-900 uppercase font-semibold tracking-wider mb-1">Total Baqi</div>
        <div className="text-lg font-bold font-sans truncate">Rs.{totalBaqi.toLocaleString()}</div>
        <div className="text-xs text-amber-800 font-urdu mt-0.5">باقی رقم</div>
      </div>
    </div>
  );
}
