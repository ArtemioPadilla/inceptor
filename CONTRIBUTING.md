# Contributing to inceptor

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

> ⚠️ **Initial baselines were captured on macOS** and may produce false-positive
> diffs against Ubuntu CI runners due to system font metric differences (~20–50px
> in total page height). The CI job is currently configured with
> `continue-on-error: true` (advisory mode). The fix is to refresh baselines from
> a Linux environment — see "Refresh baselines in CI's environment" below. Once
> baselines are platform-stable, remove the `continue-on-error` flag in
> `.github/workflows/visual.yml` to turn the gate back on.

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

### Refresh baselines in CI's environment (Linux)

The Playwright project ships a Docker image matching the CI runner. The
one-shot:

```bash
npm run refresh-baselines
```

That's a wrapper around `scripts/refresh-baselines.sh` which pulls the
Docker image, runs `npm ci && npm run build && npx playwright test --update-snapshots`
under the container, and prints next-step guidance.

Manual equivalent (in case Docker isn't available on PATH):

```bash
docker run --rm \
  -v "$(pwd):/work" -w /work \
  -e CI=true \
  mcr.microsoft.com/playwright:v1.60.0-noble \
  sh -c "npm ci && npm run build && npx playwright test --update-snapshots"
git add tests/__screenshots__/
git commit -m "test(visual): refresh baselines (linux)"
```

After this, the macOS/Linux differential disappears and the CI gate becomes
trustworthy enough to flip back to a hard fail.

### First-time local setup

If Playwright's Chromium browser is not yet installed on your machine:

```bash
npx playwright install --with-deps chromium
```

CI runs this step automatically (see `.github/workflows/visual.yml`).
