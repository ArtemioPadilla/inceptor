import { test, expect } from '@playwright/test';

/**
 * Pagefind smoke (audit §6.2 #1 — the behavioral test that would have caught
 * the silently-dead docs search). Runs against the production build, where
 * the postbuild Pagefind index exists. The bundle URL is BASE_URL-aware in
 * DocsSearch.astro; this exercises the wiring end-to-end for the build's
 * configured base. The subpath variant is covered by the same code path —
 * `import.meta.env.BASE_URL` — plus its source guard in wave1-fixes.test.ts.
 */
test('docs search returns results for a known term', async ({ page }) => {
  await page.goto('/docs/');
  const input = page.locator('#docs-search-input');
  await expect(input).toBeVisible();

  await input.click();
  await input.fill('ethics');

  const results = page.locator('#docs-search-results a');
  await expect(results.first()).toBeVisible({ timeout: 10_000 });
  expect(await results.count()).toBeGreaterThan(0);

  // Result links must stay inside the deployed base (no root-absolute leaks).
  const href = await results.first().getAttribute('href');
  expect(href, 'result href present').toBeTruthy();
});

test('global ⌘K palette opens and lists nav commands', async ({ page }) => {
  await page.goto('/gallery/');
  // GlobalSearch hydrates client:idle — Astro drops the `ssr` attribute once
  // the island is interactive. Pressing ⌘K before that is a silent no-op on
  // slow CI runners (the flake that shipped with the first version of this
  // test), so gate the keypress on hydration.
  await page.waitForSelector(
    'astro-island[component-url*="GlobalSearch"]:not([ssr])',
    { state: 'attached', timeout: 15_000 },
  );
  await page.keyboard.press('ControlOrMeta+k');
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible({ timeout: 10_000 });
  await expect(dialog.getByText('Gallery', { exact: false }).first()).toBeVisible();
});
