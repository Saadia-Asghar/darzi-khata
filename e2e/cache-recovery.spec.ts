import { test, expect } from './app-test';

test('an old offline sign-in updates without deleting saved browser data', async ({ page, context }) => {
  test.skip(process.env.E2E_PRODUCTION === '1', 'Recovery worker is development-only.');
  let legacy = true;
  await context.route('**/sw.js', async route => {
    if (!legacy) return route.continue();
    await route.fulfill({
      contentType: 'application/javascript',
      headers: { 'Cache-Control': 'no-store' },
      body: `
        self.addEventListener('install', () => self.skipWaiting());
        self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
        self.addEventListener('fetch', e => {
          if (e.request.mode === 'navigate') e.respondWith(Promise.resolve(new Response(
            '<!doctype html><html><body><h1>Old cached screen</h1><button>Log in / لاگ ان</button></body></html>',
            { headers: { 'Content-Type': 'text/html' } }
          )));
        });
      `,
    });
  });
  await page.goto('/');
  await page.evaluate(async () => {
    localStorage.setItem('cache-recovery-sentinel', 'customer data preserved');
    await new Promise<void>((resolve, reject) => {
      const open = indexedDB.open('qa-cache-recovery', 1);
      open.onupgradeneeded = () => open.result.createObjectStore('records');
      open.onerror = () => reject(open.error);
      open.onsuccess = () => {
        const db = open.result;
        const tx = db.transaction('records', 'readwrite');
        tx.objectStore('records').put('photo data preserved', 'sentinel');
        tx.oncomplete = () => { db.close(); resolve(); };
        tx.onerror = () => reject(tx.error);
      };
    });
    await navigator.serviceWorker.register('/sw.js');
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Old cached screen' })).toBeVisible();
  legacy = false;
  await page.evaluate(() => {
    void navigator.serviceWorker.getRegistration().then(registration => registration?.update());
  });
  await expect(page.getByTestId('switch-language-en')).toBeVisible({ timeout: 20_000 });
  await expect(page.getByRole('button', { name: 'Log in', exact: true })).toBeVisible();
  await page.getByTestId('tab-signup').click();
  await expect(page.getByText('Your name', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Owner', exact: true })).toBeVisible();
  await page.getByTestId('switch-language-ur').click();
  await expect(page.getByText('Your name', { exact: true })).toHaveCount(0);
  await expect(page.getByTestId('switch-language-ur')).toHaveAttribute('aria-pressed', 'true');
  expect(await page.evaluate(() => localStorage.getItem('cache-recovery-sentinel')))
    .toBe('customer data preserved');
  expect(await page.evaluate(() => new Promise((resolve, reject) => {
    const open = indexedDB.open('qa-cache-recovery', 1);
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const db = open.result;
      const req = db.transaction('records').objectStore('records').get('sentinel');
      req.onsuccess = () => { db.close(); resolve(req.result); };
      req.onerror = () => reject(req.error);
    };
  }))).toBe('photo data preserved');
});
