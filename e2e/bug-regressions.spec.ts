import { test, expect, type Page } from './app-test';
import { mkdir, writeFile } from 'node:fs/promises';

export async function seedRegression(page: Page, language = 'en', dark = false) {
  await page.goto('/');
  await page.evaluate(({ language, dark }) => {
    const now = '2026-01-02T00:00:00Z';
    const measurements = { kameezLambai: 40, teera: 18, bazu: 24, gala: 15, chhaati: 22,
      kamar: 21, ghera: 23, shalwarLambai: 38, paincha: 7.5, asan: 16, shalwarGhera: 40 };
    localStorage.setItem('darzi-khata-accounts', JSON.stringify([{
      id: 'regression', name: 'Regression', email: 'regression@example.test', passwordHash: '',
      shopName: 'Test Tailors', role: 'owner', createdAt: now,
    }]));
    sessionStorage.setItem('darzi-khata-session', 'regression');
    localStorage.setItem('darzi-khata-intro-seen-regression', 'true');
    localStorage.setItem('darzi-khata-demo-mode-regression', 'false');
    localStorage.setItem('darzi-khata-settings-regression', JSON.stringify({
      shopName: 'Test Tailors', language, darkMode: dark, zindigiWallet: '03001234567',
    }));
    localStorage.setItem('darzi-khata-customers-regression', JSON.stringify(['A', 'B'].map(id => ({
      id, name: `Customer ${id}`, phone: '03001234567', notes: '', createdAt: now, updatedAt: now,
      profiles: [{ id: `profile-${id}`, name: 'Self', garmentType: 'gents',
        measurements: { ...measurements, teera: id === 'A' ? 18 : 20 } }],
    }))));
    localStorage.setItem('darzi-khata-orders-regression', JSON.stringify(['A', 'B'].map((id, i) => ({
      id, customerId: id, customerName: `Customer ${id}`, phone: '03001234567',
      orderDate: now, deliveryDate: '2026-12-10T00:00:00Z', createdAt: now, serialNumber: `DK-00${i + 1}`,
      urgent: false, suitCount: 1, fabric: 'Cotton', measurements: { ...measurements },
      items: [{ id: `item-${id}`, garmentType: 'gents', quantity: 1, unitPrice: 1500,
        measurements: { ...measurements, teera: id === 'A' ? 18 : 20 } }],
      collarType: 'Normal Collar', damanType: 'Choras (Square)', pockets: 'Front Pocket',
      cuffType: 'Simple', specialNotes: '', totalAmount: 1500, advanceAmount: 0, status: 'pending',
    }))));
  }, { language, dark });
  await page.reload();
  await expect(page.getByTestId('card-order-A')).toBeVisible();
}

test('BUG 1: print isolates the complete receipt and exports one A4 page', async ({ page }) => {
  await seedRegression(page);
  await page.getByTestId('btn-receipt-A').click();
  await expect(page.locator('#receipt-print-area img')).toBeVisible();
  await page.evaluate(() => { window.print = () => {}; });
  await page.getByTestId('btn-print-receipt').click();
  await page.emulateMedia({ media: 'print' });
  await expect(page.getByTestId('card-order-A')).not.toBeVisible();
  const root = page.locator('#dk-print-root');
  await expect(root).toContainText('DK-001');
  await expect(root).toContainText('Rs 1,500');
  await expect(root.locator('img')).toBeVisible();
  await mkdir('generated-artifacts/bugs', { recursive: true });
  await page.screenshot({ path: 'generated-artifacts/bugs/parchi-print.png', fullPage: true });
  const pdf = await page.pdf({ path: 'generated-artifacts/bugs/parchi.pdf', preferCSSPageSize: true });
  const pages = pdf.toString('latin1').match(/\/Type\s*\/Page\b/g) || [];
  expect(pages).toHaveLength(1);
  await page.evaluate(() => window.dispatchEvent(new Event('afterprint')));
  await expect(page.locator('body')).not.toHaveClass(/dk-printing/);
});

