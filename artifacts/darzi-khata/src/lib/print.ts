import { createElement } from 'react';
import { createPortal, flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';

export type PrintPaper = 'a4' | '58mm' | '80mm';
let cancelPrevious: (() => void) | undefined;

/** A detached copy: printing never moves, mutates or unmounts the live dialog. */
export async function printElement(node: HTMLElement | null, { paper = 'a4' }: { paper?: PrintPaper } = {}) {
  if (!node) throw new Error('Nothing to print');
  cancelPrevious?.();
  const host = document.createElement('div');
  host.id = 'dk-print-root';
  host.dir = document.documentElement.dir;
  host.lang = document.documentElement.lang;
  const clone = node.cloneNode(true) as HTMLElement;
  clone.removeAttribute('id');
  clone.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'));
  host.append(clone);
  document.body.append(host);
  const controller = createRoot(document.createElement('div'));
  const style = document.createElement('style');
  // Chromium does not support "58mm auto". Use an explicit roll length.
  document.head.append(style);
  host.dataset.paper = paper;
  const cleanup = () => {
    window.removeEventListener('afterprint', cleanup);
    document.body.classList.remove('dk-printing');
    controller.unmount();
    host.remove();
    style.remove();
    cancelPrevious = undefined;
  };
  cancelPrevious = cleanup;
  flushSync(() => controller.render(createPortal(createElement('div', {
    ref: (el: HTMLDivElement | null) => { if (el) el.append(clone); },
  }), host)));
  window.addEventListener('afterprint', cleanup, { once: true });
  try {
    await document.fonts.ready;
    await Promise.all([...host.querySelectorAll('img')].map(img => img.decode().catch(() => {})));
    if (paper !== 'a4') {
      host.style.cssText = `display:block;position:absolute;left:-100000px;width:${paper === '58mm' ? 54 : 76}mm`;
      clone.style.padding = '0';
      const receipt = clone.querySelector<HTMLElement>('.print-paper');
      if (receipt) Object.assign(receipt.style, { width: '100%', maxWidth: 'none', padding: '12px', background: 'white' });
    }
    const height = Math.max(100, Math.ceil(host.scrollHeight * 0.264584 + 12));
    style.textContent = `@page { size: ${paper === 'a4' ? 'A4' : `${paper === '58mm' ? 58 : 80}mm ${height}mm`}; margin: ${paper === 'a4' ? 12 : 2}mm; }`;
    host.removeAttribute('style');
    document.body.classList.add('dk-printing');
    window.print();
  } catch (error) {
    cleanup();
    throw error;
  }
}
