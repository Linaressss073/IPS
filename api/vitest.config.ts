import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    root: './',
    include: ['**/*.spec.ts'],
    // Measures every source file, loaded or not, so the report is honest.
    coverage: { include: ['src/**/*.ts'], exclude: ['**/*.spec.ts', '**/*.fake.ts'] },
  },
});
