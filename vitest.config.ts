import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
    // Globals: true gives RTL automatic afterEach cleanup (it hooks via
    // global `afterEach`). Without this, multiple `render()` calls in the
    // same test file leak DOM into each other.
    globals: true,
    // Default to node for the source-text + schema tests.
    // Behavior tests (RTL render tests) opt in to jsdom via `// @vitest-environment jsdom`
    // pragma at the top of the file. This keeps the fast tests fast.
    environment: 'node',
    environmentMatchGlobs: [
      // .tsx tests use React Testing Library by convention → jsdom
      ['src/**/*.test.tsx', 'jsdom'],
      // Behavior tests live under tests/behavior/ → jsdom regardless of extension
      ['src/**/behavior/*.test.{ts,tsx}', 'jsdom'],
    ],
    setupFiles: ['./vitest.setup.ts'],
  },
});
