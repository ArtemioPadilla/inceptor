# Performance playbook

## Measured baseline (2026-05-28, desktop preset, `npm run lighthouse`)

| Page | Performance | Accessibility | Best practices | SEO |
|---|---|---|---|---|
| `/` | 100 | 100 | 100 | 100 |
| `/gallery` | 100 | 95 | 100 | 100 |
| `/docs` | 100 | 100 | 100 | 100 |
| `/demos/dashboard` | 92 | 93 | 96 | 100 |

**Lighthouse criterion (Perf ≥ 90) — met on all pages** (min 92). The CI gate in
`.lighthouserc.json` asserts Perf/A11y ≥ 0.90 and BP/SEO ≥ 0.95 at `error`, plus
Core Web Vitals (CLS hard-fails > 0.1; FCP/LCP/TBT warn). The noisy
`unused-javascript` and `network-dependency-tree` preset audits are set to `warn`
— they're not part of our documented quality bar.

**Open follow-up:** `/demos/dashboard` accessibility is 93, below our 0.95
aspiration (Recharts SVG labelling is the likely cause). Tracked in ROADMAP
Epic 12. Until fixed, the A11y gate sits at 0.90.

The mechanical perf gates (Lighthouse CI, `.lighthouserc.json`) cover
synthetic Web Vitals. They don't cover three things you have to measure
by hand:

1. Smooth-scroll fps on the 50,000-row virtual table
2. Filter-input latency on the same table
3. Theme-toggle behavior under throttled networks

This playbook documents how to capture each one repeatably so the result
goes in a PR description as evidence, not as a vibe check.

## Setup

```bash
npm run build
npm run preview   # serves dist/ on http://localhost:4321
```

Open Chrome → DevTools → Performance panel. Use an incognito window so
extensions don't influence the trace.

## Probe 1 — 60 fps scroll on `/demos/data/large`

1. Open `http://localhost:4321/demos/data/large`
2. DevTools → Performance → ⚙️ → CPU throttling: 4× slowdown
3. Click Record, scroll the table top → bottom for ~5 seconds, stop recording
4. Read the **FPS meter** (top of the trace). Median should be ≥ 60 with no
   sustained drops below 30
5. Frames > 16.6 ms are highlighted red — count them. PR-ready evidence:
   "median 60 fps, 2 long frames at 18 ms during initial paint"

If you see sustained low fps, the typical culprits are:

- A non-virtualized list — check `LargeTable.tsx` is using `useVirtualizer`
- Recharts re-renders during scroll — they shouldn't be on this page
- Heavy `useMemo` recomputation — re-check dependency arrays

## Probe 2 — < 50 ms filter latency

1. Same page as Probe 1
2. DevTools → Performance → ⚙️ → CPU throttling: 4× slowdown
3. Click Record, type "a" in the global filter input, stop after the table
   re-renders
4. Find the input event in the timeline. Read **input → render commit** time
5. Should be < 50 ms with 50,000 rows under 4× throttling. The
   `react-virtual` window keeps the diff bounded; if you're hitting > 50 ms,
   the filter probably isn't memoized

## Probe 3 — Theme toggle on Slow 3G

1. DevTools → Network → Throttling: Slow 3G
2. Hard-reload `/`. The theme script runs synchronously before first paint
3. Watch for the dreaded white-on-dark "flash". There should be none —
   `is:inline` on the theme script in `BaseLayout.astro` guarantees it
4. Toggle the theme button. Should be instantaneous (a class-flip), not a
   visible repaint cascade

If a flash appears under Slow 3G, the theme script regressed. Check that
`BaseLayout.astro` still uses `<script is:inline>` at the top of `<head>`.

## What to put in the PR

The PR template's "Mechanical checks" section accepts a one-line summary
per probe:

> - [x] LH perf ≥ 90 desktop preset (CI: <link>)
> - [x] Scroll: median 60 fps, 2 long frames at 18 ms during initial paint
> - [x] Filter: 38 ms input→commit at 50 k rows, 4× CPU throttle
> - [x] Theme: no flash on Slow 3G hard-reload

Save the DevTools trace files to your local notes if you want history. Don't
commit them — they're ~5 MB and not reviewable.

## When to escalate

If you can't hit the budgets with the current pattern, file an issue with the
trace summary, the offending page, and the suspected hot path. Don't lower
the budgets to make CI green — that defeats the gate's purpose.
