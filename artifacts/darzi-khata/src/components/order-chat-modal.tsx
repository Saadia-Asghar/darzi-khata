import * as Dialog from '@radix-ui/react-dialog';
import { X, Send, MessageCircle } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { Order, OrderComment } from '../types/order';
import { useAuthContext } from '../context/auth-context';

interface OrderChatModalProps {
  order: Order | null;
  onClose: () => void;
  onAddComment: (orderId: string, comment: Omit<OrderComment, 'id' | 'createdAt'>) => void;
}

function formatTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Abhi';
  if (diffMins < 60) return `${diffMins} min pehle`;
  if (diffMins < 1440) return `${Math.floor(diffMins / 60)} ghante pehle`;
  return d.toLocaleDateString('ur-PK', { day: 'numeric', month: 'short' });
}

export function OrderChatModal({ order, onClose, onAddComment }: OrderChatModalProps) {
  const { currentUser } = useAuthContext();
  const [text, setText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const comments = order?.comments ?? [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments.length]);

  const handleSend = () => {
    if (!text.trim() || !order || !currentUser) return;
    onAddComment(order.id, {
      authorId: currentUser.id,
      authorName: currentUser.name,
      role: currentUser.role,
      text: text.trim(),
    });
    setText('');
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <Dialog.Root open={!!order} onOpenChange={(open) => { if (!open) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 bottom-0 z-50 w-full max-w-md -translate-x-1/2 rounded-t-2xl bg-background shadow-2xl outline-none flex flex-col max-h-[85vh]">

          {/* Header */}
          <div className="px-4 py-3 border-b bg-emerald-800 text-white rounded-t-2xl flex justify-between items-start shrink-0">
            <div>
              <Dialog.Title className="font-bold flex items-center gap-2">
                <MessageCircle size={16} className="text-amber-400" />
                Chat — {order?.customerName}
              </Dialog.Title>
              <Dialog.Description className="text-emerald-300 text-xs mt-0.5">
                {order?.serialNumber} · {order?.karigar ? `Karigar: ${order.karigar}` : 'Karigar assigned nahi'}
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button className="p-1.5 rounded-full hover:bg-emerald-700" aria-label="Close"><X size={18} /></button>
            </Dialog.Close>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
            {comments.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                <MessageCircle size={36} className="text-muted-foreground mb-3 opacity-40" />
                <p className="text-muted-foreground text-sm">Koi message nahi abhi tak</p>
                <p className="text-muted-foreground text-xs mt-1">Owner aur karigar yahaan baat kar sakte hain</p>
              </div>
            ) : (
              comments.map((c) => {
                const isMe = c.authorId === currentUser?.id;
                return (
                  <div key={c.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 shadow-sm ${
                      isMe
                        ? 'bg-emerald-700 text-white rounded-tr-sm'
                        : c.role === 'owner'
                          ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100 rounded-tl-sm border border-blue-100 dark:border-blue-800'
                          : 'bg-amber-50 dark:bg-amber-900/30 text-amber-900 dark:text-amber-100 rounded-tl-sm border border-amber-100 dark:border-amber-800'
                    }`}>
                      {!isMe && (
                        <div className="flex items-center gap-1 mb-1">
                          <span className="text-[10px] font-bold opacity-70">{c.authorName}</span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${c.role === 'owner' ? 'bg-blue-200 dark:bg-blue-800 text-blue-700 dark:text-blue-300' : 'bg-amber-200 dark:bg-amber-800 text-amber-700 dark:text-amber-300'}`}>
                            {c.role === 'owner' ? 'Malik' : 'Karigar'}
                          </span>
                        </div>
                      )}
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{c.text}</p>
                      <p className={`text-[10px] mt-1 ${isMe ? 'text-emerald-200' : 'opacity-50'} text-right`}>{formatTime(c.createdAt)}</p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t bg-card shrink-0 flex gap-2">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Apna message type karein..."
              rows={1}
              className="flex-1 px-3 py-2.5 rounded-xl border border-border bg-muted text-foreground text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500 max-h-28"
              style={{ fieldSizing: 'content' } as React.CSSProperties}
            />
            <button
              onClick={handleSend}
              disabled={!text.trim()}
              className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-40 text-white rounded-xl flex items-center gap-1.5 font-semibold text-sm transition-colors shrink-0"
            >
              <Send size={16} />
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