test('BUG 2: editing customer A never renames or changes customer B', async ({ page }) => {
  await seedRegression(page);
  await page.getByTestId('nav-customers').click();
  const b = page.getByTestId('row-customer-B');
  await expect(b).toContainText('Customer B');
  const before = await page.evaluate(() => ({
    customer: JSON.parse(localStorage.getItem('darzi-khata-customers-regression')!).find((c: {id:string}) => c.id === 'B'),
    order: JSON.parse(localStorage.getItem('darzi-khata-orders-regression')!).find((o: {id:string}) => o.id === 'B'),
  }));
  await page.getByTestId('row-customer-A').getByTestId('btn-edit-customer').click();
  await page.getByTestId('input-customer-name').fill('Edited A');
  await page.getByTestId('input-customer-notes').fill('Only A');
  await page.getByRole('button', { name: /Self/ }).click();
  await page.getByLabel('Shoulder', { exact: true }).fill('23');
  await page.getByTestId('btn-save-customer').click();
  await expect(page.getByTestId('input-customer-name')).not.toBeVisible();
  await page.getByTestId('row-customer-A').getByTestId('btn-customer-quick').click();
  await page.getByTestId('select-quick-garment').selectOption('ladies-shirt');
  await page.getByTestId('btn-quick-save').click();
  await expect(page.getByTestId('btn-quick-save')).not.toBeVisible();
  await page.goto('/');
  await page.getByTestId('btn-overflow-A').click();
  await page.getByTestId('btn-edit-A').click();
  await page.getByTestId('btn-step-next').click();
  await page.getByTestId('input-m-teera').fill('24');
  await page.getByRole('button', { name: 'Save template', exact: true }).click();
  await page.getByTestId('input-template-name').fill('A only template');
  await page.getByTestId('btn-save-named-template').click();
  await page.getByTestId('input-m-teera').fill('25');
  await page.getByRole('button', { name: 'Load template', exact: true }).click();
  await page.getByRole('button', { name: 'A only template', exact: true }).click();
  await expect(page.getByTestId('input-m-teera')).toHaveValue('24');
  await page.getByTestId('btn-step-next').click();
  await page.locator('#of-c').selectOption('Sherwani/Ban');
  await page.getByTestId('btn-step-next').click();
  await page.getByTestId('btn-save-order').click();
  await expect(page.getByTestId('btn-save-order')).not.toBeVisible();
  const after = await page.evaluate(() => ({
    customer: JSON.parse(localStorage.getItem('darzi-khata-customers-regression')!).find((c: {id:string}) => c.id === 'B'),
    order: JSON.parse(localStorage.getItem('darzi-khata-orders-regression')!).find((o: {id:string}) => o.id === 'B'),
  }));
  expect(JSON.stringify(after)).toBe(JSON.stringify(before));
});

for (const width of [360, 390]) for (const lang of ['en', 'ur']) for (const dark of [false, true]) {
  test(`mobile walkthrough ${width} ${lang} ${dark ? 'dark' : 'light'}`, async ({ page }) => {
    test.setTimeout(150_000);
    await page.setViewportSize({ width, height: width === 360 ? 800 : 844 });
    await seedRegression(page, lang, dark);
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    const evidence: { screen: string; controls: string[] }[] = [];
    async function check(screen: string) {
      await page.evaluate(() => document.fonts.ready);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), screen).toBe(true);
      const smallText = await page.locator('body').evaluate(body => [...body.querySelectorAll('*')].filter(el => {
        if (!el.textContent?.trim() || ![...el.childNodes].some(n => n.nodeType === 3 && n.textContent?.trim())) return false;
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 && getComputedStyle(el).visibility !== 'hidden' && parseFloat(getComputedStyle(el).fontSize) < 12;
      }).map(el => el.textContent?.slice(0, 80)));
      expect(smallText, screen).toEqual([]);
      expect(await page.locator('body').innerText(), screen).not.toMatch(/ \/ [^\n]*[\u0600-\u06ff]/);
      evidence.push({ screen, controls: await page.getByRole('button').allTextContents() });
      for (const dialog of await page.getByRole('dialog').all()) {
        const box = await dialog.boundingBox();
        expect(box!.height).toBeLessThanOrEqual(width === 360 ? 800 : 844);
      }
    }
    await check('orders');
    for (const route of ['customers', 'hisaab', 'more', 'credit', 'impact', 'reminders', 'team', 'worksheet', 'settings']) {
      await page.goto(`/${route}`);
      await expect(page.getByTestId(route === 'customers' ? 'btn-new-customer' : route === 'more' ? 'app-version' : 'nav-more')).toBeVisible();
      await check(route);
      if (route === 'customers') {
        await page.getByTestId('row-customer-A').getByTestId('btn-edit-customer').click();
        await check('customer editor');
        await page.getByTestId('btn-add-profile').click();
        await check('customer profile');
        await page.keyboard.press('Escape');
        await page.getByTestId('row-customer-A').getByTestId('btn-customer-history').click();
        await check('customer history');
      }
      if (route === 'settings') {
        await page.getByTestId('btn-save-settings').click();
        await page.goto('/settings');
        await check('saved settings');
      }
    }
    await page.goto('/');
    await page.getByTestId('btn-receipt-A').click();
    await check('parchi');
    for (const paper of ['58', '80', 'a4']) {
      await page.getByTestId(`paper-${paper}`).click();
      await check(`parchi ${paper}`);
    }
    await page.getByTestId('btn-close-receipt').click();
    await page.getByTestId('btn-payment-A').click();
    await check('payment dialog');
    for (const method of ['cash', 'zindigi', 'raast', 'bank']) {
      await page.getByTestId(`btn-method-${method}`).click();
      await expect(page.getByTestId(`btn-method-${method}`)).toHaveAttribute('aria-pressed', 'true');
    }
    await page.getByTestId('btn-pay-full').click();
    await page.keyboard.press('Escape');
    await page.getByTestId('nav-new').click();
    await page.getByTestId('btn-new-quick').click();
    await expect(page.getByTestId('input-quick-name')).toBeVisible();
    await check('quick order');
    await page.keyboard.press('Escape');
    await page.getByTestId('nav-new').click();
    await page.getByTestId('btn-new-full').click();
    await check('new order');
    await page.getByTestId('input-name').fill('Matrix order');
    await page.getByTestId('input-phone').fill('03007654321');
    await page.getByTestId('input-fabric').fill('Cotton');
    await page.getByTestId('btn-step-next').click();
    await check('measurements');
    for (const input of await page.locator('[data-testid^="input-m-"]').all()) {
      const before = await input.inputValue();
      await input.locator('..').getByRole('button').last().click();
      await input.locator('..').getByRole('button').first().click();
      await expect(input).toHaveValue(before);
    }
    await page.getByTestId('btn-add-item').click();
    await page.getByTestId('select-garment').selectOption('kids');
    await check('multiple garments');
    await page.getByTestId('btn-step-next').click();
    await check('style');
    await page.getByTestId('btn-step-next').click();
    await check('bill');
    await page.getByTestId('btn-save-order').click();
    await expect(page.getByTestId('btn-save-order')).not.toBeVisible();
    expect(errors).toEqual([]);
    await mkdir('generated-artifacts/bugs', { recursive: true });
    await writeFile(`generated-artifacts/bugs/walkthrough-${width}-${lang}-${dark}.json`, JSON.stringify(evidence, null, 2));
  });
}

