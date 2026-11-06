import { test, expect } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

async function enterDemo(page: import('@playwright/test').Page, lang: 'en' | 'ur') {
  await page.goto('/');
  await page.getByTestId(`landing-lang-${lang}`).click();
  await page.getByTestId('link-try-demo').click();
  await expect(page.getByTestId('intro-dialog')).toBeVisible();
}
for (const lang of ['en', 'ur'] as const) {
  test(`intro Skip stays dismissed and header fits 320/360/375 ${lang}`, async ({ page }) => {
    await enterDemo(page, lang);
    await page.getByTestId('btn-intro-skip').click();
    await expect(page.getByTestId('intro-dialog')).toHaveCount(0);
    await expect(page.getByTestId('nav-more')).toBeVisible();
    await page.reload();
    await expect(page.getByTestId('nav-more')).toBeVisible();
    await expect(page.getByTestId('intro-dialog')).toHaveCount(0);
    for (const width of [320, 360, 375]) {
      await page.setViewportSize({ width, height: 812 });
      await expect(page.locator('[data-app-header] [data-testid^="switch-language"]')).toHaveCount(0);
      const header = await page.getByTestId('text-shop-name').evaluate(el => {
        const css = getComputedStyle(el); return { overflow: css.textOverflow, height: el.getBoundingClientRect().height, line: parseFloat(css.lineHeight) };
      });
      expect(header.overflow).toBe('ellipsis');
      expect(header.height).toBeLessThanOrEqual(header.line + 2);
      expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
    }
    const legacy = await page.evaluate(() => {
      const key = 'darzi-khata-orders-financial-demo-demo-account';
      const orders = JSON.parse(localStorage.getItem(key)!);
      const first = orders.find((o: {status: string}) => o.status !== 'delivered');
      first.deliveryDate = new Date(Date.now() - 3 * 86400000).toISOString();
      first.fabric = 'Boski / بوسکی'; first.status = 'stitching';
      localStorage.setItem(key, JSON.stringify(orders));
      return { id: first.id, serial: first.serialNumber };
    });
    await page.reload();
    await page.getByTestId('input-search').fill(legacy.serial);
    await expect(page.getByTestId(`status-${legacy.id}`)).toHaveText(lang === 'en' ? /Stitching/ : /سلائی/);
    await expect(page.getByTestId(`delivery-${legacy.id}`)).toContainText(lang === 'en' ? '3 days late' : '۳ دن تاخیر');
    await expect(page.getByTestId(`card-order-${legacy.id}`)).not.toContainText('Boski /');
    await expect(page.getByTestId(`btn-chat-${legacy.id}`)).toContainText(lang === 'en' ? 'Notes' : 'نوٹس');
    await expect(page.getByTestId('nav-more').locator('span.bg-danger')).toHaveCount(0);
  });

  test(`last intro step persists and every main page has dark screenshots ${lang}`, async ({ page }) => {
    test.setTimeout(100_000);
    await mkdir(`qa-screens/${lang}`, { recursive: true });
    await enterDemo(page, lang);
    await page.getByTestId('btn-intro-next').click();
    await page.getByTestId('btn-intro-next').click();
    await page.getByTestId('btn-intro-next').click();
    await expect(page.getByTestId('intro-dialog')).toHaveCount(0);
    await page.reload();
    await expect(page.getByTestId('nav-more')).toBeVisible();
    await expect(page.getByTestId('intro-dialog')).toHaveCount(0);
    await page.evaluate(() => {
      const key = 'darzi-khata-settings-financial-demo-demo-account';
      const settings = JSON.parse(localStorage.getItem(key)!);
      localStorage.setItem(key, JSON.stringify({ ...settings, darkMode: true }));
    });
    const routes = ['', 'customers', 'hisaab', 'more', 'settings', 'credit', 'recovery', 'rush', 'expenses', 'savings', 'share-profile', 'pitch'];
    for (const route of routes) {
      await page.goto(`/app${route ? '/' + route : ''}`);
      await expect(page.getByTestId('nav-more')).toBeVisible();
      await expect(page.locator('html')).toHaveClass(/dark/);
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({ path: `qa-screens/${lang}/${route || 'orders'}-dark.png` });
      expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
    }
    await writeFile(`qa-screens/${lang}/result.json`, JSON.stringify({ language: lang, viewport: '375x812', routes, intro: 'completed once; absent after reload', overflow: false }, null, 2));
  });
}

test('existing offline worker upgrades without deleting shop data', async ({ page, context }) => {
  test.skip(process.env.E2E_PRODUCTION !== '1', 'Requires the built production service worker');
  const oldWorker = `self.addEventListener('install',e=>e.waitUntil(self.skipWaiting()));self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));`;
  await context.route('**/judge-old-worker.js', route => route.fulfill({ status: 200, contentType: 'application/javascript', headers: { 'Service-Worker-Allowed': '/' }, body: oldWorker }));
  await page.goto('/');
  await page.evaluate(async () => {
    localStorage.setItem('judge-data-preserved', 'saved business record');
    await navigator.serviceWorker.register('/judge-old-worker.js', { scope: '/' });
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await expect.poll(() => page.evaluate(() => navigator.serviceWorker.controller?.scriptURL || '')).toContain('judge-old-worker');
  await page.evaluate(async () => {
    await navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' });
  });
  await expect(page.getByTestId('app-update-ready')).toBeVisible({ timeout: 30_000 });
  await expect.poll(() => page.evaluate(() => navigator.serviceWorker.controller?.scriptURL || '')).toContain('/sw.js');
  expect(await page.evaluate(() => localStorage.getItem('judge-data-preserved'))).toBe('saved business record');
  await page.getByTestId('app-update-ready').getByRole('button').click();
  await expect(page.getByTestId('link-try-demo')).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('judge-data-preserved'))).toBe('saved business record');
});

test('quick to full form preserves the selected saved measurements', async ({ page }) => {
  await enterDemo(page, 'en');
  await page.getByTestId('btn-intro-skip').click();
  await expect(page.getByTestId('nav-more')).toBeVisible();
  await page.evaluate(() => {
    const scope = 'financial-demo-demo-account';
    const orders = JSON.parse(localStorage.getItem(`darzi-khata-orders-${scope}`)!);
    const key = `darzi-khata-customers-${scope}`;
    const customers = JSON.parse(localStorage.getItem(key)!);
    const now = new Date().toISOString();
    customers.push({
      id: 'handoff-customer', name: 'Saved profile test', phone: '03004567890',
      profiles: [{ id:'saved-gents', name:'Saved measurements', garmentType:'gents', measurements:{...orders[0].measurements,kameezLambai:42} }],
      notes:'', createdAt:now, updatedAt:now,
    });
    localStorage.setItem(key, JSON.stringify(customers));
  });
  await page.goto('/app/customers');
  await page.getByTestId('row-customer-handoff-customer').getByTestId('btn-customer-quick').click();
  await expect(page.getByTestId('input-quick-name')).toHaveValue('Saved profile test');
  await page.getByTestId('btn-open-full-form').click();
  await expect(page.getByTestId('input-name')).toHaveValue('Saved profile test');
  await page.getByTestId('btn-step-next').click();
  await expect(page.getByTestId('input-m-kameezLambai')).toHaveValue('42');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('darzi-khata-customers-financial-demo-demo-account')!).find((c: {id:string})=>c.id==='handoff-customer').profiles[0].measurements.kameezLambai)).toBe(42);
});
