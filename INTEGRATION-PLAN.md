# INTEGRATION-PLAN.md — UI stack integration for inceptor

This is the canonical, machine-parsable source of truth for the integration of
the recommended UI stack (Recipe C: shadcn/ui + Base UI + Tailwind v4 + TanStack
+ Tremor Raw + Motion + @vite-pwa/astro) into this template.

**Read this file before starting any integration work. The `prometeo`, `forja`,
and `centinela` sub-agents read this file too.**

## Format

Every issue follows the same schema so `prometeo` can parse it programmatically:

```text
### Issue NNN — Title
**Phase**: N  | **Milestone**: vX.Y - Name  | **Labels**: phase-N, type:LABEL
**Branch**: phase-N/issue-NNN-slug
**Depends on**: #X, #Y  (or "none")
**Effort**: S | M | L

**Description**
What this does, and why.

**Acceptance criteria**
- [ ] Concrete check 1
- [ ] Concrete check 2

**Validation**
Commands centinela should run.
```

---

## Phase 0 — Pre-flight (stack modernization)

**Goal**: bring the base stack up to current versions so everything else can be
installed without conflicts. No new features. Hello World must look identical
after every PR.

**Milestone**: `v0.2 - Stack modernization`

### Issue 001 — chore: upgrade Astro 4.16 → 5.x

**Phase**: 0  | **Milestone**: v0.2 - Stack modernization  | **Labels**: phase-0, type:chore
**Branch**: phase-0/issue-001-upgrade-astro-5
**Depends on**: none
**Effort**: S

**Description**
Required for Tailwind v4, native View Transitions, Skew Protection, and the
React 19 ecosystem. Astro 5 is a major bump but the migration for this template
is mechanical (no content collections, no SSR adapters in use).

**Acceptance criteria**
- [ ] `npm ls astro` reports `5.x`
- [ ] `astro.config.mjs` updated for any breaking changes
- [ ] `npm run build` passes
- [ ] Hello World page renders identically (visual parity)

**Validation**
```bash
npx @astrojs/upgrade
npm run build
npm run check
```

### Issue 002 — chore: migrate Tailwind v3 → v4 via @tailwindcss/vite

**Phase**: 0  | **Milestone**: v0.2 - Stack modernization  | **Labels**: phase-0, type:chore
**Branch**: phase-0/issue-002-tailwind-v4
**Depends on**: #001
**Effort**: M

**Description**
Replace `@astrojs/tailwind` (deprecated for v4) with `@tailwindcss/vite`. Move
configuration from `tailwind.config.mjs` to CSS-first in `src/styles/global.css`
via the new `@theme` syntax.

**Acceptance criteria**
- [ ] `package.json` no longer lists `@astrojs/tailwind` or `tailwindcss@^3`
- [ ] `package.json` lists `tailwindcss@^4` and `@tailwindcss/vite@^4`
- [ ] `astro.config.mjs` registers the Vite plugin (not the integration)
- [ ] `tailwind.config.mjs` deleted
- [ ] `src/styles/global.css` exists with `@import "tailwindcss"` and theme tokens
- [ ] Hello World still renders identically

**Validation**
```bash
npm run build
npm run dev   # smoke test
```

### Issue 003 — chore: add @astrojs/react + path aliases

**Phase**: 0  | **Milestone**: v0.2 - Stack modernization  | **Labels**: phase-0, type:chore
**Branch**: phase-0/issue-003-react-and-aliases
**Depends on**: #002
**Effort**: S

**Description**
Add React 19 via `npx astro add react`. Configure the `@/*` path alias in
`tsconfig.json` (required by the shadcn CLI). Verify with a trivial React island.

**Acceptance criteria**
- [ ] `@astrojs/react`, `react`, `react-dom` in `package.json`
- [ ] `tsconfig.json` has `"baseUrl": "."` and `"paths": { "@/*": ["./src/*"] }`
- [ ] A `<HelloReact client:load />` island renders on the Hello World page
- [ ] `import { something } from "@/lib/utils"` resolves in TS

