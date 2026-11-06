import { test, expect, type Page } from './app-test';
import { readFile } from 'node:fs/promises';

// Each test gets an isolated browser context. Never clear a user's actual khata.
const owner = 'qa-owner';
const ordersKey = `darzi-khata-orders-${owner}`;
const measurements = {
  kameezLambai: 40, teera: 18, bazu: 24, gala: 16, chhaati: 42, kamar: 40,
  ghera: 24, shalwarLambai: 40, paincha: 8, asan: 14, shalwarGhera: 28,
};
function fixture() {
  const delivery = new Date(); delivery.setDate(delivery.getDate() - 3);
  return {
    id: 'qa-order', serialNumber: 'DK-007', customerName: 'QA Tailor Customer',
    phone: '03001234567', orderDate: new Date().toISOString(),
    deliveryDate: delivery.toISOString(), urgent: true, suitCount: 1,
    fabric: 'White cotton', measurements, collarType: 'Normal Collar',
    damanType: 'Choras (Square)', pockets: 'Front Pocket', cuffType: 'Simple',
    specialNotes: '', totalAmount: 2500, advanceAmount: 0, status: 'pending',
    createdAt: new Date().toISOString(),
  };
}

async function seed(page: Page, opts: { empty?: boolean; intro?: boolean; urdu?: boolean; dark?: boolean } = {}) {
  await page.addInitScript(({ owner, order, opts }) => {
    if (sessionStorage.getItem('qa-seeded')) return;
    const account = { id: owner, name: 'QA Owner', email: 'qa@example.test',
      passwordHash: '', shopName: 'QA Tailors', role: 'owner', createdAt: new Date().toISOString() };
    localStorage.setItem('darzi-khata-accounts', JSON.stringify([account]));
    sessionStorage.setItem('darzi-khata-session', owner);
    localStorage.setItem(`darzi-khata-orders-${owner}`, JSON.stringify(opts.empty ? [] : [order]));
    localStorage.setItem(`darzi-khata-settings-${owner}`, JSON.stringify({
      shopName: 'QA Tailors', phone: '03001234567', address: 'Shop 1',
      zindigiWallet: '03001234567', accountTitle: 'QA Test Account',
      language: opts.urdu ? 'ur' : 'en', darkMode: !!opts.dark,
    }));
    localStorage.setItem(`darzi-khata-demo-mode-${owner}`, 'false');
    if (!opts.intro) localStorage.setItem(`darzi-khata-intro-seen-${owner}`, 'true');
    sessionStorage.setItem('qa-seeded', 'true');
  }, { owner, order: fixture(), opts });
  await page.goto('/');
}

async function noOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
}
async function openFullForm(page: Page) {
  await page.getByTestId('nav-new').click();
  await page.getByTestId('btn-new-full').click();
}
async function nextStep(page: Page) {
  await page.getByTestId('btn-step-next').click();
}
async function saved(page: Page) {
  return page.evaluate(key => JSON.parse(localStorage.getItem(key) || '[]'), ordersKey);
}

test('first run, onboarding, empty state, isolated demo data', async ({ page }) => {
  await seed(page, { empty: true, intro: true });
  for (let step = 0; step < 3; step++) await page.getByTestId('btn-intro-next').click();
  await expect(page.getByTestId('empty-orders')).toBeVisible();
  await page.getByTestId('btn-load-demo').click();
  await expect(page.locator('[data-testid^="card-order-"]').first()).toBeVisible();
  expect(await saved(page)).toEqual([]);
  await noOverflow(page);
});

test('visible language switch removes duplicate copy and persists selection', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 844 });
  await seed(page);
  await page.getByTestId('nav-more').click();
  await expect(page.getByTestId('btn-open-settings')).toHaveText('Settings');
  await expect(page.locator('details ol')).not.toBeVisible();
  await page.getByTestId('switch-language-ur').click();
  await expect(page.getByTestId('switch-language-ur')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(page.getByTestId('btn-open-settings')).not.toContainText('Settings');
  await noOverflow(page);
  await page.screenshot({ path: 'generated-artifacts/more-urdu-mobile.png', fullPage: true });
  await page.reload();
  await expect(page.getByTestId('switch-language-ur')).toHaveAttribute('aria-pressed', 'true');
  await page.getByTestId('btn-open-settings').click();
  await expect(page.getByTestId('switch-language-ur')).toBeVisible();
  await page.getByTestId('switch-language-en').click();
  await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
  await page.getByTestId('nav-more').click();
  await expect(page.getByTestId('btn-open-settings')).toHaveText('Settings');
  await noOverflow(page);
  await page.screenshot({ path: 'generated-artifacts/more-english-mobile.png', fullPage: true });
});

