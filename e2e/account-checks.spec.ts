import { test, expect, type Page } from '@playwright/test';

async function signup(page: Page, suffix: string) {
  await page.getByTestId('tab-signup').click();
  await page.getByTestId('input-signup-name').fill(`Owner ${suffix}`);
  await page.getByTestId('input-signup-shop').fill(`Shop ${suffix}`);
  await page.getByTestId('input-signup-email').fill(`${suffix}@example.test`);
  await page.getByTestId('input-signup-password').fill('safe-password');
  await page.getByTestId('input-signup-confirm').fill('safe-password');
  await page.getByTestId('btn-signup').click();
  await expect(page.getByTestId('tab-login')).not.toBeVisible();
  await page.evaluate(() => {
    const id = sessionStorage.getItem('darzi-khata-session')!;
    localStorage.setItem(`darzi-khata-intro-seen-${id}`, 'true');
  });
  await page.reload();
  await expect(page.getByTestId('nav-more')).toBeVisible();
}
async function logout(page: Page) {
  await page.goto('/more');
  await page.getByTestId('btn-logout').click();
  const confirm = page.getByRole('alertdialog');
  if (await confirm.isVisible()) await confirm.getByRole('button').last().click();
  await expect(page.getByTestId('tab-login')).toBeVisible();
  expect(await page.evaluate(() => sessionStorage.getItem('darzi-khata-session'))).toBeNull();
}
async function login(page: Page, email: string, password: string) {
  await page.getByTestId('input-login-email').fill(email);
  await page.getByTestId('input-login-password').fill(password);
  await page.getByTestId('btn-login').click();
}

