import { test, expect } from '@playwright/test';

test('dashboard page screenshot', async ({ page }) => {
  await page.goto('/demos/dashboard');
  await page.waitForLoadState('networkidle');

  // Mock GitHub API responses before reloading so TanStack Query sees
  // deterministic data. Without this, real network calls make the screenshot
  // non-reproducible across CI runs.
  await page.route('https://api.github.com/repos/**/issues**', async (route) => {
    const url = new URL(route.request().url());
    const state = url.searchParams.get('state');

    const payload =
      state === 'open'
        ? [
            {
              id: 1,
              number: 1,
              title: 'Sample open issue',
              html_url: '#',
              state: 'open',
              user: { login: 'alice' },
              labels: [],
              created_at: '2026-01-01T00:00:00Z',
            },
            {
              id: 2,
              number: 2,
              title: 'Another open issue',
              html_url: '#',
              state: 'open',
              user: { login: 'bob' },
              labels: [{ id: 1, name: 'bug', color: 'd73a4a' }],
              created_at: '2026-01-02T00:00:00Z',
            },
          ]
        : [
            {
              id: 3,
              number: 3,
              title: 'Sample closed issue',
              html_url: '#',
              state: 'closed',
              user: { login: 'alice' },
              labels: [],
              created_at: '2025-12-15T00:00:00Z',
            },
          ];

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(payload),
    });
  });

  // Reload to trigger the mocked fetch; then wait for queries to settle.
  await page.reload();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);

  // Freeze animations/transitions to prevent chart anti-aliasing drift.
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation: none !important;
        transition: none !important;
        caret-color: transparent !important;
      }
    `,
  });

  await expect(page).toHaveScreenshot('dashboard.png', {
    fullPage: true,
    // Charts have minor anti-aliasing variability between runs; 3% is enough
    // headroom without hiding genuine regressions.
    maxDiffPixelRatio: 0.03,
  });
});