test('four-step order with measurements receives next DK number and survives reload', async ({ page }) => {
  await seed(page);
  await openFullForm(page);
  await page.getByTestId('input-name').fill('New QA Customer');
  await page.getByTestId('input-phone').fill('03009876543');
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
  await page.getByTestId('input-delivery').fill(tomorrow.toLocaleDateString('en-CA', { timeZone: 'Asia/Karachi' }));
  await page.getByTestId('input-fabric').fill('Blue cotton');
  await nextStep(page);
  await page.getByTestId('input-unit-price').fill('3000');
  for (const input of await page.locator('[data-testid^="input-m-"]').all()) await input.fill('20');
  await nextStep(page);
  await nextStep(page);
  await page.getByTestId('btn-save-order').click();
  await expect(page.getByText('New QA Customer', { exact: true }).first()).toBeVisible();
  expect((await saved(page)).find((o: any) => o.customerName === 'New QA Customer').serialNumber).toBe('DK-008');
  await page.reload();
  await expect(page.getByText('New QA Customer', { exact: true }).first()).toBeVisible();
});

test('edit and every status, including overdue delivered', async ({ page }) => {
  await seed(page);
  await page.getByTestId('btn-overflow-qa-order').click();
  await page.getByTestId('btn-edit-qa-order').click();
  await page.getByTestId('input-name').fill('Edited QA Customer');
  for (let i = 0; i < 3; i++) await nextStep(page);
  await page.getByTestId('btn-save-order').click();
  await expect.poll(async () => (await saved(page))[0].customerName).toBe('Edited QA Customer');
  for (const state of ['stitching', 'ready', 'delivered', 'pending']) {
    await page.getByTestId('status-qa-order').click();
    await page.getByTestId(`status-option-${state}`).click();
    await expect.poll(async () => (await saved(page))[0].status).toBe(state);
    await expect(page.getByRole('menu')).toHaveCount(0);
  }
  await page.getByTestId('status-qa-order').click();
  await page.getByTestId('status-option-delivered').click();
  await expect(page.getByTestId('card-order-qa-order')).not.toContainText('3 days late');
});

test('partial cash then full Zindigi payment updates balance and digital share', async ({ page }) => {
  await seed(page);
  await page.getByTestId('btn-payment-qa-order').click();
  await page.getByTestId('input-payment-amount').fill('500');
  await page.getByTestId('btn-method-cash').click();
  await page.getByTestId('btn-confirm-payment').click();
  await expect.poll(async () => (await saved(page))[0].advanceAmount).toBe(500);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByTestId('btn-payment-qa-order').click();
  await page.getByTestId('btn-pay-full').click();
  await page.getByTestId('btn-method-zindigi').click();
  await page.getByTestId('btn-confirm-payment').click();
  await expect(page.getByTestId('card-order-qa-order')).toContainText(/Paid|ادا شدہ/);
  const order = (await saved(page))[0];
  expect(order.advanceAmount).toBe(2500);
  expect(order.payments.map((p: any) => [p.method, p.amount])).toEqual([['cash', 500], ['zindigi', 2000]]);
  await page.getByTestId('nav-hisaab').click();
  await expect(page.getByText(/80(?:\.0)?%/).first()).toBeVisible();
});

test('receipt QR, thermal sizes and encoded Pakistani WhatsApp message', async ({ page }) => {
  await seed(page);
  await page.getByTestId('btn-receipt-qa-order').click();
  await expect(page.getByTestId('receipt-payment-block').locator('img')).toBeVisible();
  for (const size of ['58', '80', 'a4']) {
    await page.getByTestId(`paper-${size}`).click();
    await expect(page.getByTestId(`paper-${size}`)).toHaveAttribute('aria-checked', 'true');
  }
  const popupPromise = page.waitForEvent('popup');
  await page.getByTestId('btn-wa-receipt').click();
  const popup = await popupPromise;
  const link = popup.url();
  expect(link).toMatch(/(?:wa\.me\/|phone=)923001234567/);
  const text = new URL(link).searchParams.get('text');
  expect(text).toContain('Customer:');
  expect(text).not.toMatch(/[\u0600-\u06ff]/);
  expect(link).toMatch(/%[0-9A-F]{2}/i);
  await popup.close();
});

