---
title: Visual regression
description: Playwright snapshots in CI, refresh in matching Linux env.
---

Visual regression testing catches unintended visual changes before they reach
production. This scaffold uses Playwright for snapshot-based comparison.

## How it works

1. Playwright renders pages in a headless Chromium instance
2. Snapshots are stored in `tests/__screenshots__/`
3. The `visual.yml` CI workflow compares against stored snapshots on every PR
4. Any pixel-level difference blocks merge

The `visual.yml` workflow is **separate from the main CI** — it uses the same
Playwright runner but a different trigger (runs after `ci.yml` passes).

## Running locally

```bash
# Run visual regression tests (compare against stored snapshots)
npx playwright test --project=chromium tests/visual/

# Update snapshots after intentional visual changes
npx playwright test --update-snapshots --project=chromium tests/visual/
```

## Important: snapshot environment

**Snapshots must be generated in the same Linux environment as CI.** macOS and
Linux render fonts and subpixel antialiasing differently, which produces small but
consistent pixel differences that break comparisons.

Options for refreshing snapshots:

1. Push a branch with intentional visual changes → CI fails → download artifacts
   → overwrite local snapshots → commit
2. Run Playwright inside Docker with the same image as CI:
   ```bash
   docker run --rm -v $(pwd):/work -w /work mcr.microsoft.com/playwright:v1.50.0-jammy \
     npx playwright test --update-snapshots
   ```

## Configuring thresholds

`playwright.config.ts` sets a `threshold` per screenshot to allow minor
subpixel tolerance. Increase only when the rendering difference is intentional
and verified:

```ts
expect(page).toHaveScreenshot({ threshold: 0.05 }); // 5% pixel diff tolerance
```

## Visual vs ux:check

- **Visual regression** (`tests/__screenshots__/`) — catches *unintended* change
- **`npm run ux:check`** — catches *intentional* harm (dark patterns, contrast failures, motion violations)

These are separate gates. Both must pass on a PR that touches UI.

Full guide → [`CONTRIBUTING.md — Visual regression`](https://github.com/ArtemioPadilla/inceptor/blob/main/CONTRIBUTING.md#visual-regression)
