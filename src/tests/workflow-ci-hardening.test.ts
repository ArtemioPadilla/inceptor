/**
 * Validates the CI hardening criteria from issue #168.
 *
 * Tests read workflow files as text — no runtime GitHub Actions dependency.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect } from 'vitest';

const CI_PATH = resolve(process.cwd(), '.github/workflows/ci.yml');
const ci = readFileSync(CI_PATH, 'utf-8');

describe('ci.yml — CI hardening (#168)', () => {
  // -------------------------------------------------------------------------
  // actionlint job
  // -------------------------------------------------------------------------
  it('has an actionlint job', () => {
    expect(ci).toContain('actionlint');
  });

  it('actionlint binary download is SHA-pinned (sha256sum check)', () => {
    // The step must verify the downloaded binary checksum, not just download it.
    expect(ci).toContain('sha256sum');
    expect(ci).toContain('--check');
  });

  it('actionlint version is explicitly specified (not mutable @main)', () => {
    // Must pin a specific version string like 1.7.12
    expect(ci).toMatch(/ACTIONLINT_VERSION="[\d.]+"/);
  });

  it('scans for unpinned mutable action refs', () => {
    // The grep step that catches `uses: owner/repo@branch` patterns.
    expect(ci).toContain('unpinned third-party action refs');
  });

  // -------------------------------------------------------------------------
  // astro check degradation path
  // -------------------------------------------------------------------------
  it('documents the CHECK_SKIP_ASTRO escape hatch', () => {
    expect(ci).toContain('CHECK_SKIP_ASTRO');
  });

  it('falls back to tsc --noEmit when CHECK_SKIP_ASTRO=1', () => {
    expect(ci).toContain('type-check');
  });

  it('emits a ::warning:: annotation when fallback is active', () => {
    expect(ci).toContain('::warning::');
  });

  // -------------------------------------------------------------------------
  // Lighthouse / axe deferral is documented (not silently missing)
  // -------------------------------------------------------------------------
  it('explains why Lighthouse budgets are deferred to staging URL', () => {
    expect(ci).toMatch(/lighthouse/i);
    expect(ci).toMatch(/flaky|staging|preview/i);
  });

  it('documents that axe a11y runs in visual.yml (no duplicate)', () => {
    expect(ci).toMatch(/axe/i);
    expect(ci).toContain('visual.yml');
  });

  // -------------------------------------------------------------------------
  // Existing jobs are not broken
  // -------------------------------------------------------------------------
  it('still contains the build job', () => {
    expect(ci).toContain('name: Build & Check');
  });

  it('still contains server-node and server-flask jobs', () => {
    expect(ci).toContain('server-node');
    expect(ci).toContain('server-flask');
  });
});