test('delete requires confirmation and Undo restores the same order', async ({ page }) => {
  await seed(page);
  await page.getByTestId('btn-overflow-qa-order').click();
  await page.getByTestId('btn-delete-qa-order').click();
  await expect(page.getByRole('alertdialog')).toBeVisible();
  await page.getByTestId('btn-confirm-delete').click();
  await expect(page.getByTestId('card-order-qa-order')).toHaveCount(0);
  await page.getByTestId('btn-undo-delete').click();
  await expect(page.getByTestId('card-order-qa-order')).toBeVisible();
  expect((await saved(page))[0].serialNumber).toBe('DK-007');
});

test('customer history reuses measurements in a new order', async ({ page }) => {
  await seed(page);
  await page.getByTestId('nav-customers').click();
  await expect(page).toHaveURL(/\/customers$/);
  await page.getByTestId('btn-customer-history').first().click();
  await expect(page).toHaveURL(/\/customers\/customer-923001234567$/);
  await page.getByRole('button', { name: /Copy|Use.*measurements|ناپ.*استعمال|ناپ.*کاپی/i }).first().click();
  await expect(page.getByTestId('input-name')).toHaveValue('QA Tailor Customer');
});

test('empty credit profile and scored demo profile', async ({ page }) => {
  await seed(page, { empty: true });
  await page.goto('/credit');
  await expect(page.getByTestId('credit-empty')).toBeVisible();
  await page.goto('/');
  await page.getByTestId('btn-load-demo').click();
  await page.goto('/credit');
  await expect(page.getByTestId('credit-empty')).toHaveCount(0);
  await expect(page.getByTestId('text-credit-band')).toBeVisible();
});

test('PIN survives reload, rejects wrong PIN, unlocks correct PIN', async ({ page }) => {
  await seed(page);
  await page.goto('/settings');
  await page.getByTestId('new-pin').fill('1234');
  await page.getByTestId('confirm-pin').fill('1234');
  await page.getByTestId('save-pin').click();
  await page.reload();
  await expect(page.getByTestId('unlock-pin')).toBeVisible();
  await page.getByTestId('unlock-pin').fill('9999');
  await page.getByTestId('unlock-submit').click();
  await expect(page.getByRole('alert')).toBeVisible();
  await page.getByTestId('unlock-pin').fill('1234');
  await page.getByTestId('unlock-submit').click();
  await expect(page.getByTestId('unlock-pin')).toHaveCount(0);
});

test('backup export and restore preserve orders and next serial', async ({ page }) => {
  await seed(page);
  await page.goto('/settings');
  const before = await saved(page);
  const downloadPromise = page.waitForEvent('download');
  await page.getByTestId('btn-export').click();
  const download = await downloadPromise;
  const backupFile = await download.path();
  expect(backupFile).toBeTruthy();
  // Clear this test context only, then exercise the real restore UI.
  await page.evaluate(key => localStorage.setItem(key, '[]'), ordersKey);
  await page.reload();
  await page.locator('input[type="file"][accept*="json"]').setInputFiles(backupFile!);
  await page.getByTestId('btn-confirm-restore').click();
  await expect.poll(async () => (await saved(page)).length).toBe(before.length);
  expect((await saved(page))[0].serialNumber).toBe('DK-007');
  expect(await page.evaluate(key => Number(localStorage.getItem(key)), `darzi-khata-serial-${owner}`)).toBeGreaterThanOrEqual(7);
});

