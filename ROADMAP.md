# Roadmap

## Where we are (2026-05-28)

The Astro 5 + React 19 + shadcn/Base UI + TanStack + Tremor Raw + Motion +
`@vite-pwa/astro` integration is complete. `main` carries the 27-issue plan
from [`INTEGRATION-PLAN.md`](./INTEGRATION-PLAN.md) plus the `/goal` meta
cleanup (28 PRs total).

See [`README.md`](./README.md) for the user-facing pitch, [`CLAUDE.md`](./CLAUDE.md)
for the stack + workflow, and [`docs/COMPONENTS.md`](./docs/COMPONENTS.md)
for the contribution guide.

This file tracks **post-integration follow-ups**. Each item carries a
provenance pointer (PR #, rule, or file path) so the *why* doesn't decay.

Items are intentionally **not yet** GitHub issues. When you pick one up,
file it via the matching `.github/ISSUE_TEMPLATE/` form and link back to
the line here.

---

## Epic 1 — Make the visual gate real

The Playwright workflow is advisory (`continue-on-error: true`) until
baselines match the Linux CI environment.

- [ ] Refresh baselines in `mcr.microsoft.com/playwright:v1.60.0-noble`
      — see `CONTRIBUTING.md` → "Refresh baselines in CI's environment"
- [ ] Remove `continue-on-error: true` from
      `.github/workflows/visual.yml:30` once baselines are stable
- [ ] *(stretch)* Evaluate Percy / Chromatic if cross-platform drift
      becomes recurring

## Epic 2 — Performance verification

INTEGRATION-PLAN asked for Lighthouse ≥ 90, 60 fps scroll, <50 ms filter
latency, and zero theme-toggle flash on Slow 3G. We satisfied these by
design but never measured.

- [ ] Run Lighthouse on `/` and `/dashboard` — Perf ≥ 90 *(plan #017)*
- [ ] Profile `/data/large` scroll in Chrome DevTools — 60 fps *(plan #013)*
- [ ] Measure filter latency on `/data/large` — <50 ms input→render *(plan #013)*
- [ ] Throttle theme toggle to Slow 3G — confirm zero flash *(plan #005)*
- [ ] *(stretch)* Add a `lighthouse.json` budget file gating PRs in CI

## Epic 3 — ErrorBoundary coverage gaps

`<ErrorBoundary>` wraps 3 islands. ~14 others are unwrapped.

- [ ] Wrap `Showcase{Dialog,Dropdown,Tabs,Toast,Form}` — all in
      `src/components/islands/`
- [ ] Wrap `ShowcaseCharts`, `ShowcaseKpis`, `ShowcaseDataTable`,
      `ShowcaseErrorBoundary`, `ShowcasePWA`
- [ ] Wrap `LargeTable`, `QueryDemo`, `ThemeIndicator`
- [ ] Add a runtime ErrorBoundary test (render → throw → assert fallback
      markup + report URL contents)
- [ ] *(stretch)* Build a Vite/Astro plugin that auto-wraps every
      `client:*` island — satisfies #49's literal *"auto-applied via
      `astro.config.mjs`"* spec

## Epic 4 — Brand & PWA assets

- [ ] Replace `public/icons/pwa-512.svg` placeholder lettermark with real
      artwork
- [ ] Add `pwa-192.png` (older browsers prefer PNG)
- [ ] Add maskable icon variants
- [ ] Verify `theme_color` / `background_color` in `astro.config.mjs`
      match the final brand palette
- [ ] Add OG image + social meta tags (`<meta property="og:*">`)
- [ ] Add `favicon.ico` alongside the existing `favicon.svg`
- [ ] Add a `sitemap.xml` generator

## Epic 5 — Dependency hygiene

- [ ] Re-pin `@base-ui-components/react` from `1.0.0-rc.0` → stable when
      `1.0.0` ships *(see PR #16 notes)*
- [ ] Bump `tsconfig.json` `"ignoreDeprecations"` from `"5.0"` → `"6.0"`
      once project TS ≥ 6 — or drop `baseUrl` if `paths` works without it
      *(see PR #6 IDE-vs-project TS mismatch)*
- [ ] Track `tailwindcss-motion` peerDep compat with future Tailwind v4
      minors *(see PR #47 open question)*
- [ ] Replace `document.execCommand('copy')` in
      `src/components/common/FeedbackFAB.astro` with
      `navigator.clipboard.writeText` — pre-existing `npm run check` hint
- [ ] Resolve Recharts `Cell` deprecation in
      `src/components/ui/charts/donut-chart.tsx`
- [ ] Suppress / fix Recharts SSR `width/height -1` console warnings
      during build

## Epic 6 — Production readiness

Items overlap the original template-bootstrap roadmap; kept here so
template consumers see them in one place.

- [ ] **GitHub API auth** — token + server-side fetch for
      `DashboardIsland` and `IssuesList`; current 60 req/h unauth limit
      is too low for production
- [ ] Configure deployment target (Firebase / Vercel / Netlify)
- [ ] Set `ANTHROPIC_API_KEY` secret for the Claude triage workflow
- [ ] Update `repoSlug` in `src/components/common/FeedbackFAB.astro` to
      match the consuming repo
- [ ] Privacy-respecting analytics (Plausible / Umami)

## Epic 7 — Workflow & tooling

- [ ] Refine the centinela `React.createContext` grep to exclude
      `src/components/ui/` (compound-component intra-island Context is
      legitimate per CLAUDE.md rule scope)
- [ ] Promote `prometeo` / `forja` / `centinela` sub-agents to a generic
      IDD skill set so other repos can adopt the pattern without copying
      `.claude/agents/*.md`
- [ ] Add `.editorconfig`
- [ ] Add Prettier + a `format:check` step in CI

## Epic 8 — Scope intentionally trimmed in v1.0

- [ ] `<DataTable>` column pinning — mentioned in #25 description, not
      in acceptance criteria; deferred
- [ ] Evaluate TanStack Form as an alternative to the
      `react-hook-form` + `zod` wrapper in `src/components/ui/form.tsx`
- [ ] Tighten Slot semantics in `src/components/ui/button.tsx` and
      `cloneElement` in `src/components/ui/form.tsx` to match Radix
      `mergeProps` if prop conflicts surface

## Epic 9 — Feature backlog

Ideas surfaced during the integration but never started. Some carry over
from the original template ROADMAP.

- [ ] i18n — multi-language routing (es / en) via Astro
- [ ] Feature flags (env-aware beta/prod gating)
- [ ] Error monitoring beyond ErrorBoundary (Sentry / similar, opt-in)
- [ ] Contact form with email delivery
- [ ] Blog via Astro content collections
- [ ] Site search (Pagefind?)
- [ ] Newsletter signup

---

## Status legend

- `[ ]` — open / not started
- `[x]` — done; replace the line with the closing PR number and date

## Process

1. Pick an item.
2. File a GitHub issue via the matching `.github/ISSUE_TEMPLATE/` form.
3. Reference this roadmap line in the issue body for context.
4. Once the PR merges, edit this file: check the box and append the PR #.
