import type { ReactNode } from 'react';
import { useLocation } from 'wouter';
import { BackBar } from './page-dialog';
import { usePreferences } from '../hooks/use-preferences';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';

export const fieldClass = 'w-full min-h-[48px] rounded-lg border border-input bg-card text-foreground px-3 text-base';
export const actionClass = 'min-h-[48px] rounded-lg px-4 bg-primary text-primary-foreground text-base font-semibold disabled:opacity-50 inline-flex items-center justify-center gap-2';
export const panelClass = 'rounded-lg border border-border bg-card p-4 space-y-3';
export function ToolLayout({ title, children }: { title: string; children: ReactNode }) {
  const [, navigate] = useLocation();
  return <><BackBar onBack={() => navigate('/more')} /><main className="mx-auto max-w-2xl p-4 pb-28 space-y-5">
    <h1 className="text-2xl font-semibold">{title}</h1>{children}
  </main></>;
}
export function Field({ title, children }: { title: string; children: ReactNode }) {
  return <label className="block space-y-2"><span className="block text-sm font-medium">{title}</span>{children}</label>;
}
export function RemoveEntry({ open, onClose, onRemove }: { open: boolean; onClose: () => void; onRemove: () => void }) {
  const { label } = usePreferences();
  return <AlertDialog open={open} onOpenChange={v => { if (!v) onClose(); }}><AlertDialogContent>
    <AlertDialogHeader><AlertDialogTitle>{label('feature_remove')}</AlertDialogTitle><AlertDialogDescription>{label('feature_remove_note')}</AlertDialogDescription></AlertDialogHeader>
    <AlertDialogFooter><AlertDialogCancel>{label('cancel')}</AlertDialogCancel><AlertDialogAction onClick={onRemove}>{label('delete')}</AlertDialogAction></AlertDialogFooter>
  </AlertDialogContent></AlertDialog>;
}
