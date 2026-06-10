import { test, expect, devices } from '@playwright/test';

/**
 * Mobile viewport smoke (audit §2 — "not verified" gap). Asserts the three
 * highest-traffic routes render without horizontal overflow at a phone
 * viewport and keep the primary nav reachable. Uses an explicit viewport
 * instead of a separate Playwright project so it runs inside the existing
 * chromium-light/dark projects.
 */
const PHONE = devices['iPhone 12'].viewport; // 390×844

const routes = ['/', '/gallery/', '/docs/'];

for (const route of routes) {
  test(`mobile ${route} — no horizontal overflow, nav reachable`, async ({ page }) => {
    await page.setViewportSize(PHONE);
    await page.goto(route);
    await page.waitForLoadState('networkidle');

    const overflow = await page.evaluate(() => {
      const doc = document.documentElement;
      return doc.scrollWidth - doc.clientWidth;
    });
    expect(
      overflow,
      `${route} must not scroll horizontally at ${PHONE.width}px (overflow: ${overflow}px)`,
    ).toBeLessThanOrEqual(1); // allow a 1px rounding artifact

    // Primary nav links stay reachable on phones.
    await expect(page.locator('header a[href*="gallery"]').first()).toBeVisible();
  });
}
