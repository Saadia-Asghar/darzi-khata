import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: {
    include: ['src/lib/**/*.vitest.ts', 'src/lib/i18n.test.ts', 'src/lib/design-lint.test.ts'],
    environment: 'node',
    maxWorkers: 1,
  },
});
