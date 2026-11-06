import { test, expect, type Page } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import { writeFile } from 'node:fs/promises';

async function demo(page: Page, language: 'en' | 'ur' = 'en', dark = false) {
  await page.goto('/');
  await page.evaluate(({ language, dark }) => {
    localStorage.setItem('darzi-khata-auth-lang', language);
    localStorage.setItem('darzi-khata-intro-seen-demo-account', 'true');
    localStorage.setItem('darzi-khata-settings-financial-demo-demo-account', JSON.stringify({
      shopName: 'Al-Madina Tailors', shopNameUrdu: 'المدینہ ٹیلرز', language, darkMode: dark,
      zindigiWallet: '03000000000', accountTitle: 'Al-Madina Tailors', phone: '03000000000',
    }));
  }, { language, dark });
  await page.goto('/app/login?demo=1');
  await expect(page.getByTestId('nav-more')).toBeVisible();
}
for (const lang of ['en', 'ur'] as const) {
  test(`landing and authentic screenshots ${lang}`, async ({ page }) => {
    await mkdir('artifacts/darzi-khata/public/screens', { recursive: true });
    await mkdir('generated-artifacts/launch', { recursive: true });
    await page.goto('/');
    if (lang === 'ur') await page.getByTestId('landing-lang-ur').click();
    await expect(page.locator('html')).toHaveAttribute('dir', lang === 'ur' ? 'rtl' : 'ltr');
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
    await page.screenshot({ path: `generated-artifacts/launch/landing-${lang}.png`, fullPage: true });
    await page.getByTestId('link-start-free').click();
    await expect(page).toHaveURL(/\/app\/login\?mode=signup$/);
    await expect(page.getByTestId('input-signup-name')).toBeVisible();
    await demo(page, lang);
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: `artifacts/darzi-khata/public/screens/orders-${lang}.png` });
    const unpaid = await page.evaluate(() => {
      const orders = JSON.parse(localStorage.getItem('darzi-khata-orders-financial-demo-demo-account') || '[]');
      const order = orders.find((o: { id: string; serialNumber: string; advanceAmount: number; totalAmount: number }) => o.advanceAmount < o.totalAmount);
      return order ? { id: String(order.id), serial: String(order.serialNumber) } : null;
    });
    expect(unpaid).toBeTruthy();
    await page.getByTestId('input-search').fill(unpaid!.serial);
    await page.getByTestId(`btn-receipt-${unpaid!.id}`).click();
    await expect(page.getByTestId('receipt-dialog')).toBeVisible();
    await expect(page.getByTestId('receipt-dialog').locator('img').last()).toBeVisible();
    await page.getByTestId('receipt-dialog').locator('img').last().scrollIntoViewIfNeeded();
    await page.screenshot({ path: `artifacts/darzi-khata/public/screens/parchi-${lang}.png` });
    await page.goto('/app/hisaab');
    await expect(page.getByTestId('profit-summary')).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: `artifacts/darzi-khata/public/screens/payments-${lang}.png` });
    await page.goto('/app/credit');
    await expect(page.getByTestId('text-credit-band')).toBeVisible();
    await page.screenshot({ path: `artifacts/darzi-khata/public/screens/credit-${lang}.png` });
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  });
}
test('installed PWA skips landing and uses app start URL', async ({ page }) => {
  await page.addInitScript(() => {
    const match = window.matchMedia.bind(window);
    window.matchMedia = query => query === '(display-mode: standalone)' ? { ...match(query), matches: true } as MediaQueryList : match(query);
  });
  await page.goto('/');
  await expect(page).toHaveURL(/\/app\/login$/);
  const manifest = await page.request.get('/manifest.webmanifest');
  expect((await manifest.json()).start_url).toBe('/app');
});
test('order batches keep every record searchable and load more without losing data', async ({ page }) => {
  await demo(page);
  await expect(page.locator('[data-testid^="card-order-"]')).toHaveCount(20);
  await page.getByTestId('orders-show-more').click();
  await expect(page.locator('[data-testid^="card-order-"]')).toHaveCount(40);
  const serial = await page.evaluate(() => JSON.parse(localStorage.getItem('darzi-khata-orders-financial-demo-demo-account')!)[149].serialNumber);
  await page.getByTestId('input-search').fill(serial);
  await expect(page.locator('[data-testid^="card-order-"]')).toHaveCount(1);
  await expect(page.locator('[data-testid^="card-order-"]')).toContainText(serial);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('darzi-khata-orders-financial-demo-demo-account')!).length)).toBe(150);
});
test('auth validation follows the visible language switch', async ({ page }) => {
  await page.goto('/app/login');
  for (const lang of ['ur', 'en'] as const) {
    await page.getByTestId(`switch-language-${lang}`).click();
    await page.getByTestId('input-login-email').fill('missing@example.test');
    await page.getByTestId('input-login-password').fill('not-a-password');
    await page.getByTestId('btn-login').click();
    await expect(page.getByRole('alert')).toContainText(lang === 'ur' ? 'یہ ای میل رجسٹرڈ نہیں ہے۔' : 'This email is not registered.');
  }
});
test('landing loads less than 150 KB compressed JS and does not install the app bundle', async ({ page }) => {
  const scripts: { url: string; raw: number; gzip: number }[] = [];
  const pending: Promise<void>[] = [];
  page.on('response', response => {
    if (response.request().resourceType() !== 'script' || !response.url().includes('/assets/')) return;
    pending.push(response.body().then(body => { scripts.push({ url: new URL(response.url()).pathname, raw: body.length, gzip: gzipSync(body).length }); }));
  });
  await page.goto('/');
  await expect(page.getByTestId('stat-land_impact_orders')).toHaveText('150');
  await page.evaluate(() => document.fonts.ready);
  await Promise.all(pending);
  const raw = scripts.reduce((sum, s) => sum + s.raw, 0), gzip = scripts.reduce((sum, s) => sum + s.gzip, 0);
  await writeFile('generated-artifacts/launch/landing-js.json', JSON.stringify({ raw, gzip, scripts }, null, 2));
  expect(gzip).toBeLessThan(150000);
  expect(scripts.some(s => /app-shell|signed-in-app|dashboard|public-pages/.test(s.url))).toBe(false);
  expect(await page.evaluate(async () => (await navigator.serviceWorker.getRegistrations()).length)).toBe(0);
});
test('pitch payment raises actual credit score and finish shows the same value', async ({ page }) => {
  await demo(page);
  await page.goto('/app/pitch');
  await page.getByTestId('pitch-begin').click();
  await expect(page.getByTestId('pitch-step')).toBeVisible();
  await page.getByTestId('pitch-next').click();
  await expect(page.getByTestId('pitch-step')).toContainText('PITCH-001');
  await page.getByTestId('pitch-next').click();
  await page.getByTestId('pitch-next').click();
  await expect(page.getByTestId('pitch-step')).toContainText('Baqi: Rs 0');
  await page.getByTestId('pitch-next').click();
  await expect(page.getByTestId('pitch-score')).not.toHaveText('0');
  await page.waitForTimeout(800);
  const score = await page.getByTestId('pitch-score').innerText();
  await page.getByTestId('pitch-next').click();
  await expect(page).toHaveURL(/\/app\/credit$/);
  await expect(page.locator(`svg[aria-label="Score ${score} of 100"]`)).toBeVisible();
});
for (const language of ['en', 'ur'] as const) for (const dark of [false, true]) {
  test(`expenses savings planner recovery and home mode ${language} ${dark ? 'dark' : 'light'}`, async ({ page }) => {
    await page.setViewportSize({ width: dark ? 360 : 390, height: dark ? 800 : 844 });
    await demo(page, language, dark);
    const errors: string[] = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto('/app/expenses');
    await page.getByTestId('expense-amount').fill('250');
    await page.getByTestId('expense-save').click();
    await expect(page.getByTestId('feature_spending')).toContainText('250');
    await page.reload();
    await expect(page.getByTestId('feature_spending')).toContainText('250');
    await page.goto('/app/savings');
    await page.getByTestId('savings-name').fill('Machine');
    await page.getByTestId('savings-save').click();
    await page.getByTestId('savings-amount').fill('500');
    await page.getByTestId('savings-contribute').click();
    await expect(page.locator('main')).toContainText('500');
    await page.goto('/app/rush');
    await page.getByTestId('rush-workers').fill('1');
    await page.getByTestId('rush-daily').fill('1');
    await expect(page.getByTestId('rush-result')).toBeVisible();
    await page.goto('/app/recovery');
    await expect(page.getByTestId('recovered-month')).toBeVisible();
    await page.locator('[data-testid^="recovery-create-"]').first().click();
    const wa = page.locator('[data-testid^="recovery-send-"]').first();
    await expect(wa).toBeVisible();
    const message = new URL((await wa.getAttribute('href'))!).searchParams.get('text')!;
    expect(message).toContain('/track/');
    expect(language === 'ur' ? /[\u0600-\u06ff]/.test(message) : !/[\u0600-\u06ff]/.test(message)).toBe(true);
    await page.goto('/app/settings');
    await page.getByTestId('btn-shoptype-women-home-tailor').click();
    await page.getByTestId('hide-shop-phone').check();
    await page.getByTestId('btn-save-settings').click();
    await page.goto('/app');
    await page.getByTestId('nav-new').click();
    await page.getByTestId('btn-new-quick').click();
    await expect(page.getByTestId('select-quick-garment')).toHaveValue('ladies-shirt');
    expect(await page.getByTestId('select-quick-garment').locator('option').first().getAttribute('value')).toBe('ladies-shirt');
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
    expect(errors).toEqual([]);
  });
}
test('lender links are consented, read-only, signed and expire', async ({ page, browser }) => {
  await demo(page);
  await page.goto('/app/share-profile');
  await expect(page.getByTestId('create-lender-link')).toBeDisabled();
  await page.getByTestId('lender-consent').check();
  await page.getByTestId('create-lender-link').click();
  await expect(page.getByTestId('generated-link')).toBeVisible();
  const url = await page.getByTestId('generated-link').inputValue();
  const visitor = await browser.newContext();
  const view = await visitor.newPage();
  await view.goto(url);
  await expect(view.locator('#public-profile-sheet')).toContainText('Al-Madina Tailors');
  await expect(view.getByTestId('public-download')).toBeVisible();
  expect(await view.evaluate(() => sessionStorage.getItem('darzi-khata-session'))).toBeNull();
  await view.clock.install({ time: new Date(Date.now() + 8 * 86400000) });
  await view.reload();
  await expect(view.getByRole('alert')).toContainText('expired');
  await visitor.close();
});
test('tracking link opens without account and only includes consented status', async ({ page, browser }) => {
  await demo(page);
  await page.locator('[data-testid^="btn-receipt-"]').first().click();
  await page.getByTestId('receipt-dialog').locator('summary').click();
  await page.getByTestId('create-tracking-link').click();
  const url = await page.getByTestId('generated-link').inputValue();
  const visitor = await browser.newContext();
  const view = await visitor.newPage();
  await view.goto(url);
  await expect(view.locator('[aria-current="step"]')).toBeVisible();
  await expect(view.locator('#public-profile-sheet')).not.toContainText('03000000000');
  await visitor.close();
});
