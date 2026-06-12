import { defineConfig, devices } from '@playwright/test';

// Allow overriding the preview port so developers with another Astro project
// already running on 4321 don't get a silent hang. Example:
//   PREVIEW_PORT=4399 npx playwright test
// See SETUP.md for docs on the port-busy scenario.
const PORT = Number(process.env.PREVIEW_PORT ?? 4321);

export default defineConfig({
  testDir: './tests/visual',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'on-first-retry',
  },
  // Screenshots live under tests/__screenshots__/{projectName}/{arg}{ext} so
  // light and dark baselines are separated by subdirectory and easy to find.
  snapshotPathTemplate: 'tests/__screenshots__/{projectName}/{arg}{ext}',
  expect: {
    toHaveScreenshot: {
      // Tight default — individual tests override when needed (e.g. charts).
      maxDiffPixelRatio: 0.01,
      animations: 'disabled',
    },
  },
  projects: [
    {
      name: 'chromium-light',
      use: { ...devices['Desktop Chrome'], colorScheme: 'light' },
    },
    {
      name: 'chromium-dark',
      use: { ...devices['Desktop Chrome'], colorScheme: 'dark' },
    },
  ],
  webServer: {
    // Playwright requires a built artifact; run `npm run build` before
    // `npm run test:visual` or `npm run test:visual:update`.
    command: `npm run preview -- --port ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
