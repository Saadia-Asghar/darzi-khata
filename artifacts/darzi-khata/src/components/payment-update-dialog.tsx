import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Wallet } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Order } from '../types/order';

interface PaymentUpdateDialogProps {
  order: Order;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdatePayment: (id: string, newAdvance: number) => void;
}

export function PaymentUpdateDialog({ order, open, onOpenChange, onUpdatePayment }: PaymentUpdateDialogProps) {
  const { toast } = useToast();
  const [newAdvance, setNewAdvance] = useState(order.advanceAmount);
  const baqi = order.totalAmount - order.advanceAmount;
  const newBaqi = order.totalAmount - newAdvance;

  const handleSave = () => {
    if (newAdvance > order.totalAmount) {
      toast({ title: 'Galat Rakam', description: 'Advance total se ziada nahi ho sakta.', variant: 'destructive' });
      return;
    }
    if (newBaqi === 0 && baqi > 0) {
      if (!window.confirm('Baqi zero ho jayega — kya payment poori ho gayi?')) return;
    }
    onUpdatePayment(order.id, newAdvance);
    toast({ title: 'Payment Update Ho Gaya!', description: `Naya advance: Rs. ${newAdvance} — Baqi: Rs. ${newBaqi}` });
    onOpenChange(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 z-[60] backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-[60] w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white dark:bg-card shadow-2xl outline-none overflow-hidden">
          <div className="px-5 py-4 border-b flex justify-between items-center bg-emerald-800 text-white">
            <div>
              <Dialog.Title className="text-base font-bold flex items-center gap-2">
                <Wallet size={16} /> Advance Update Karein
              </Dialog.Title>
              <Dialog.Description className="text-emerald-200 text-xs font-urdu">ادائیگی اپ ڈیٹ</Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-emerald-700 text-white" aria-label="Close">
                <X size={18} />
              </button>
            </Dialog.Close>
          </div>

          <div className="p-5 space-y-4">
            <div className="grid grid-cols-3 gap-2 text-center text-sm">
              <div className="bg-gray-50 dark:bg-muted rounded-lg p-2">
                <div className="text-xs text-muted-foreground font-semibold">Total Silai</div>
                <div className="font-bold text-foreground">Rs. {order.totalAmount.toLocaleString()}</div>
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-2">
                <div className="text-xs text-emerald-700 font-semibold">Advance Ada</div>
                <div className="font-bold text-emerald-700">Rs. {order.advanceAmount.toLocaleString()}</div>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-2">
                <div className="text-xs text-red-600 font-semibold">Baqi</div>
                <div className="font-bold text-red-600">Rs. {baqi.toLocaleString()}</div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-foreground mb-2">
                Naya Advance Received (Rs.)
              </label>
              <input
                type="number"
                min={0}
                max={order.totalAmount}
                value={newAdvance}
                onChange={(e) => setNewAdvance(Number(e.target.value))}
                className="w-full bg-gray-50 dark:bg-muted border border-gray-200 dark:border-border rounded-xl px-4 py-3 text-2xl font-bold font-mono outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 text-foreground"
                data-testid="input-new-advance"
              />
            </div>

            <div className={`p-3 rounded-xl border flex justify-between items-center ${newBaqi > 0 ? 'bg-red-50 border-red-100 dark:bg-red-900/20 dark:border-red-800' : 'bg-emerald-50 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800'}`}>
              <span className="font-bold text-sm text-foreground">Naya Baqi</span>
              <span className={`text-xl font-bold font-mono ${newBaqi > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                Rs. {newBaqi.toLocaleString()}
              </span>
            </div>

            <div className="flex gap-3">
              <Dialog.Close asChild>
                <button className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-border text-foreground font-bold hover:bg-muted transition-colors">
                  Cancel
                </button>
              </Dialog.Close>
              <button
                onClick={handleSave}
                className="flex-1 py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold transition-colors"
                data-testid="btn-confirm-payment"
              >
                Update Karein
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