test('signup validation, salted passwords, duplicate email, login, refresh and demo isolation', async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto('/');
  await page.getByTestId('tab-signup').click();
  await page.getByTestId('btn-signup').click();
  expect(await page.getByTestId('input-signup-name').evaluate((el: HTMLInputElement) => el.validity.valueMissing)).toBe(true);
  await page.getByTestId('input-signup-name').fill('Owner A');
  await page.getByTestId('input-signup-email').fill('bad-email');
  expect(await page.getByTestId('input-signup-email').evaluate((el: HTMLInputElement) => el.validity.typeMismatch)).toBe(true);
  await page.getByTestId('input-signup-email').fill('account-a@example.test');
  await page.getByTestId('input-signup-password').fill('123');
  await page.getByTestId('input-signup-confirm').fill('123');
  await page.getByTestId('btn-signup').click();
  expect(await page.getByTestId('input-signup-password').evaluate((el: HTMLInputElement) => el.validity.tooShort)).toBe(true);
  await page.getByTestId('input-signup-password').fill('safe-password');
  await page.getByTestId('input-signup-confirm').fill('different-password');
  await page.getByTestId('btn-signup').click();
  await expect(page.getByRole('alert')).toBeVisible();
  await signup(page, 'account-a');
  const a = await page.evaluate(() => sessionStorage.getItem('darzi-khata-session')!);
  await expect(page.getByTestId('empty-orders')).toBeVisible();
  await page.getByTestId('nav-new').click();
  await page.getByTestId('btn-new-quick').click();
  await page.getByTestId('input-quick-name').fill('Private customer A');
  await page.getByTestId('input-quick-phone').fill('03001234567');
  await page.getByTestId('btn-quick-save').click();
  await expect(page.locator('[data-testid^="card-order-"]')).toContainText('Private customer A');
  await page.evaluate(async a => {
    const orders = JSON.parse(localStorage.getItem(`darzi-khata-orders-${a}`)!);
    localStorage.setItem(`darzi-khata-templates-${a}`, JSON.stringify([{ id: 'private-template', name: 'Private template A', measurements: orders[0].measurements }]));
    const canvas = document.createElement('canvas'); canvas.width = 2; canvas.height = 2;
    const blob = await new Promise<Blob>(resolve => canvas.toBlob(blob => resolve(blob!)));
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('darzi-khata-photos', 1);
      request.onupgradeneeded = () => request.result.createObjectStore('photos', { keyPath: 'id' }).createIndex('scope', 'scope');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    orders[0].fabricPhotoId = `${a}:private-photo`;
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('photos', 'readwrite');
      tx.objectStore('photos').put({ id: orders[0].fabricPhotoId, scope: a, blob });
      tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error);
    });
    db.close();
    localStorage.setItem(`darzi-khata-orders-${a}`, JSON.stringify(orders));
  }, a);
  const accounts = await page.evaluate(() => JSON.parse(localStorage.getItem('darzi-khata-accounts')!));
  expect(accounts.find((x: {id:string}) => x.id === a).passwordHash).toMatch(/^pbkdf2:210000:/);
  expect(JSON.stringify(accounts)).not.toContain('safe-password');
  await page.reload();
  await expect(page.locator('[data-testid^="card-order-"]')).toContainText('Private customer A');
  await expect(page.getByTestId('img-fabric').first()).toBeVisible();
  await logout(page);
  await page.getByRole('button', { name: 'Show password', exact: true }).click();
  await expect(page.getByTestId('input-login-password')).toHaveAttribute('type', 'text');
  await page.getByRole('button', { name: 'Hide password', exact: true }).click();
  await login(page, 'account-a@example.test', 'wrong-password');
  await expect(page.getByRole('alert')).toBeVisible();
  await expect(page.locator('[data-testid^="card-order-"]')).toHaveCount(0);
  await page.getByTestId('tab-signup').click();
  await page.getByTestId('input-signup-name').fill('Duplicate');
  await page.getByTestId('input-signup-email').fill('account-a@example.test');
  await page.getByTestId('input-signup-password').fill('safe-password');
  await page.getByTestId('input-signup-confirm').fill('safe-password');
  await page.getByTestId('btn-signup').click();
  await expect(page.getByRole('alert')).toContainText(/registered|already|exists/i);
  await signup(page, 'account-b');
  await expect(page.getByTestId('empty-orders')).toBeVisible();
  await expect(page.getByTestId('img-fabric')).toHaveCount(0);
  await page.goto('/customers');
  await expect(page.locator('[data-testid^="row-customer-"]')).toHaveCount(0);
  await page.goto('/settings');
  await expect(page.locator('body')).not.toContainText('Shop account-a');
  const b = await page.evaluate(() => sessionStorage.getItem('darzi-khata-session')!);
  expect(b).not.toBe(a);
  const isolated = await page.evaluate(b => ({
    templates: JSON.parse(localStorage.getItem(`darzi-khata-templates-${b}`) || '[]'),
    orders: JSON.parse(localStorage.getItem(`darzi-khata-orders-${b}`) || '[]'),
    demo: localStorage.getItem(`darzi-khata-demo-mode-${b}`),
  }), b);
  expect(isolated.templates).toEqual([]);
  expect(isolated.orders).toEqual([]);
  expect(isolated.demo).not.toBe('true');
  await logout(page);
  await page.getByTestId('btn-demo-accounts').click();
  await page.getByTestId('demo-login-demo').click();
  await page.getByTestId('btn-intro-skip').click();
  await expect(page.getByTestId('nav-more')).toBeVisible();
  await expect(page.locator('body')).not.toContainText('Private customer A');
  await logout(page);
  await login(page, 'account-a@example.test', 'safe-password');
  await page.goto('/');
  await expect(page.locator('[data-testid^="card-order-"]')).toContainText('Private customer A');
  await expect(page.getByTestId('img-fabric').first()).toBeVisible();
});

test('PIN set, reload lock, wrong PIN, five-failure lockout, timer and correct unlock', async ({ page }) => {
  test.setTimeout(75_000);
  await page.goto('/');
  await signup(page, 'pin-account');
  await page.goto('/settings');
  await page.getByTestId('new-pin').fill('2468');
  await page.getByTestId('confirm-pin').fill('2468');
  await page.getByTestId('save-pin').click();
  await expect(page.getByTestId('lock-now')).toBeVisible();
  await page.reload();
  await expect(page.getByTestId('unlock-pin')).toBeVisible();
  for (let i = 0; i < 5; i++) {
    await page.getByTestId('unlock-pin').fill('0000');
    await page.getByTestId('unlock-submit').click();
    await expect(page.getByRole('alert')).toBeVisible();
  }
  await expect(page.getByTestId('unlock-submit')).toBeDisabled();
  await page.clock.install();
  await page.clock.fastForward(31_000);
  await expect(page.getByTestId('unlock-submit')).toBeEnabled();
  await page.getByTestId('unlock-pin').fill('2468');
  await page.getByTestId('unlock-submit').click();
  await expect(page.getByTestId('lock-now')).toBeVisible();
  await page.getByTestId('lock-now').click();
  await expect(page.getByTestId('unlock-pin')).toBeVisible();
});
