/**
 * Console-guard fixture for Playwright tests.
 *
 * Collects browser console errors and uncaught page exceptions during a test
 * and fails the test at teardown if any unexpected errors occurred.
 *
 * WHY: Hydration mismatches, broken inline scripts, and failed ES module loads
 * all surface as `console.error` / `pageerror` events. This makes them visible
 * in CI without baselines and without render-diff flakiness.
 *
 * ALLOWLIST: Add patterns here when a third-party emits known, harmless noise.
 * Keep the list tight and always add a comment explaining *why* each entry exists.
 */

import { test as base, expect } from '@playwright/test';

/** Patterns that are allowed even if they appear as console errors. */
const ALLOWLIST: RegExp[] = [
  // GitHub API rate-limits unauthenticated requests in CI; the dashboard island
  // catches this and degrades gracefully, so the fetch-failure log is expected.
  /api\.github\.com.*rate limit/i,
  // Pagefind emits a 404 for its WASM worker on first load when the search
  // index hasn't been built yet (e.g. in smoke tests that skip `npm run build`).
  /pagefind.*404/i,
  /Failed to load resource.*pagefind/i,
];

/** Returns true when the message matches a known-harmless allowlist pattern. */
function isAllowed(message: string): boolean {
  return ALLOWLIST.some((pattern) => pattern.test(message));
}

/**
 * Extended `test` that:
 *  1. Attaches `console` + `pageerror` listeners before handing the page to
 *     the test body.
 *  2. After the test body completes, asserts that no unexpected errors were
 *     emitted. An unexpected error is any error not matched by ALLOWLIST.
 *
 * Usage in specs:
 *   import { test, expect } from '../fixtures/console-guard';
 */
export const test = base.extend<{ _consoleGuard: void }>({
  // Auto-use so every test that imports from this file gets the guard without
  // needing to request the fixture explicitly.
  _consoleGuard: [
    async ({ page }, use) => {
      const errors: string[] = [];

      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          const text = msg.text();
          if (!isAllowed(text)) {
            errors.push(`[console.error] ${text}`);
          }
        }
      });

      page.on('pageerror', (err) => {
        const text = String(err);
        if (!isAllowed(text)) {
          errors.push(`[pageerror] ${text}`);
        }
      });

      await use();

      expect(
        errors,
        `Browser console errors detected — if these are known noise, ` +
          `add a pattern to the ALLOWLIST in tests/fixtures/console-guard.ts:\n` +
          errors.join('\n'),
      ).toEqual([]);
    },
    { auto: true },
  ],
});

export { expect } from '@playwright/test';