test('encrypted backup rejects wrong passphrase and damaged file before confirmed restore', async ({ page }) => {
  await seed(page);
  await page.goto('/settings');
  // The fixture is intentionally legacy data. Wait for normal startup migration
  // before taking the immutable-data baseline for the decryption failure checks.
  await expect.poll(async () => {
    const order = (await saved(page))[0];
    return !!order?.customerId && Array.isArray(order.items) && Array.isArray(order.payments);
  }).toBe(true);
  const before = await saved(page);
  const passphrase = 'unique test backup phrase';
  await page.getByTestId('btn-export-encrypted').click();
  await page.getByTestId('input-backup-passphrase').fill(passphrase);
  await page.getByTestId('input-backup-confirm').fill('does not match');
  await page.getByTestId('btn-submit-passphrase').click();
  await expect(page.getByRole('alert')).toContainText('do not match');
  await page.getByTestId('input-backup-confirm').fill(passphrase);
  const downloadPromise = page.waitForEvent('download');
  await page.getByTestId('btn-submit-passphrase').click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toContain('encrypted-backup');
  const backupFile = (await download.path())!;
  const contents = await readFile(backupFile, 'utf8');
  expect(contents).not.toContain('QA Tailor Customer');
  expect(contents).not.toContain('passwordHash');
  const envelope = JSON.parse(contents);
  expect(envelope.cipher).toBe('AES-256-GCM');
  await expect(page.getByTestId('backup-passphrase-form')).toHaveCount(0);

  const upload = page.locator('input[type="file"][accept*="json"]');
  await upload.setInputFiles(backupFile);
  await page.getByTestId('input-backup-passphrase').fill('incorrect backup phrase');
  await page.getByTestId('btn-submit-passphrase').click();
  await expect(page.getByRole('alert')).toContainText('wrong passphrase or damaged file');
  await expect(page.getByTestId('input-backup-passphrase')).toHaveValue('');
  await expect(page.getByTestId('btn-confirm-restore')).toHaveCount(0);
  expect(await saved(page)).toEqual(before);

  // Authentic decryption still requires the existing destructive-action confirmation.
  await page.getByTestId('input-backup-passphrase').fill(passphrase);
  await page.getByTestId('btn-submit-passphrase').click();
  await expect(page.getByTestId('btn-confirm-restore')).toBeVisible();
  expect(await saved(page)).toEqual(before);
  await page.getByRole('button', { name: /^Cancel/ }).click();
  expect(await saved(page)).toEqual(before);

  const bytes = Buffer.from(envelope.ciphertext, 'base64');
  bytes[bytes.length - 1] ^= 1;
  await upload.setInputFiles({ name: 'damaged.json', mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify({ ...envelope, ciphertext: bytes.toString('base64') })) });
  await page.getByTestId('input-backup-passphrase').fill(passphrase);
  await page.getByTestId('btn-submit-passphrase').click();
  await expect(page.getByRole('alert')).toContainText('wrong passphrase or damaged file');
  expect(await saved(page)).toEqual(before);
  await page.getByTestId('btn-cancel-passphrase').click();
  await expect(page.getByTestId('backup-passphrase-form')).toHaveCount(0);

  await page.evaluate(key => localStorage.setItem(key, '[]'), ordersKey);
  await page.reload();
  await upload.setInputFiles(backupFile);
  await page.getByTestId('input-backup-passphrase').fill(passphrase);
  await page.getByTestId('btn-submit-passphrase').click();
  expect(await saved(page)).toEqual([]);
  await page.getByTestId('btn-confirm-restore').click();
  await expect.poll(async () => (await saved(page)).length).toBe(before.length);
  expect((await saved(page))[0].serialNumber).toBe('DK-007');
  expect(await page.evaluate(key => Number(localStorage.getItem(key)), `darzi-khata-serial-${owner}`)).toBeGreaterThanOrEqual(7);
  const browserData = await page.evaluate(() => JSON.stringify({ local: { ...localStorage }, session: { ...sessionStorage } }));
  expect(browserData).not.toContain(passphrase);
  await page.reload();
  expect((await saved(page))[0].serialNumber).toBe('DK-007');
  await page.setViewportSize({ width: 360, height: 844 });
  await page.getByTestId('btn-lang-ur').click();
  await page.getByTestId('toggle-dark-mode').click();
  await page.getByTestId('btn-export-encrypted').click();
  await noOverflow(page);
  await expect(page.getByTestId('input-backup-passphrase')).toHaveValue('');
  await page.getByTestId('input-backup-passphrase').fill('cancelled memory only');
  await page.getByTestId('btn-cancel-passphrase').click();
  await page.getByTestId('btn-export-encrypted').click();
  await expect(page.getByTestId('input-backup-passphrase')).toHaveValue('');
});

test('all full pages fit at 360px in dark Urdu-first mode', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 844 });
  await seed(page, { urdu: true, dark: true });
  for (const path of ['/', '/customers', '/hisaab', '/more', '/settings', '/credit', '/work-sheet']) {
    await page.goto(path);
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(page.locator('html')).toHaveClass(/dark/);
    await noOverflow(page);
    expect(await page.getByText(/Something went wrong|کچھ غلط/).count()).toBe(0);
  }
});

test('production PWA reloads and saves an order offline', async ({ page, context }) => {
  test.skip(!process.env.E2E_PRODUCTION, 'Requires production build and service worker. Run against the static production preview.');
  await seed(page);
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await page.reload();
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByTestId('nav-new')).toBeVisible();
  await openFullForm(page);
  await page.getByTestId('input-name').fill('Offline QA Customer');
  await page.getByTestId('input-phone').fill('03009876543');
  await page.getByTestId('input-fabric').fill('Offline cotton');
  await nextStep(page);
  await page.getByTestId('input-unit-price').fill('2000');
  await nextStep(page);
  await nextStep(page);
  await page.getByTestId('btn-save-order').click();
  await expect(page.getByText('Offline QA Customer', { exact: true }).first()).toBeVisible();
});
