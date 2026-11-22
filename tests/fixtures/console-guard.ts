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
 * ALLOWLIST: lives in ./console-allowlist.ts (pure + unit-tested). Add patterns
 * there when a third-party emits known, harmless noise.
 */

import { test as base, expect } from '@playwright/test';
import { describeConsoleMessage, isAllowed } from './console-allowlist';

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
          // Include the source URL: network failures only carry it there, and
          // it makes a failing report say which resource broke.
          const text = describeConsoleMessage(msg.text(), msg.location().url);
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
          `add a pattern to the ALLOWLIST in tests/fixtures/console-allowlist.ts:\n` +
          errors.join('\n'),
      ).toEqual([]);
    },
    { auto: true },
  ],
});

export { expect } from '@playwright/test';
