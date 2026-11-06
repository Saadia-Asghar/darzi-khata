import { test, expect } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

const dir = 'generated-artifacts/proof';
for (const language of ['en', 'ur'] as const) {
  test(`proof: five screens, WhatsApp and RTL in ${language}`, async ({ page }) => {
    await mkdir(dir, { recursive: true });
    const pageErrors: string[] = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    const snap = async (name: string) => {
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({ path: `${dir}/${language}-${name}.png`, animations: 'disabled' });
    };
    await page.goto('/');
    await page.getByTestId(`switch-language-${language}`).click();
    await expect(page.getByTestId('tab-login')).toBeVisible();
    if (language === 'ur') await expect(page.getByTestId('tab-login')).not.toContainText('Log in');
    await snap('login');
    await page.evaluate(language => {
      const owner = 'proof-owner';
      localStorage.setItem('darzi-khata-accounts', JSON.stringify([{
        id: owner, name: 'Test Owner', email: 'proof@example.test', passwordHash: '',
        shopName: 'Proof Tailors', role: 'owner', createdAt: new Date().toISOString(),
      }]));
      sessionStorage.setItem('darzi-khata-session', owner);
      const measurements = { kameezLambai: 40, teera: 18, bazu: 24, gala: 16, chhaati: 42,
        kamar: 40, ghera: 24, shalwarLambai: 40, paincha: 8, asan: 14, shalwarGhera: 28 };
      localStorage.setItem(`darzi-khata-orders-${owner}`, JSON.stringify([{
        id: 'proof-order', serialNumber: 'DK-007', customerName: 'Test customer',
        phone: '03001234567', orderDate: new Date().toISOString(),
        deliveryDate: '2026-11-10T00:00:00Z', createdAt: new Date().toISOString(),
        urgent: true, suitCount: 1, fabric: 'Cotton', measurements, status: 'pending',
        collarType: 'Normal Collar', damanType: 'Choras (Square)', pockets: 'Front Pocket',
        cuffType: 'Simple', specialNotes: '', totalAmount: 2500, advanceAmount: 500,
      }]));
      localStorage.setItem(`darzi-khata-settings-${owner}`, JSON.stringify({
        shopName: 'Proof Tailors', shopNameUrdu: 'آزمائشی درزی', phone: '03001234567',
        address: 'Shop 1', zindigiWallet: '03001234567', accountTitle: 'Test account',
        language, darkMode: false,
      }));
      localStorage.setItem(`darzi-khata-demo-mode-${owner}`, 'false');
      localStorage.setItem(`darzi-khata-intro-seen-${owner}`, 'true');
    }, language);
    await page.reload();
    await expect(page.getByTestId('card-order-proof-order')).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('dir', language === 'ur' ? 'rtl' : 'ltr');
    await snap('orders');
    await page.getByTestId('nav-new').click();
    await page.getByTestId('btn-new-full').click();
    await expect(page.getByTestId('input-name')).toBeVisible();
    await snap('new-order');
    await page.goto('/');
    await page.getByTestId('btn-receipt-proof-order').click();
    const receipt = page.getByTestId('receipt-dialog');
    await expect(receipt).toHaveAttribute('dir', language === 'ur' ? 'rtl' : 'ltr');
    await expect(page.locator('#receipt-print-area')).toContainText(language === 'en' ? 'Receipt no.' : 'رسید نمبر');
    await expect(page.locator('#receipt-print-area')).toContainText(language === 'en' ? 'Normal Collar' : 'عام کالر');
    await snap('parchi');
    const url = await page.getByTestId('btn-wa-receipt').getAttribute('href');
    expect(url).toBeTruthy();
    expect(url).toContain('923001234567');
    const message = new URL(url!).searchParams.get('text')!;
    expect(message).toContain(language === 'en' ? 'Customer: Test customer' : 'گاہک: Test customer');
    if (language === 'en') expect(message).not.toMatch(/[\u0600-\u06ff]/);
    else expect(message).not.toMatch(/Customer:|Reference:|Normal Collar|Pay online/);
    await writeFile(`${dir}/${language}-whatsapp.txt`, message);
    await page.goto('/settings');
    await expect(page.getByTestId('btn-page-back')).toBeVisible();
    await snap('settings');
    const arrowStyle = await page.getByTestId('btn-page-back').locator('svg').evaluate(node => {
      const style = getComputedStyle(node);
      return { transform: style.transform, rotate: style.rotate };
    });
    if (language === 'ur') expect(arrowStyle.rotate === '180deg' || /^matrix\(-1, 0, 0, -1,/.test(arrowStyle.transform)).toBe(true);
    else expect(arrowStyle.rotate === 'none' || arrowStyle.rotate === '0deg').toBe(true);
    await page.goto('/more');
    await expect(page.getByTestId('app-version')).toBeVisible();
    const version = await page.getByTestId('app-version').innerText();
    await page.getByTestId('app-version').screenshot({ path: `${dir}/${language}-version.png` });
    const chevron = page.getByTestId('btn-open-credit').locator('svg').last();
    const chevronStyle = await chevron.evaluate(node => {
      const style = getComputedStyle(node);
      return { transform: style.transform, rotate: style.rotate };
    });
    if (language === 'ur') expect(chevronStyle.rotate === '180deg' || /^matrix\(-1, 0, 0, -1,/.test(chevronStyle.transform)).toBe(true);
    await writeFile(`${dir}/${language}-checks.json`, JSON.stringify({
      language, version, documentDirection: await page.locator('html').getAttribute('dir'),
      receiptDirection: language === 'ur' ? 'rtl' : 'ltr',
      backArrow: arrowStyle, moreChevron: chevronStyle,
      whatsapp: message, pageErrors,
    }, null, 2));
    expect(pageErrors).toEqual([]);
  });
}