**Validation**
```bash
npm run check
npm run build
```

---

## Phase 1 — Component foundation (shadcn/ui + Base UI)

**Goal**: establish the component system that all other phases will build on.

**Milestone**: `v0.3 - Component system`

### Issue 004 — feat: bootstrap shadcn/ui with Base UI primitives

**Phase**: 1  | **Milestone**: v0.3 - Component system  | **Labels**: phase-1, type:feat
**Branch**: phase-1/issue-004-shadcn-init
**Depends on**: #003
**Effort**: M

**Description**
Run `npx shadcn@latest init`, choose **Base UI** primitives (not Radix). This
creates `src/components/ui/`, `src/lib/utils.ts` (with the `cn()` helper), and
seeds CSS variables in `src/styles/global.css`.

**Acceptance criteria**
- [ ] `components.json` at repo root with `style: "default"`, primitives: Base UI
- [ ] `src/lib/utils.ts` exports `cn()`
- [ ] `src/styles/global.css` has the full CSS-vars block (light + dark)
- [ ] `tailwind.config.mjs` recreated as `tailwind.config.ts` if shadcn requires it
- [ ] No regression on `npm run build`

**Validation**
```bash
npx shadcn@latest init   # choose Base UI when prompted
npm run build
```

### Issue 005 — feat: dark mode toggle (zero-flash)

**Phase**: 1  | **Milestone**: v0.3 - Component system  | **Labels**: phase-1, type:feat
**Branch**: phase-1/issue-005-dark-mode
**Depends on**: #004
**Effort**: M

**Description**
Add a dark-mode toggle. Use an inline `<script>` in the layout `<head>` that
reads `localStorage` and applies the `.dark` class BEFORE first paint
(zero-flash pattern). The toggle component itself is `.astro`, not React (no JS
runtime needed beyond a small handler).

**Acceptance criteria**
- [ ] `src/components/common/ThemeToggle.astro` exists
- [ ] Inline script in `BaseLayout.astro` applies theme before paint
- [ ] Toggle persists to `localStorage` under key `theme`
- [ ] Switching theme does not flash (test in dev tools with Slow 3G)
- [ ] `aria-label` and `aria-pressed` correct on the toggle button

**Validation**
```bash
npm run dev   # manual: toggle theme, hard-reload, confirm no flash
npm run build
```

### Issue 006 — feat: install base component set

**Phase**: 1  | **Milestone**: v0.3 - Component system  | **Labels**: phase-1, type:feat
**Branch**: phase-1/issue-006-base-components
**Depends on**: #004
**Effort**: M

**Description**
Add the components most pages will need:
`button input label card dialog dropdown-menu table badge tabs toast form`.

**Acceptance criteria**
- [ ] All listed components exist under `src/components/ui/`
- [ ] Each component compiles in isolation
- [ ] No `framer-motion` import anywhere
- [ ] No Radix imports anywhere (confirm with `grep -r '@radix-ui' src/`)

**Validation**
```bash
for c in button input label card dialog dropdown-menu table badge tabs toast form; do
  npx shadcn@latest add "$c" --yes
done
npm run build
grep -r '@radix-ui' src/ && echo "FAIL" || echo "PASS"
```

### Issue 007 — feat: /showcase page

**Phase**: 1  | **Milestone**: v0.3 - Component system  | **Labels**: phase-1, type:feat
**Branch**: phase-1/issue-007-showcase-page
**Depends on**: #006
**Effort**: M

**Description**
Render every component installed in #006 on a `/showcase` route. Serves as both
living documentation and a visual-regression target for future PRs.

**Acceptance criteria**
- [ ] `src/pages/showcase.astro` exists and lists all installed components
- [ ] Each component appears at least once in light and dark
- [ ] Page is accessible at `/showcase` after `npm run build`
- [ ] No console errors in dev tools when visiting the page

**Validation**
```bash
npm run build
npm run preview   # then visit http://localhost:4321/showcase
```

### Issue 008 — docs: component contribution guide

