/**
 * Soft-delete with a 5 second undo window. The order is hidden immediately, then purged
 * when the timer fires. Undo cancels the timer and nothing is written.
 * If the page is closed inside the window, the order survives (never lost by accident).
 */
import { useSyncExternalStore } from 'react';

export const UNDO_MS = 5000;
const timers = new Map<string, ReturnType<typeof setTimeout>>();
let hidden: ReadonlySet<string> = new Set();
const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());
const setHidden = (next: Set<string>) => { hidden = next; emit(); };

export function scheduleDelete(id: string, purge: () => void, ms = UNDO_MS) {
  cancelDelete(id);
  setHidden(new Set([...hidden, id]));
  timers.set(id, setTimeout(() => {
    timers.delete(id);
    try { purge(); } finally { const n = new Set(hidden); n.delete(id); setHidden(n); }
  }, ms));
}
export function cancelDelete(id: string) {
  const t = timers.get(id);
  if (t) clearTimeout(t);
  timers.delete(id);
  if (hidden.has(id)) { const n = new Set(hidden); n.delete(id); setHidden(n); }
}
export function isPendingDelete(id: string) { return hidden.has(id); }
export function useHiddenOrders() {
  return useSyncExternalStore((f) => { subs.add(f); return () => subs.delete(f); }, () => hidden, () => hidden);
}
