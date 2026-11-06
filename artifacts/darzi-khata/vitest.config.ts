import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: {
    include: ['src/lib/**/*.vitest.ts'],
    environment: 'node',
    maxWorkers: 1,
  },
});
