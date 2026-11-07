/**
 * Lets an existing dialog component render as a full routed page.
 * Inside <PageMode>, Root/Portal become pass-through, Overlay disappears, Content becomes a page
 * with a labelled back bar, and icon-only Close buttons are dropped (Back replaces them).
 * Outside <PageMode> everything delegates to Radix Dialog unchanged.
 */
import { createContext, useContext, isValidElement, type ComponentPropsWithoutRef, type ReactNode, type ReactElement } from 'react';
import * as R from '@radix-ui/react-dialog';
import { Slot } from '@radix-ui/react-slot';
import { ArrowLeft } from 'lucide-react';
import { usePreferences } from '../hooks/use-preferences';
import {
  Dialog as UiDialog, DialogContent as UiDialogContent, DialogDescription as UiDialogDescription,
  DialogHeader as UiDialogHeader, DialogTitle as UiDialogTitle,
} from '@/components/ui/dialog';

type PageCtx = { onBack: () => void; wide?: string; bare?: boolean } | null;
const Ctx = createContext<PageCtx>(null);

/** wide: multi-column page on desktop (value names the page for CSS). bare: no back bar (side panel). */
export function PageMode({ onBack, wide, bare, children }: { onBack: () => void; wide?: string; bare?: boolean; children: ReactNode }) {
  return <Ctx.Provider value={{ onBack, wide, bare }}>{children}</Ctx.Provider>;
}
export const usePageMode = () => useContext(Ctx);

export function BackBar({ onBack, title }: { onBack: () => void; title?: ReactNode }) {
  const { label } = usePreferences();
  return (
    <div className="sticky top-0 z-20 bg-background border-b border-border print:hidden">
      <div className="max-w-2xl md:max-w-4xl lg:max-w-[1200px] mx-auto flex items-center gap-2 px-2 min-h-[56px]">
        <button type="button" onClick={onBack} className="min-h-[44px] px-3 rounded-md inline-flex items-center gap-2 text-base font-medium hover:bg-muted" data-testid="btn-page-back">
          <ArrowLeft size={20} aria-hidden className="rtl:rotate-180" /> {label('back')}
        </button>
        {title && <span className="min-w-0 truncate text-base font-semibold">{title}</span>}
      </div>
    </div>
  );
}

function Root(props: ComponentPropsWithoutRef<typeof R.Root>) {
  const page = usePageMode();
  if (page) return <>{props.children}</>;
  return <R.Root {...props} />;
}
function Portal(props: ComponentPropsWithoutRef<typeof R.Portal>) {
  const page = usePageMode();
  if (page) return <>{props.children}</>;
  return <R.Portal {...props} />;
}
function Overlay(props: ComponentPropsWithoutRef<typeof R.Overlay>) {
  const page = usePageMode();
  if (page) return null;
  return <R.Overlay {...props} />;
}
function Content({ className, children, ...rest }: ComponentPropsWithoutRef<typeof R.Content>) {
  const page = usePageMode();
  if (page) {
    return (
      <div className={page.bare ? 'bg-background' : 'min-h-[100dvh] bg-background'} data-page-mode={page.bare ? 'panel' : ''} data-page-wide={page.wide}>
        {!page.bare && <BackBar onBack={page.onBack} />}
        <div className={`${page.bare ? '' : `max-w-2xl mx-auto ${page.wide ? 'md:max-w-4xl lg:max-w-[1200px]' : 'md:max-w-3xl'}`} relative flex flex-col`} role="region">{children}</div>
      </div>
    );
  }
  return <R.Content className={className} {...rest}>{children}</R.Content>;
}
function Title({ className, ...rest }: ComponentPropsWithoutRef<typeof R.Title>) {
  const page = usePageMode();
  if (page) return <h1 className={className} {...(rest as object)} />;
  return <R.Title className={className} {...rest} />;
}
function Description({ className, ...rest }: ComponentPropsWithoutRef<typeof R.Description>) {
  const page = usePageMode();
  if (page) return <p className={className} {...(rest as object)} />;
  return <R.Description className={className} {...rest} />;
}
function isIconOnly(child: ReactNode) {
  if (!isValidElement(child)) return false;
  const kids = (child as ReactElement<{ children?: ReactNode }>).props.children;
  if (typeof kids === 'string') return false;
  if (Array.isArray(kids)) return kids.every((k) => isValidElement(k) && typeof k.type !== 'string');
  return isValidElement(kids) && typeof kids.type !== 'string';
}
function Close({ asChild, children, ...rest }: ComponentPropsWithoutRef<typeof R.Close>) {
  const page = usePageMode();
  if (page) {
    if (isIconOnly(children)) return null;
    const Comp = asChild ? Slot : 'button';
    return <Comp {...(rest as object)} onClick={page.onBack}>{children}</Comp>;
  }
  return <R.Close asChild={asChild} {...rest}>{children}</R.Close>;
}

export { Root, Portal, Overlay, Content, Title, Description, Close };

/* Named shadcn-style API used by credit/impact/reminders. */
export function Dialog(props: ComponentPropsWithoutRef<typeof UiDialog>) {
  const page = usePageMode();
  if (page) return <>{props.children}</>;
  return <UiDialog {...props} />;
}
export function DialogContent({ children, ...rest }: ComponentPropsWithoutRef<typeof UiDialogContent>) {
  const page = usePageMode();
  if (page) return <Content>{children}</Content>;
  return <UiDialogContent {...rest}>{children}</UiDialogContent>;
}
export function DialogTitle(props: ComponentPropsWithoutRef<typeof UiDialogTitle>) {
  const page = usePageMode();
  if (page) return <h1 className={props.className}>{props.children}</h1>;
  return <UiDialogTitle {...props} />;
}
export function DialogDescription(props: ComponentPropsWithoutRef<typeof UiDialogDescription>) {
  const page = usePageMode();
  if (page) return <p className={props.className}>{props.children}</p>;
  return <UiDialogDescription {...props} />;
}
export function DialogHeader(props: ComponentPropsWithoutRef<typeof UiDialogHeader>) {
  return <UiDialogHeader {...props} />;
}
