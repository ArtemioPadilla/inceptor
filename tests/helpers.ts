/**
 * Playwright test helpers shared across visual specs.
 *
 * CONVENTION (from issue #175 / mexico-weather lesson):
 *   E2E specs MUST NOT assert against repo-committed data snapshots. Their
 *   content can change via cron, not PR, so any spec that reads a live data
 *   file will break on the next refresh without any code change.
 *
 *   Use `mockDataRoutes` to replace same-origin data routes with deterministic
 *   fixture payloads before the first `page.goto()` call. Example:
 *
 *   ```ts
 *   import { mockDataRoutes } from '../helpers';
 *
 *   test('my spec', async ({ page }) => {
 *     await mockDataRoutes(page, {
 *       '/data/cities.json': [{ name: 'Guadalajara' }],
 *     });
 *     await page.goto('/search');
 *     // ...
 *   });
 *   ```
 */

import type { Page } from '@playwright/test';

type JsonValue = string | number | boolean | null | JsonValue[] | { [k: string]: JsonValue };

/**
 * Registers `page.route` intercepts that fulfill same-origin `**/data/*.json`
 * requests with deterministic fixture payloads.
 *
 * @param page     The Playwright `Page` object.
 * @param overrides Map of URL glob → JSON payload. Keys are matched via
 *                  Playwright's route glob (e.g. `**/data/cities.json`).
 */
export async function mockDataRoutes(
  page: Page,
  overrides: Record<string, JsonValue>,
): Promise<void> {
  for (const [urlPattern, payload] of Object.entries(overrides)) {
    await page.route(urlPattern, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(payload),
      }),
    );
  }
}
