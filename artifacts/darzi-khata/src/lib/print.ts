import urduRegular from '@fontsource/noto-nastaliq-urdu/files/noto-nastaliq-urdu-arabic-400-normal.woff2?url';
import urduBold from '@fontsource/noto-nastaliq-urdu/files/noto-nastaliq-urdu-arabic-700-normal.woff2?url';

export type PrintPaper = 'a4' | '58mm' | '80mm';
type PrintOptions = { paper?: PrintPaper; download?: boolean };
let busy = false;

// Copy presentation, not application CSS: no Radix, navigation, responsive
// breakpoints, dark theme or page-print rules enter the isolated document.
const properties = [
  'display', 'font-family', 'font-size', 'font-weight', 'line-height',
  'text-align', 'direction', 'white-space', 'vertical-align',
  'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
  'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
  'border-top-width', 'border-right-width', 'border-bottom-width', 'border-left-width',
  'border-style', 'border-collapse', 'border-spacing',
  'gap', 'justify-content', 'align-items', 'flex-direction', 'flex-wrap',
  'grid-template-columns', 'grid-column', 'list-style-type',
];

function printableCopy(node: HTMLElement): HTMLElement {
  const clone = node.cloneNode(true) as HTMLElement;
  const sources = [node, ...node.querySelectorAll<HTMLElement>('*')];
  const targets = [clone, ...clone.querySelectorAll<HTMLElement>('*')];
  sources.forEach((source, index) => {
    const target = targets[index];
    const computed = getComputedStyle(source);
    target.removeAttribute('id');
    target.removeAttribute('style');
    target.removeAttribute('role');
    target.removeAttribute('tabindex');
    // Print-only tables must be included even when printing from a phone.
    if (source.classList.contains('print:table')) target.style.display = 'table';
    else if (source.classList.contains('print:hidden') || source.classList.contains('print-hide') ||
      ['BUTTON', 'SCRIPT', 'STYLE', 'IFRAME', 'INPUT'].includes(source.tagName) ||
      computed.position === 'absolute' || computed.position === 'fixed') {
      target.dataset.omit = 'true';
      return;
    }
    properties.forEach(property => {
      if (property !== 'display' || !source.classList.contains('print:table')) {
        target.style.setProperty(property, computed.getPropertyValue(property));
      }
    });
    // A hidden desktop worksheet table can have a hidden wrapping element.
    if (source.classList.contains('print:block')) target.style.display = 'block';
    if (source instanceof HTMLImageElement) {
      target.style.width = `${Math.min(source.naturalWidth || source.width || 120, 140)}px`;
      target.style.height = 'auto';
      // QR is already a PNG data URL. Convert other decoded pictures too so
      // the printable document does not depend on blob URL lifetimes.
      if (!source.src.startsWith('data:') && source.complete && source.naturalWidth) {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = source.naturalWidth;
          canvas.height = source.naturalHeight;
          canvas.getContext('2d')!.drawImage(source, 0, 0);
          target.setAttribute('src', canvas.toDataURL('image/png'));
        } catch { /* A remote image may forbid canvas access; retain its URL. */ }
      }
    }
    if (source instanceof SVGElement) {
      target.style.width = source.getAttribute('width') || '20px';
      target.style.height = source.getAttribute('height') || '20px';
    }
  });
  clone.querySelectorAll('[data-omit]').forEach(element => element.remove());
  clone.querySelectorAll('[class]').forEach(element => element.removeAttribute('class'));
  clone.style.padding = '0';
  return clone;
}