**Phase**: 1  | **Milestone**: v0.3 - Component system  | **Labels**: phase-1, type:docs
**Branch**: phase-1/issue-008-component-docs
**Depends on**: #007
**Effort**: S

**Description**
Document how to add new components, when to wrap multi-island compositions in a
single React file (the Astro+shadcn gotcha), and the rules for theming via CSS
vars.

**Acceptance criteria**
- [ ] `docs/COMPONENTS.md` exists
- [ ] Covers: adding a shadcn component, hydration directives, the compound-
      component gotcha, theming via CSS vars, dark-mode tokens
- [ ] Linked from `README.md`

---

## Phase 2 — State management

**Milestone**: `v0.4 - State`

### Issue 009 — feat: Nano Stores for cross-island state

**Phase**: 2  | **Milestone**: v0.4 - State  | **Labels**: phase-2, type:feat
**Branch**: phase-2/issue-009-nano-stores
**Depends on**: #005
**Effort**: M

**Description**
Install `nanostores` + `@nanostores/react`. Migrate the theme state (set up in
#005) to be a Nano Store so multiple islands can read/write it without React
Context.

**Acceptance criteria**
- [ ] `src/stores/theme.ts` exports `$theme` atom
- [ ] `ThemeToggle` reads/writes via the store
- [ ] An additional demo island (e.g., footer) reflects theme changes live
- [ ] No `React.createContext` anywhere in the repo

**Validation**
```bash
grep -r 'createContext' src/ && echo "FAIL" || echo "PASS"
npm run build
```

### Issue 010 — feat: TanStack Query + idb-keyval persister

**Phase**: 2  | **Milestone**: v0.4 - State  | **Labels**: phase-2, type:feat
**Branch**: phase-2/issue-010-tanstack-query
**Depends on**: #006
**Effort**: L

**Description**
Set up TanStack Query with an `AsyncStoragePersister` backed by `idb-keyval` for
offline caching. Provider is per-island (not global), to keep islands independent.

**Acceptance criteria**
- [ ] `@tanstack/react-query`, `@tanstack/query-persist-client-core`, `idb-keyval` installed
- [ ] `src/lib/queryClient.ts` exports a factory function
- [ ] `src/components/islands/QueryProvider.tsx` wraps a single island with the persister
- [ ] Opt-in pattern: queries set `meta: { persist: true }` to be persisted
- [ ] Persistence verified: IndexedDB shows entries under the expected key

**Validation**
```bash
npm run build
npm run dev   # manual: open IndexedDB devtools, verify cache appears
```

### Issue 011 — feat: example data island — GitHub Issues fetcher (dogfooding)

**Phase**: 2  | **Milestone**: v0.4 - State  | **Labels**: phase-2, type:feat
**Branch**: phase-2/issue-011-issues-fetcher
**Depends on**: #010
**Effort**: M

**Description**
Build a React island that lists open issues from this template's own repo using
the GitHub REST API. Demonstrates loading/error/empty states and optimistic
caching.

**Acceptance criteria**
- [ ] `src/components/islands/IssuesList.tsx` exists
- [ ] Shows loading skeleton, error state, empty state
- [ ] Cache persisted across reload
- [ ] Rendered on a `/data` demo page

---

## Phase 3 — Data-heavy components

**Milestone**: `v0.5 - Data grids`

### Issue 012 — feat: TanStack Table + Virtual integration

**Phase**: 3  | **Milestone**: v0.5 - Data grids  | **Labels**: phase-3, type:feat
**Branch**: phase-3/issue-012-tanstack-table
**Depends on**: #010
**Effort**: L

**Description**
Compose `@tanstack/react-table` and `@tanstack/react-virtual` on top of shadcn's
`<Table>` to build a generic `<DataTable columns data />` with sort, filter,
column pinning, and column resizing.

**Acceptance criteria**
- [ ] `src/components/ui/data-table.tsx` exports `<DataTable>`
- [ ] Supports: sort, global filter, column visibility, column resizing, row virtualization
- [ ] Typed via TypeScript generics so consumers get column type-safety
- [ ] Documented in `docs/COMPONENTS.md`

### Issue 013 — feat: 50k-row virtualization demo

**Phase**: 3  | **Milestone**: v0.5 - Data grids  | **Labels**: phase-3, type:feat
**Branch**: phase-3/issue-013-large-list-demo
**Depends on**: #012
**Effort**: M

**Description**
Add a `/data/large` page that renders 50,000 generated rows through `<DataTable>`.
Performance budget: <16ms per frame during scroll, <50ms input latency on filter.

**Acceptance criteria**
- [ ] Page renders 50,000 rows without freezing
- [ ] Scroll stays at ~60fps in Chrome devtools Performance tab
- [ ] Filter input responds within 50ms

### Issue 014 — feat: URL state sync for filters

**Phase**: 3  | **Milestone**: v0.5 - Data grids  | **Labels**: phase-3, type:feat
**Branch**: phase-3/issue-014-url-state
**Depends on**: #012
**Effort**: M

**Description**
Persist DataTable filter and sort state in `URLSearchParams` so views are
shareable and survive page refresh. Compatible with Astro view transitions.

**Acceptance criteria**
- [ ] Changing a filter updates the URL without a full reload
- [ ] Pasting a URL with state restores the table state
- [ ] Back/forward navigation works (browser history)

---

## Phase 4 — Dashboards & charts

**Milestone**: `v0.6 - Dashboards`

### Issue 015 — feat: Tremor Raw KPI components (copy-paste)

**Phase**: 4  | **Milestone**: v0.6 - Dashboards  | **Labels**: phase-4, type:feat
**Branch**: phase-4/issue-015-tremor-raw
**Depends on**: #006
**Effort**: M

**Description**
Copy the Tremor Raw components for `Card`, `Metric`, `ProgressBar`, `Tracker`,
`Callout`, `Divider` from <https://raw.tremor.so> into `src/components/ui/`.
**Do not install `@tremor/react`.**

**Acceptance criteria**
- [ ] Components live in `src/components/ui/` (no separate `tremor/` folder)
- [ ] No `@tremor/react` import anywhere
- [ ] Components themed via the same CSS vars as shadcn
- [ ] Showcase page includes each new component

**Validation**
```bash
grep -r '@tremor/react' src/ && echo "FAIL" || echo "PASS"
npm run build
```

### Issue 016 — feat: Recharts wrappers themed to shadcn CSS vars

**Phase**: 4  | **Milestone**: v0.6 - Dashboards  | **Labels**: phase-4, type:feat
**Branch**: phase-4/issue-016-recharts-wrappers
**Depends on**: #015
**Effort**: M

**Description**
Wrap Recharts (`LineChart`, `BarChart`, `AreaChart`, `DonutChart`) in
themed components that read `var(--chart-1)`…`var(--chart-5)` from CSS. Lazy-
load only on the `/dashboard` route.

**Acceptance criteria**
- [ ] `src/components/ui/charts/*.tsx` exports each wrapper
- [ ] Colors come from CSS vars (dark mode flips automatically)
- [ ] Recharts is dynamically imported (verify with `npm run build`'s chunk report)

### Issue 017 — feat: /dashboard demo page

**Phase**: 4  | **Milestone**: v0.6 - Dashboards  | **Labels**: phase-4, type:feat
**Branch**: phase-4/issue-017-dashboard-page
**Depends on**: #015, #016, #012
**Effort**: L

**Description**
Combine KPIs, charts, and a small DataTable on one page. Data source: the same
GitHub Issues fetcher from #011, aggregated into "issues by label", "issues by
month", "open vs closed".

**Acceptance criteria**
- [ ] `src/pages/dashboard.astro` renders an island with 3 KPIs + 2 charts + 1 table
- [ ] Lighthouse score ≥ 90 on Performance for the page
- [ ] Mobile layout works at 375px width

---

## Phase 5 — PWA + offline

**Milestone**: `v0.7 - Offline-first`

### Issue 018 — feat: @vite-pwa/astro

**Phase**: 5  | **Milestone**: v0.7 - Offline-first  | **Labels**: phase-5, type:feat
**Branch**: phase-5/issue-018-vite-pwa
**Depends on**: #017
**Effort**: M

**Description**
Install `@vite-pwa/astro`. Generate `manifest.webmanifest`, add app icons under
`public/icons/`, configure `registerType: 'autoUpdate'`, set up Workbox with
stale-while-revalidate for API routes.

**Acceptance criteria**
- [ ] `@vite-pwa/astro` registered in `astro.config.mjs`
- [ ] `manifest.webmanifest` generated in build output
- [ ] Service worker registered (verify in Chrome devtools → Application)
- [ ] App installable (✓ in Chrome's address bar)
- [ ] Lighthouse PWA checks pass

### Issue 019 — feat: offline indicator + retry UI

**Phase**: 5  | **Milestone**: v0.7 - Offline-first  | **Labels**: phase-5, type:feat
**Branch**: phase-5/issue-019-offline-ui
**Depends on**: #018
**Effort**: M

**Description**
Detect `navigator.onLine` changes. Show a non-intrusive banner when offline.
Wire failed TanStack Query calls to a "Retry" button that calls
`queryClient.invalidateQueries()`.

**Acceptance criteria**
- [ ] `OfflineBanner` island appears within 1s of going offline
- [ ] Failed queries show a Retry button that re-fetches when clicked
- [ ] No banner shown when online

### Issue 020 — feat: install + update prompts

**Phase**: 5  | **Milestone**: v0.7 - Offline-first  | **Labels**: phase-5, type:feat
**Branch**: phase-5/issue-020-pwa-prompts
**Depends on**: #018
**Effort**: M

**Description**
Handle `beforeinstallprompt` (custom install button) and the SW `updated` event
(toast with "Reload" CTA).

**Acceptance criteria**
- [ ] Install button appears once `beforeinstallprompt` fires
- [ ] After a deploy, returning users see an "Update available" toast
- [ ] Toast button reloads with the new SW active

---

## Phase 6 — Animation & transitions

**Milestone**: `v0.8 - Motion`

### Issue 021 — feat: native @view-transition for cross-page navigation

**Phase**: 6  | **Milestone**: v0.8 - Motion  | **Labels**: phase-6, type:feat
**Branch**: phase-6/issue-021-view-transitions
**Depends on**: #003
**Effort**: S

**Description**
Add `@view-transition { navigation: auto; }` to `global.css`. Annotate hero
elements with `view-transition-name`. Cross-document VT became Baseline Newly
Available in October 2025 (Firefox 144); for older browsers, keep the Astro
`<ClientRouter />` as a fallback only.

**Acceptance criteria**
- [ ] `@view-transition { navigation: auto; }` present in `global.css`
- [ ] At least one element has a `view-transition-name`
- [ ] Animation visible in supporting browsers, no breakage in older ones

### Issue 022 — feat: tailwindcss-motion utilities

**Phase**: 6  | **Milestone**: v0.8 - Motion  | **Labels**: phase-6, type:feat
**Branch**: phase-6/issue-022-tw-motion
**Depends on**: #002
**Effort**: S

**Description**
Install `tailwindcss-motion`. Replace any imperative micro-animations with
utility classes. Zero JS runtime.

**Acceptance criteria**
- [ ] `tailwindcss-motion` listed as a Tailwind plugin
- [ ] At least three components use motion utilities
- [ ] No bundle-size growth in JS

### Issue 023 — feat: Motion (lazy) for complex islands

**Phase**: 6  | **Milestone**: v0.8 - Motion  | **Labels**: phase-6, type:feat
**Branch**: phase-6/issue-023-motion-lazy
**Depends on**: #006
**Effort**: M

**Description**
Install `motion` (the merged Framer Motion + Motion One package). Document the
`LazyMotion + domAnimation` pattern. Use only inside interactive islands, not
on the blog/marketing surface.

**Acceptance criteria**
- [ ] `motion` installed (NOT `framer-motion`)
- [ ] At least one island uses `LazyMotion` + `domAnimation`
- [ ] Bundle report shows Motion code is in a separate chunk

**Validation**
```bash
grep -r "from 'framer-motion'" src/ && echo "FAIL" || echo "PASS"
grep -r 'from "framer-motion"' src/ && echo "FAIL" || echo "PASS"
```

---

## Phase 7 — Inceptor integration (the unique value)

**Milestone**: `v1.0 - Inceptor-aware stack`

### Issue 024 — feat: FeedbackFAB captures React errors

**Phase**: 7  | **Milestone**: v1.0 - Inceptor-aware stack  | **Labels**: phase-7, type:feat
**Branch**: phase-7/issue-024-feedback-react
**Depends on**: #006
**Effort**: L

**Description**
Extend the existing FeedbackFAB to:
1. Wrap each React island in an `ErrorBoundary` that reports to the FAB
2. Detect hydration mismatches (Astro 5 has better hooks)
3. Capture the component-tree path of the failing component in the GitHub issue

**Acceptance criteria**
- [ ] `ErrorBoundary` component exists and is auto-applied via `astro.config.mjs`
- [ ] Throwing an error inside an island produces a pre-filled GitHub issue with stack trace
- [ ] Hydration mismatches are captured and reported

### Issue 025 — chore: update CLAUDE.md with stack context

**Phase**: 7  | **Milestone**: v1.0 - Inceptor-aware stack  | **Labels**: phase-7, type:chore
**Branch**: phase-7/issue-025-claude-md
**Depends on**: #017
**Effort**: S

**Description**
Verify `CLAUDE.md` reflects the actual installed stack (versions, commands,
component locations). Add stack-specific guidance for Claude triage workflow.

**Acceptance criteria**
- [ ] `CLAUDE.md` lists exact installed versions
- [ ] Documents the Inceptor workflow (Claude Code orchestration + prometeo/forja/centinela sub-agents)
- [ ] Includes the "compound-component gotcha" with example fix

### Issue 026 — docs: new issue templates

**Phase**: 7  | **Milestone**: v1.0 - Inceptor-aware stack  | **Labels**: phase-7, type:docs
**Branch**: phase-7/issue-026-issue-templates
**Depends on**: #025
**Effort**: M

**Description**
Add `add_component.yml`, `add_dashboard.yml`, `add_data_table.yml` issue
templates. Each pre-fills the context Claude triage needs (component name,
where it goes, acceptance criteria template).

**Acceptance criteria**
- [ ] Three new YAML templates in `.github/ISSUE_TEMPLATE/`
- [ ] Each is selectable from the "New Issue" UI on GitHub
- [ ] Each has labels pre-applied

### Issue 027 — chore: visual regression in CI

**Phase**: 7  | **Milestone**: v1.0 - Inceptor-aware stack  | **Labels**: phase-7, type:chore
**Branch**: phase-7/issue-027-visual-regression
**Depends on**: #007, #017
**Effort**: L

**Description**
Add a Playwright job to `.github/workflows/ci.yml` that snapshots `/showcase`
and `/dashboard` in light and dark mode. PRs that change pixels without a
baseline update fail.

**Acceptance criteria**
- [ ] Playwright installed and configured
- [ ] CI job snapshots both pages in light + dark
- [ ] Baseline screenshots committed under `tests/__screenshots__/`
- [ ] Updating baselines is documented in `CONTRIBUTING.md`

---

## Glossary of warnings (reproduced from CLAUDE.md)

1. ❌ NO `@astrojs/tailwind` for v4 — use `@tailwindcss/vite`.
2. ❌ NO React Context for cross-island state — use Nano Stores.
3. ❌ NO single `client:load` wrap of the whole app.
4. ❌ NO mixing Radix + Base UI in one component.
5. ❌ NO `@tremor/react` — copy Tremor Raw.
6. ❌ NO `framer-motion` imports — use `motion/react`.
