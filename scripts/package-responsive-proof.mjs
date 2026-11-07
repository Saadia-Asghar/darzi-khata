// Repackage existing evidence only; this does not run tests or invent results.
import { readFileSync, writeFileSync, copyFileSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

const root = 'generated-artifacts/responsive-print';
const escape = text => text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const version = JSON.parse(readFileSync(join(root, 'version.json'), 'utf8')).shownInMore;
const logs = {
  'typecheck.txt': '/tmp/responsive-typecheck.txt',
  'tests.txt': '/tmp/responsive-tests.txt',
  'build.txt': '/tmp/responsive-build.txt',
  'playwright.txt': '/tmp/responsive-proof-final.txt',
  'before-fix.txt': '/tmp/responsive-before.txt',
  'before-download-qr-fix.txt': '/tmp/download-qr-before.txt',
};
for (const [name, path] of Object.entries(logs)) copyFileSync(path, join(root, name));
copyFileSync('QA.md', join(root, 'QA.md'));
const figures = [
  ['desktop-settings-en.png', 'Desktop settings hub — English'],
  ['desktop-settings-ur.png', 'Desktop settings hub — Urdu / right sidebar'],
  ['parchi-en-1366-pdf.png', 'English receipt — rendered from native print PDF'],
  ['parchi-ur-1366-pdf.png', 'Urdu receipt — rendered from native print PDF'],
  ['parchi-en-1366-download-pdf.png', 'English downloaded PDF — QR retained'],
  ['parchi-ur-1366-download-pdf.png', 'Urdu downloaded PDF — shaped text and QR retained'],
];
const html = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Darzi Khata — responsive and print proof</title>
<style>body{font:16px/1.6 system-ui,sans-serif;background:#f7faf8;color:#18392d;margin:0}main{max-width:1100px;margin:auto;padding:24px}h1{line-height:1.2}section,figure{background:white;border:1px solid #dbe5df;border-radius:10px;padding:20px;margin:20px 0}img{display:block;width:100%;height:auto}figcaption{font-weight:600;margin-bottom:12px}pre{overflow:auto;background:#f0f5f2;padding:16px;font-size:13px}code{overflow-wrap:anywhere}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:20px}.grid figure{margin:0}small{color:#476153}</style>
<main><h1>Darzi Khata: print and responsive proof</h1><p><code>${escape(version)}</code></p>
<section><h2>Verified result</h2><p>Typecheck passed. Core tests: 29/29. Vitest: 118/118 in 10 files. Requested Playwright regression set: 18/18. Production build passed.</p>
<p>English and Urdu responsive screens were checked at 375, 768, 1366 and 1920px, plus boundary overflow checks from 320px. Receipt native and downloaded PDFs were checked at 375×812 and 1366×768. All example PDFs are one A4 page, with DK number, customer, amount and QR and without app/dialog/navigation.</p>
<p>The app source was pushed to GitHub; publication requires the user’s Publish action. This report verifies production preview, not a republished live site. Downloaded PDFs are page images rather than searchable/accessibility-tagged text documents. Physical printers and phone print services were not tested.</p>
<small>The ZIP includes all 76 responsive screenshots, original PDFs, rendered PDF screenshots, exact printable HTML, QA.md and full test output.</small></section>
${figures.map(([path, title]) => `<figure><figcaption>${escape(title)}</figcaption><img alt="${escape(title)}" src="data:image/png;base64,${readFileSync(join(root, path)).toString('base64')}"></figure>`).join('')}
<section><h2>Playwright output</h2><pre>${escape(readFileSync(join(root, 'playwright.txt'), 'utf8'))}</pre><h2>pnpm typecheck</h2><pre>${escape(readFileSync(join(root, 'typecheck.txt'), 'utf8'))}</pre><h2>pnpm test</h2><pre>${escape(readFileSync(join(root, 'tests.txt'), 'utf8'))}</pre></section></main></html>`;
writeFileSync(join(root, 'proof.html'), html);
// Use an explicit list: never recursively include the output archive itself.
const files = readdirSync(root).filter(name => name !== 'urdu-before.png' && /\.(pdf|png|html|json|txt|md)$/.test(name)).map(name => join(root, name));
execFileSync('zip', ['-q', '-r', join(root, 'evidence.zip'), ...files, 'qa-screens/responsive']);
console.log(`Packaged ${files.length} proof files and 76 responsive screenshots.`);
