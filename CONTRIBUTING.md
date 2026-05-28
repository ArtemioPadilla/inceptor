# Contributing to issue-driven-web-template

## Development workflow

1. Find or open a GitHub issue for the work you want to do.
2. Branch naming: `phase-N/issue-NNN-short-slug` (e.g. `phase-0/issue-001-upgrade-astro-5`).
3. Commit messages: Conventional Commits + issue ref (e.g. `feat(ui): add Button component (#6)`).
4. Open a PR that includes `Closes #N` in the body so the issue auto-closes on merge.
5. Every PR must pass `npm run build`, `npm run check`, and `npm run test` before merge.

## Running the unit tests

```bash
npm run test          # vitest only — excludes Playwright specs
npm run type-check    # tsc --noEmit
npm run check         # astro diagnostics
```

## Visual regression

`/showcase` and `/dashboard` are snapshotted by Playwright in both light and dark.
Baselines live under `tests/__screenshots__/{chromium-light,chromium-dark}/`.

The CI workflow at `.github/workflows/visual.yml` re-runs Playwright on every PR.
Any pixel diff beyond the configured threshold fails the build until you commit
refreshed baselines.

### Update baselines after an intentional visual change

```bash
npm run build
npm run test:visual:update
git add tests/__screenshots__/
git commit -m "test(visual): refresh baselines"
```

### Run visual tests without updating baselines

```bash
npm run build          # build is required; Playwright uses the preview server
npm run test:visual    # equivalent to: playwright test
```

### Why are some pixels noisy?

- **Chart rendering** has minor anti-aliasing variability between machines and
  OSes. The dashboard tolerance is set to `0.03` (3% pixel diff).
- **Network responses** are mocked in the dashboard test so the GitHub API
  data is stable and reproducible.
- **Animations and transitions** are disabled by a `<style>` tag injected
  before each screenshot capture, so no frames are caught mid-animation.

### First-time local setup

If Playwright's Chromium browser is not yet installed on your machine:

```bash
npx playwright install --with-deps chromium
```

CI runs this step automatically (see `.github/workflows/visual.yml`).
