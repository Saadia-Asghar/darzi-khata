import { test, expect } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

const widths = [360, 375, 768, 1024, 1366, 1920];
for (const language of ['en', 'ur'] as const) for (const width of widths) {
  test(`compact demo ${language} ${width}`, async ({ page }) => {
    test.setTimeout(120_000);
    await mkdir('qa-screens/layout', { recursive: true });
    await page.goto('/');
    await expect(page.getByTestId('text-hero')).toBeVisible();
    await page.evaluate(language => {
      localStorage.setItem('darzi-khata-auth-lang', language);
      localStorage.setItem('darzi-khata-intro-seen-demo-account', 'true');
      // Only this isolated browser's demo preferences, never real shop data.
      for (const scope of ['demo-account', 'financial-demo-demo-account']) {
        const key = `darzi-khata-settings-${scope}`;
        localStorage.setItem(key, JSON.stringify({
          ...JSON.parse(localStorage.getItem(key) || '{}'), language, darkMode: false,
        }));
      }
    }, language);
    await page.setViewportSize({ width, height: width < 768 ? 812 : 800 });
    await page.goto('/app/login?demo=1');
    await expect(page.locator('[data-testid^="card-order-"]:visible').first()).toBeVisible();
    const measurements: unknown[] = [];
    for (const [name, path] of [
      ['orders', ''], ['more', '/more'], ['customers', '/customers'],
      ['hisaab', '/hisaab'], ['credit', '/credit'], ['impact', '/impact'],
      ['settings', '/settings'],
    ]) {
      await page.goto(`/app${path}`);
      await page.evaluate(() => document.fonts.ready);
      await expect(page.locator('html')).toHaveAttribute('dir', language === 'ur' ? 'rtl' : 'ltr');
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
      if (width >= 1024) {
        await expect(page.getByTestId('desktop-sidebar')).toBeVisible();
        await expect(page.getByTestId('nav-more')).not.toBeVisible();
      } else {
        await expect(page.getByTestId('nav-more')).toBeVisible();
      }
      if (name === 'orders') {
        const cards = page.locator('[data-testid^="card-order-"]:visible');
        const bounds = await cards.evaluateAll(nodes => nodes.map(el => {
          const r = el.getBoundingClientRect();
          return { top: r.top, bottom: r.bottom, height: r.height };
        }));
        const visible = bounds.filter(r => r.top >= 0 && r.bottom <= (width < 768 ? 812 - 64 : 800)).length;
        measurements.push({ name, bounds: bounds.slice(0, 10), visible });
        if (width === 375) expect(visible).toBeGreaterThanOrEqual(4);
        if (width === 1366) {
          expect(visible).toBeGreaterThanOrEqual(8);
          await expect(page.getByTestId('order-detail-aside')).toBeVisible();
        }
      }
      if (name === 'more') {
        const grid = page.getByTestId('settings-tile-grid');
        await expect(grid).toBeVisible();
        const columns = await grid.evaluate(el => getComputedStyle(el).gridTemplateColumns.split(' ').length);
        expect(columns).toBe(width < 768 ? 2 : width < 1024 ? 3 : 4);
      }
      // Consecutive content siblings must not be separated by giant blank gaps.
      const gaps = await page.locator('main').evaluateAll(mains => mains.flatMap(main =>
        [...main.querySelectorAll('*')].flatMap(parent => {
          const children = [...parent.children].filter(el => {
            const s = getComputedStyle(el), r = el.getBoundingClientRect();
            return r.width > 0 && r.height > 0 && s.position !== 'fixed' &&
              s.position !== 'absolute' && s.visibility !== 'hidden';
          });
          return children.slice(1).flatMap((el, i) => {
            const a = children[i].getBoundingClientRect(), b = el.getBoundingClientRect();
            // Only vertically stacked, non-overlay sibling blocks.
            return b.top >= a.bottom && b.left < a.right && b.right > a.left &&
              b.top - a.bottom > 96 ? [{ gap: b.top - a.bottom, parent: parent.className }] : [];
          });
        })));
      expect(gaps).toEqual([]);
      await page.screenshot({ path: `qa-screens/layout/${language}-${width}-${name}.png` });
    }
    await page.goto('/app');
    await page.getByTestId(width >= 1024 ? 'sidebar-new' : 'nav-new').click();
    await page.getByTestId('btn-new-full').click();
    await page.getByTestId('input-name').fill('Layout check only');
    await page.getByTestId('input-phone').fill('03001234567');
    await page.getByTestId('input-fabric').fill('Cotton');
    if (width < 1024) await page.getByTestId('btn-step-next').click();
    const measurementGrid = page.getByTestId('measurement-grid').first();
    await expect(measurementGrid).toBeVisible();
    await measurementGrid.scrollIntoViewIfNeeded();
    const clipped = await measurementGrid.evaluate(grid => {
      const box = grid.getBoundingClientRect();
      return [...grid.querySelectorAll('input,button')].filter(el => {
        const r = el.getBoundingClientRect();
        return r.width && (r.right > box.right + 2 || r.left < box.left - 2);
      }).map(el => el.getAttribute('data-testid') || el.getAttribute('aria-label'));
    });
    expect(clipped).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    await page.screenshot({ path: `qa-screens/layout/${language}-${width}-new-order.png` });
    await page.goto('/app/more');
    const version = await page.getByTestId('app-version').innerText();
    await writeFile(`qa-screens/layout/${language}-${width}-metrics.json`, JSON.stringify({ language, width, measurements, version }, null, 2));
    // A retained demo session must not hijack either public root or explicit Login.
    await page.goto('/');
    await expect(page.getByTestId('text-hero')).toBeVisible();
    await page.getByTestId('link-open-app').click();
    await expect(page.locator('input[type="password"]').first()).toBeVisible();
    await page.screenshot({ path: `qa-screens/layout/${language}-${width}-login.png` });
  });
}