test('BUG 3: customer validation contains only the chosen language', async ({ page }) => {
  await seedRegression(page);
  await page.getByTestId('nav-customers').click();
  await page.getByTestId('btn-new-customer').click();
  await page.getByTestId('btn-save-customer').click();
  await expect(page.getByRole('alert')).not.toContainText(/ \/ .*[\u0600-\u06ff]/);
});

for (const lang of ['en', 'ur']) for (const paper of ['58', '80']) {
  test(`thermal receipt ${paper}mm in ${lang} has the selected width and one full page`, async ({ page }) => {
    await seedRegression(page, lang);
    await page.getByTestId('btn-receipt-A').click();
    await expect(page.locator('#receipt-print-area img')).toBeVisible();
    await page.getByTestId(`paper-${paper}`).click();
    await page.evaluate(() => { window.print = () => {}; });
    await page.getByTestId('btn-print-receipt').click();
    await expect(page.locator('body')).toHaveClass(/dk-printing/);
    await page.emulateMedia({ media: 'print' });
    await expect(page.locator('#dk-print-root')).toHaveAttribute('dir', lang === 'ur' ? 'rtl' : 'ltr');
    const pdf = await page.pdf({ preferCSSPageSize: true });
    expect(pdf.toString('latin1').match(/\/Type\s*\/Page\b/g)).toHaveLength(1);
    const media = pdf.toString('latin1').match(/\/MediaBox\s*\[0 0 ([\d.]+) ([\d.]+)\]/);
    expect(media).toBeTruthy();
    expect(Math.abs(Number(media![1]) - Number(paper) * 72 / 25.4)).toBeLessThan(1);
    await mkdir('generated-artifacts/bugs', { recursive: true });
    await page.screenshot({ path: `generated-artifacts/bugs/parchi-${lang}-${paper}mm.png`, fullPage: true });
    await page.evaluate(() => window.dispatchEvent(new Event('afterprint')));
  });
}

test('worksheet and consented credit profile use the same isolated print root', async ({ page }) => {
  await seedRegression(page);
  await page.evaluate(() => { window.print = () => {}; });
  await page.goto('/worksheet');
  await page.evaluate(() => { window.print = () => {}; });
  await page.getByRole('button', { name: 'Print', exact: true }).click();
  await expect(page.locator('body')).toHaveClass(/dk-printing/);
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('#dk-print-root')).toContainText('Customer A');
  await expect(page.getByTestId('nav-more')).not.toBeVisible();
  await page.evaluate(() => window.dispatchEvent(new Event('afterprint')));
  await page.emulateMedia({ media: 'screen' });
  await page.goto('/settings');
  await page.getByTestId('switch-demo-mode').click();
  await page.goto('/credit');
  await page.getByTestId('btn-apply-zindigi').click();
  await page.getByTestId('checkbox-consent').check();
  await page.getByTestId('btn-create-profile').click();
  await page.evaluate(() => { window.print = () => {}; });
  await page.getByTestId('btn-print-profile').click();
  await expect(page.locator('body')).toHaveClass(/dk-printing/);
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('#dk-print-root')).toContainText('Test Tailors');
  await expect(page.getByTestId('nav-more')).not.toBeVisible();
  await page.evaluate(() => window.dispatchEvent(new Event('afterprint')));
});
