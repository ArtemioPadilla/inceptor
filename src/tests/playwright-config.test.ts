import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Resolve a path relative to the repo root. The test file sits at
// src/tests/playwright-config.test.ts, so we step up two levels.
function rel(p: string): string {
  return fileURLToPath(new URL('../../' + p, import.meta.url));
}

describe('Playwright setup', () => {
  it('playwright.config.ts exists', () => {
    expect(existsSync(rel('playwright.config.ts'))).toBe(true);
  });

  it('declares a webServer so CI knows how to start the Astro preview server', () => {
    const cfg = readFileSync(rel('playwright.config.ts'), 'utf-8');
    expect(cfg).toMatch(/webServer/);
    expect(cfg).toMatch(/npm run preview/);
  });

  it('snapshots both chromium-light and chromium-dark projects', () => {
    const cfg = readFileSync(rel('playwright.config.ts'), 'utf-8');
    expect(cfg).toMatch(/chromium-light/);
    expect(cfg).toMatch(/chromium-dark/);
  });

  it('has visual specs for /gallery and /demos/dashboard', () => {
    expect(existsSync(rel('tests/visual/gallery.spec.ts'))).toBe(true);
    expect(existsSync(rel('tests/visual/dashboard.spec.ts'))).toBe(true);
  });

  it('CONTRIBUTING.md documents the baseline-update flow', () => {
    expect(existsSync(rel('CONTRIBUTING.md'))).toBe(true);
    const md = readFileSync(rel('CONTRIBUTING.md'), 'utf-8');
    // Either the npm script alias or the raw flag is acceptable evidence.
    expect(md).toMatch(/test:visual:update|--update-snapshots/);
  });

  it('baseline screenshot directories exist for both light and dark', () => {
    // Baselines themselves may be absent during a refresh cycle (the visual
    // workflow runs with `continue-on-error: true` until Linux baselines are
    // re-snapshotted in Docker — see CONTRIBUTING.md). What we DO require is
    // that the directory structure is in place.
    expect(existsSync(rel('tests/__screenshots__/chromium-light'))).toBe(true);
    expect(existsSync(rel('tests/__screenshots__/chromium-dark'))).toBe(true);
  });
});
