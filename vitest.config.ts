import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['packages/*/test/**/*.test.ts', 'apps/*/test/**/*.test.ts'],
    environment: 'node',
    // Every test file gets its own in-memory database.
    isolate: true,
    pool: 'forks',
  },
});
