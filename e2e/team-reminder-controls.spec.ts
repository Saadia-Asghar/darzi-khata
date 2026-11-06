import { test, expect } from '@playwright/test';
import { DICT, type DictKey } from '../artifacts/darzi-khata/src/lib/i18n';

for (const width of [360, 390]) for (const language of ['en', 'ur'] as const) for (const dark of [false, true]) {
  test(`team, reminders and share controls ${width} ${language} ${dark}`, async ({ page }) => {
    test.setTimeout(90_000);
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await page.setViewportSize({ width, height: width === 360 ? 800 : 844 });
    const L = (key: DictKey) => DICT[key][language];
    await page.addInitScript(() => {
      const state = window as unknown as { qaClipboard: string; qaShare: unknown; qaOpen: string };
      Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async (text: string) => { state.qaClipboard = text; } } });
      Object.defineProperty(navigator, 'share', { configurable: true, value: async (data: unknown) => { state.qaShare = data; } });
      window.open = (url) => { state.qaOpen = String(url); return null; };
    });
    await page.goto('/');
    await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('darzi-khata-accounts') || '[]').some((a: {id: string}) => a.id === 'demo-account'))).toBe(true);
    await page.evaluate(({ language, dark }) => {
      sessionStorage.setItem('darzi-khata-session', 'demo-account');
      localStorage.setItem('darzi-khata-intro-seen-demo-account', 'true');
      localStorage.setItem('darzi-khata-settings-financial-demo-demo-account', JSON.stringify({
        shopName: 'Demo Tailors', language, darkMode: dark, phone: '03001234567',
      }));
    }, { language, dark });
    for (const route of ['/', '/customers', '/hisaab', '/credit', '/impact', '/reminders', '/settings']) {
      await page.goto(route);
      await expect(page.getByTestId('nav-more')).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
    }
    await page.goto('/team');
    await page.getByRole('button', { name: L('invite'), exact: true }).click();
    const inviteButtons = page.locator('[role="region"]').getByRole('button');
    await inviteButtons.nth(3).click();
    await expect.poll(() => page.evaluate(() => (window as unknown as {qaClipboard: string}).qaClipboard)).toBeTruthy();
    await inviteButtons.nth(4).click();
    await expect.poll(() => page.evaluate(() => (window as unknown as {qaShare: unknown}).qaShare)).toBeTruthy();
    await page.getByRole('button', { name: L('activity'), exact: true }).click();
    await page.getByRole('button', { name: L('t_remove_n').replace('{name}', 'Ustad Bashir'), exact: true }).click();
    await page.getByTestId('btn-confirm-remove-member').click();
    await page.goto('/team');
    await expect(page.getByRole('button', { name: L('t_remove_n').replace('{name}', 'Ustad Bashir'), exact: true })).toHaveCount(0);
    await page.getByRole('button', { name: L('add_karigar'), exact: true }).click();
    await page.getByRole('textbox', { name: L('karigar_email') }).fill('bashir@darzikhata.com');
    await page.getByRole('button', { name: L('search'), exact: true }).click();
    const add = page.locator('[role="region"]').getByRole('button');
    await add.last().click();
    await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('darzi-khata-accounts')!).find((a: {id:string}) => a.id === 'demo-bashir').ownerId)).toBe('demo-account');
    await page.goto('/reminders');
    await page.locator('[data-testid^="btn-remind-payment-"]').first().click();
    const url = await page.evaluate(() => (window as unknown as {qaOpen: string}).qaOpen);
    expect(url).toContain('wa.me/');
    expect(new URL(url).searchParams.get('text')).not.toMatch(/ \/ [^\n]*[\u0600-\u06ff]/);
    await page.goto('/more');
    await page.getByTestId('btn-share-app').click();
    await expect.poll(() => page.evaluate(() => (window as unknown as {qaShare: unknown}).qaShare)).toBeTruthy();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(errors).toEqual([]);
  });
}
