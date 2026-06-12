import { test, expect } from '@playwright/test';

test('dashboard page screenshot', async ({ page }) => {
  // Register the GitHub API mock BEFORE the first navigation so TanStack Query
  // sees deterministic data on the very first fetch. Without this the spec
  // depended on live network data, causing non-reproducible screenshots across
  // CI runs (the primary flake source caught in issue #175).
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

  await page.goto('/demos/dashboard');
  await page.waitForLoadState('networkidle');

  // Wait for a visible dashboard element rather than a fixed timeout — the
  // first visible KPI card means TanStack Query has settled and the island is
  // interactive. This replaces the former waitForTimeout(500) (#175).
  await expect(page.locator('[data-testid="kpi-card"], .kpi-card, main h1, main h2').first()).toBeVisible();

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
