import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  outputDir: './generated-artifacts/playwright/results',
  reporter: [['list'], ['html', { outputFolder: 'generated-artifacts/playwright/report', open: 'never' }]],
  timeout: 45_000,
  expect: { timeout: 8_000 },
  workers: 1,
  fullyParallel: false,
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:80',
    viewport: { width: 375, height: 812 },
    isMobile: true,
    hasTouch: true,
    locale: 'en-PK',
    timezoneId: 'Asia/Karachi',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    launchOptions: {
      executablePath: process.env.CHROME_PATH || '/repl/tools/bin/chromium',
      args: ['--no-sandbox', '--disable-dev-shm-usage'],
    },
  },
});
