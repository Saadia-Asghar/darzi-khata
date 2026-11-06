import { test as base, expect } from '@playwright/test';
export type { Page } from '@playwright/test';
// Legacy app regression journeys now live below /app. Public landing and
// share-link tests import Playwright directly and retain the public root.
export const test = base.extend({
  page: async ({ page }, use) => {
    const goto = page.goto.bind(page);
    page.goto = (url, options) => goto(url.startsWith('/') && !url.startsWith('/app')
      ? `/app${url === '/' ? '' : url}` : url, options);
    await use(page);
  },
});
export { expect };