/** The ONLY print path. The live page and its dialogs are never printed. */
export async function printElement(node: HTMLElement | null, { paper = 'a4', download = false }: PrintOptions = {}) {
  if (!node) throw new Error('Nothing to print');
  if (busy) return;
  busy = true;
  let iframe: HTMLIFrameElement | undefined;
  try {
    await document.fonts.ready;
    await Promise.all([...node.querySelectorAll('img')].map(image => image.decode().catch(() => {})));
    const clone = printableCopy(node);
    iframe = document.createElement('iframe');
    iframe.dataset.testid = 'print-frame';
    iframe.title = 'Printable document';
    iframe.setAttribute('aria-hidden', 'true');
    // Not display:none: browsers must lay out fonts/images before printing.
    iframe.style.cssText = `position:fixed;left:-10000px;top:0;width:${paper === 'a4' ? 186 : paper === '58mm' ? 54 : 76}mm;height:1100px;border:0;pointer-events:none`;
    document.body.append(iframe);
    const doc = iframe.contentDocument!;
    const win = iframe.contentWindow!;
    const width = paper === 'a4' ? 186 : paper === '58mm' ? 54 : 76;
    doc.open();
    doc.write('<!doctype html><html><head><meta charset="utf-8"><title>Darzi Khata</title></head><body><main></main></body></html>');
    doc.close();
    doc.documentElement.lang = document.documentElement.lang;
    doc.documentElement.dir = document.documentElement.dir;
    const style = doc.createElement('style');
    style.textContent = `
      @font-face{font-family:PrintUrdu;src:url("${new URL(urduRegular, location.href).href}") format("woff2");font-weight:400}
      @font-face{font-family:PrintUrdu;src:url("${new URL(urduBold, location.href).href}") format("woff2");font-weight:700}
      @page{size:${paper === 'a4' ? 'A4' : `${paper === '58mm' ? 58 : 80}mm 297mm`};margin:${paper === 'a4' ? 12 : 2}mm}
      *{box-sizing:border-box;color:#000!important;border-color:#999!important;background:transparent!important;
        position:static!important;transform:none!important;max-height:none!important;overflow:visible!important;
        box-shadow:none!important;text-shadow:none!important;animation:none!important}
      html,body{margin:0;padding:0;width:${width}mm;background:#fff!important;font-family:system-ui,sans-serif;font-size:12px;line-height:1.45}
      html[lang=ur] *{font-family:PrintUrdu,serif!important;line-height:1.65!important}
      main{width:100%}main>div{width:100%!important;max-width:none!important}
      table{width:100%!important;min-width:0!important;table-layout:fixed}
      td,th{overflow-wrap:anywhere;font-size:10px!important;padding:5px!important}
      img{object-fit:contain;break-inside:avoid}svg{background:transparent!important;flex-shrink:0}
      p,h1,h2,h3{break-after:avoid}tr{break-inside:avoid}
      @media screen{body{min-height:0}}
    `;
    doc.head.append(style);
    doc.querySelector('main')!.append(doc.adoptNode(clone));
    // Register face usage before reading fonts.ready; a freshly written iframe
    // can otherwise report an already-resolved ready promise before layout.
    void doc.body.offsetHeight;
    if (doc.documentElement.lang === 'ur') {
      await Promise.all([
        doc.fonts.load('400 16px PrintUrdu', '\u0627'),
        doc.fonts.load('700 16px PrintUrdu', '\u0627'),
      ]);
    }
    await doc.fonts.ready;
    await Promise.all([...doc.images].map(image => image.decode()));
    if (paper !== 'a4') {
      // Leave room for print-engine rounding and Nastaliq descenders. A roll
      // has no fixed page length; do not split its closing text onto page two.
      const rollHeight = Math.max(100, Math.ceil(doc.body.scrollHeight * 25.4 / 96 + 20));
      style.textContent += `@page{size:${paper === '58mm' ? 58 : 80}mm ${rollHeight}mm;margin:2mm}`;
    }
    // Explicit readiness lets browser tests capture the exact document printed.
    iframe.dataset.ready = 'true';
    if (download) {
      const [{ toCanvas }, { jsPDF }] = await Promise.all([import('html-to-image'), import('jspdf')]);
      const canvas = await toCanvas(doc.body, {
        pixelRatio: 2, backgroundColor: 'white', width: doc.body.getBoundingClientRect().width,
        height: doc.body.scrollHeight,
      });
      const margin = paper === 'a4' ? 12 : 2;
      const pageWidth = width + margin * 2;
      const pageHeight = paper === 'a4' ? 297 : Math.max(100, canvas.height / canvas.width * width + margin * 2);
      const pdf = new jsPDF({ unit: 'mm', format: [pageWidth, pageHeight], orientation: 'portrait' });
      const sliceHeight = Math.floor((pageHeight - margin * 2) / width * canvas.width);
      for (let y = 0; y < canvas.height; y += sliceHeight) {
        if (y) pdf.addPage();
        const slice = document.createElement('canvas');
        slice.width = canvas.width;
        slice.height = Math.min(sliceHeight, canvas.height - y);
        slice.getContext('2d')!.drawImage(canvas, 0, y, canvas.width, slice.height, 0, 0, canvas.width, slice.height);
        pdf.addImage(slice.toDataURL('image/png'), 'PNG', margin, margin, width, slice.height / slice.width * width);
      }
      const serial = node.textContent?.match(/DK-\d+/)?.[0] || 'document';
      pdf.save(`${serial}.pdf`);
      iframe.remove();
    } else {
      const frame = iframe;
      win.addEventListener('afterprint', () => frame.remove(), { once: true });
      // Bound abandoned print documents without deleting a frame during preview.
      setTimeout(() => frame.remove(), 10 * 60_000);
      win.focus();
      win.print();
    }
  } catch (error) {
    iframe?.remove();
    throw error;
  } finally {
    busy = false;
  }
}
