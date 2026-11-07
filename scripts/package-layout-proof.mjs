import { mkdir, readFile, copyFile, readdir, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';

const out = 'generated-artifacts/compact-layout';
await mkdir(out, { recursive: true });
for (const [source, name] of [
  ['/tmp/compact-typecheck.txt', 'typecheck.txt'],
  ['/tmp/compact-tests.txt', 'tests.txt'],
  ['/tmp/compact-impeccable.txt', 'impeccable.txt'],
  ['/tmp/compact-build.txt', 'build.txt'],
  ['/tmp/compact-playwright-final.txt', 'playwright.txt'],
  ['/tmp/compact-print.txt', 'print-regression.txt'],
  ['/tmp/compact-before.txt', 'before-fix.txt'],
]) await copyFile(source, `${out}/${name}`);
await copyFile('QA.md', `${out}/QA.md`);
const metrics = JSON.parse(await readFile('qa-screens/layout/en-1366-metrics.json', 'utf8'));
const figures = [];
for (const width of [375, 1366]) for (const language of ['en', 'ur']) for (const screen of ['orders', 'more']) {
  const name = `${language}-${width}-${screen}.png`;
  const image = await readFile(`qa-screens/layout/${name}`);
  figures.push(`<figure><figcaption>${language === 'en' ? 'English' : 'Urdu'} · ${width}px · ${screen}</figcaption><img alt="${name}" src="data:image/png;base64,${image.toString('base64')}"></figure>`);
}
await writeFile(`${out}/proof.html`, `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Darzi Khata compact layout proof</title><style>body{font:16px system-ui;margin:24px auto;padding:0 16px;max-width:1440px;color:#153c30;background:#f7faf8}h1{font-size:28px}figure{margin:24px 0}figcaption{font-weight:700;margin-bottom:8px}img{display:block;max-width:100%;border:1px solid #c5d9cf;border-radius:8px}code{overflow-wrap:anywhere}</style><h1>Darzi Khata — compact layout verification</h1><p><strong>Preview build:</strong> ${metrics.version}</p><p>12/12 English/Urdu demo journeys passed at 360, 375, 768, 1024, 1366 and 1920px. No horizontal overflow; phone 4 complete cards, laptop 10 complete rows; More 2/3/4 columns; measurement controls within their grid; retained demo does not hijack landing/login.</p><p>Typecheck passed. 29 core and 118 Vitest tests passed. Two English/Urdu receipt print/download regressions passed. Impeccable source scan: zero findings in 173 files; source-only regex scan does not measure browser contrast.</p><p><strong>Publishing:</strong> these are workspace-preview screenshots, not proof of a new production publish. The user must click Publish before the new layout can be verified on darzi-khata.replit.app.</p>${figures.join('')}</html>`);
const screenshots = (await readdir('qa-screens/layout')).map(name => `qa-screens/layout/${name}`);
const reports = (await readdir(out)).filter(name => name !== 'evidence.zip').map(name => `${out}/${name}`);
execFileSync('zip', ['-q', `${out}/evidence.zip`, ...screenshots, ...reports]);
console.log(`${out}/proof.html\n${out}/evidence.zip\n${metrics.version}`);
