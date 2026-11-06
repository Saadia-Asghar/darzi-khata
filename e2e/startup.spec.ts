import { test, expect } from '@playwright/test';

test('signed-out shell stays small and switches language before loading shop tools', async ({ page }) => {
  const scripts: string[] = [];
  page.on('request', request => {
    if (request.resourceType() === 'script') scripts.push(request.url());
  });
  await page.goto('/');
  await expect(page.getByTestId('input-login-email')).toBeVisible();
  await page.getByTestId('switch-language-ur').click();
  await expect(page.locator('main')).toHaveAttribute('dir', 'rtl');
  await page.getByTestId('tab-signup').click();
  await expect(page.getByTestId('input-signup-name')).toBeVisible();
  await page.reload();
  await expect(page.locator('main')).toHaveAttribute('lang', 'ur');
  expect(scripts.filter(url => /signed-in-app-|dashboard-|karigar-dashboard-/.test(url))).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

for (const role of ['owner', 'karigar'] as const) {
  test(`${role} can sign in and reload through the lazy authenticated shell`, async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('input-login-email').fill('demo@darzikhata.com');
    await page.getByTestId('input-login-password').fill('incorrect-password');
    await page.getByTestId('btn-login').click();
    await expect(page.getByRole('alert')).toBeVisible();
    await page.getByTestId('btn-demo-accounts').click();
    await page.getByTestId(role === 'owner' ? 'demo-login-demo' : 'demo-login-bashir').click();
    for (let i = 0; i < 3; i++) await page.getByTestId('btn-intro-next').click();
    const destination = role === 'owner' ? page.getByTestId('nav-new') : page.getByRole('heading', { name: 'Ustad Bashir' });
    await expect(destination).toBeVisible();
    await page.reload();
    await expect(destination).toBeVisible();
    expect(await page.evaluate(() => sessionStorage.getItem('darzi-khata-session')))
      .toBe(role === 'owner' ? 'demo-account' : 'demo-bashir');
  });
}

test('signed-out installation precaches lazy shop tools and Urdu fonts for offline sign-in', async ({ page, context }) => {
  test.skip(!process.env.E2E_PRODUCTION, 'Requires production Workbox precache');
  await page.goto('/');
  await expect(page.getByTestId('btn-login')).toBeVisible();
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  const assets = await page.evaluate(async () => {
    const keys = (await caches.keys()).filter(key => key.includes('precache'));
    return (await Promise.all(keys.map(async key => (await (await caches.open(key)).keys()).map(request => request.url)))).flat();
  });
  expect(assets.some(url => /signed-in-app-.*\.js/.test(url))).toBe(true);
  expect(assets.some(url => /dashboard-.*\.js/.test(url))).toBe(true);
  for (const weight of ['400', '700']) {
    expect(assets.some(url => url.includes(`noto-nastaliq-urdu-arabic-${weight}-normal`) && url.includes('.woff2'))).toBe(true);
  }
  await page.reload();
  await context.setOffline(true);
  await page.reload();
  await page.getByTestId('btn-demo-accounts').click();
  await page.getByTestId('demo-login-demo').click();
  for (let i = 0; i < 3; i++) await page.getByTestId('btn-intro-next').click();
  await expect(page.getByTestId('nav-new')).toBeVisible();
});
