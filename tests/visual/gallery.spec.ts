import { test, expect } from '@playwright/test';

test('gallery page screenshot', async ({ page }) => {
  await page.goto('/gallery');

  // Scroll to bottom so all client:visible islands enter the viewport and
  // hydrate before we capture. Without this, sections below the fold may
  // render as their server-side skeleton only.
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForLoadState('networkidle');

  // Wait for the gallery heading to be visible — this is a real content
  // sentinel that confirms the page has painted, replacing the former
  // waitForTimeout(500) which introduced flakiness on slow CI runners.
  await expect(page.locator('h1, h2').first()).toBeVisible();

  // Freeze animations and transitions so the screenshot is fully deterministic.
  // Also hide the text cursor so it doesn't appear mid-blink.
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation: none !important;
        transition: none !important;
        caret-color: transparent !important;
      }
    `,
  });

  await expect(page).toHaveScreenshot('gallery.png', {
    fullPage: true,
    maxDiffPixelRatio: 0.02,
  });
});
