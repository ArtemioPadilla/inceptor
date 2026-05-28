import { test, expect } from '@playwright/test';

test('showcase page screenshot', async ({ page }) => {
  await page.goto('/showcase');

  // Scroll to bottom so all client:visible islands enter the viewport and
  // hydrate before we capture. Without this, sections below the fold may
  // render as their server-side skeleton only.
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500); // allow late hydration / CSS paint

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

  await expect(page).toHaveScreenshot('showcase.png', {
    fullPage: true,
    maxDiffPixelRatio: 0.02,
  });
});
