import { demoText } from '../lib/i18n';
import { usePreferences } from '../hooks/use-preferences';
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

function formatTime(iso: string, label: (key: string, vars?: Record<string, string | number>) => string) {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return label('now');
  if (diffMins < 60) return label('t_n_min_ago', { mins: diffMins });
  if (diffMins < 1440) return label('t_n_h_ago', { mins: Math.floor(diffMins / 60) });
  return d.toLocaleDateString('ur-PK', { day: 'numeric', month: 'short' });
}

export function OrderChatModal({ order, onClose, onAddComment }: OrderChatModalProps) {
  const { currentUser } = useAuthContext();
  const { label } = usePreferences();
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
        <Dialog.Overlay className="fixed inset-0 bg-foreground/60 z-50 " />
        <Dialog.Content className="fixed left-1/2 bottom-0 z-50 w-full max-w-md -translate-x-1/2 rounded-t-lg bg-background  outline-none flex flex-col max-h-[85vh]">

          {/* Header */}
          <div className="px-4 py-3 border-b bg-card text-foreground border-border rounded-t-lg flex justify-between items-start shrink-0">
            <div>
              <Dialog.Title className="font-bold flex items-center gap-2">
                <MessageCircle size={16} className="text-warning" />
                {label('chat')} · {order?.customerName}
              </Dialog.Title>
              <Dialog.Description className="text-muted-foreground text-sm mt-0.5">
                {order?.serialNumber} · {order?.karigar ? `${label('karigar')}: ${order.karigar}` : label('no_karigar_assigned')}
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button className="h-11 w-11 flex items-center justify-center rounded-full hover:bg-muted" aria-label={label('close')}><X size={18} /></button>
            </Dialog.Close>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
            {comments.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-4 text-center">
                <MessageCircle size={36} className="text-muted-foreground mb-3 opacity-40" />
                <p className="text-muted-foreground text-sm">{label('no_messages_yet')}</p>
                <p className="text-muted-foreground text-sm mt-1">{label('owner_and_karigar_can_talk_here')}</p>
              </div>
            ) : (
              comments.map((c) => {
                const isMe = c.authorId === currentUser?.id;
                return (
                  <div key={c.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-lg px-3.5 py-2.5  ${
                      isMe
                        ? 'bg-primary text-primary-foreground rounded-tr-sm'
                        : c.role === 'owner'
                          ? 'bg-info-soft  text-info  rounded-tl-sm border border-border '
                          : 'bg-warning-soft  text-accent-foreground  rounded-tl-sm border border-border '
                    }`}>
                      {!isMe && (
                        <div className="flex items-center gap-1 mb-1">
                          <span className="text-xs font-bold opacity-70">{order?.id.startsWith('finance-demo-') && c.authorName.startsWith('Shop Owner') ? label('owner') : c.authorName}</span>
                          <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${c.role === 'owner' ? 'bg-info-soft  text-info ' : 'bg-warning-soft  text-warning '}`}>
                            {c.role === 'owner' ? label('owner') : label('karigar')}
                          </span>
                        </div>
                      )}
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{order?.id.startsWith('finance-demo-') ? demoText(c.text) : c.text}</p>
                      <p className={`text-xs mt-1 ${isMe ? 'text-primary-foreground' : 'opacity-50'} text-end`}>{formatTime(c.createdAt, label)}</p>
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
              placeholder={label('type_a_message')} aria-label={label('message')}
              rows={1}
              className="flex-1 px-3 py-2.5 rounded-lg border border-border bg-muted text-foreground text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring max-h-28"
              style={{ fieldSizing: 'content' } as React.CSSProperties}
            />
            <button
              onClick={handleSend}
              disabled={!text.trim()}
              className="px-4 min-h-[44px] bg-primary hover:bg-primary disabled:opacity-40 text-primary-foreground rounded-lg flex items-center gap-1.5 font-semibold text-sm transition-colors shrink-0"
            >
              <Send size={16} aria-hidden /><span className="sr-only">{label('send')}</span>
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
