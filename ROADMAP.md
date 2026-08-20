# Roadmap

## Implementation status (2026-06-01)

**Inceptor** (renamed from `issue-driven-web-template`, PR #84) is a live,
deployed Astro 5 + React 19 + Tailwind v4 + Base UI scaffold for issue-driven
development. `main` is green: `npm run check` → astro check 0 errors,
**470 tests**, **66 pages** built; deployed to **https://artemiop.com/inceptor/**.

Timeline so far (≈100 merged PRs):

- **Phases A–H** (#57–#66) — methodology, docs site, gallery/demos, TDD/Spec-DD,
  Lighthouse-CI, sitemap/favicon/prettier, feature flags, blog, Pagefind.
- **Deferred-items batch** (#67, #68) — brand/PWA art, governance baseline,
  deploy config, i18n, contact/newsletter/Sentry, ErrorBoundary fan-out,
  analytics skeleton, doctor/monday/ship, Lighthouse budgets, ethics single-source.
- **Maintenance** (#79, #81, #101) — TypeScript 6, vitest 4, zod 4, lucide,
  @astrojs/react; Lighthouse measured + gated; GitHub Actions majors; Astro-6
  dependabot ignore (peer-capped by `@vite-pwa/astro`).
- **Rebrand + deploy** (#83, #84) — Inceptor, custom-domain GitHub Pages at a
  repo subpath (`base`-wired); global nav header (#89).
- **Homepage + theming** (#85, #86, #90) — emerald primary tokens wired through
  the design system, editorial redesign, true light+dark gallery previews,
  live-rendered gallery index.
- **Component library** (#92–#99) — **~44 components across 13 gallery
  categories**; see Epic 17 + [`docs/component-catalog.md`](./docs/component-catalog.md).
- **10-subagent enhancement pass** (#100) — gallery source snippets, dashboard
  data-viz, `/demos/settings`, privacy toast, keyboard-nav test, RTL behavior
  tests, Spanish landings, ADRs 0003–0005, forbidden-imports single-source,
  lessons.md, README polish, accurate stats.
- **Self-hosted backend archetypes** (#109) — opt-in `server-node/` (Hono,
  reuses the Zod schemas) + `server-flask/` (Flask + Pydantic), one `/api/*`
  contract (forms, GitHub proxy, feedback→issue, OpenAPI/Swagger), Docker
  compose + bare scripts, `/demos/api`, ADR 0006. See Epic 19.

**Still genuinely deferred** (need external action — each has a runbook):

- Interactive perf probes (`docs/perf-playbook.md`) — 60 fps scroll, < 50 ms
  filter, zero theme flash (manual Chrome DevTools session)
- Refresh visual baselines in Linux Docker (`npm run refresh-baselines`), then
  drop `continue-on-error` from `visual.yml` (needs Docker running)
- GitHub API token, `ANTHROPIC_API_KEY`, custom-domain DNS — user secrets
- Real (non-algorithmic) brand artwork — needs a designer
- `@base-ui-components/react` stable + Astro 6 — upstream-gated
- Nightly `vibe-test` cron — the harness itself is built and manually
  invokable today (`npm run vibe-test`, `docs/vibe-test.md`); wiring it into
  a scheduled GitHub Actions workflow is a recurring Anthropic API cost
  commitment that needs explicit human sign-off, not something to silently
  enable

See [`README.md`](./README.md) for the pitch, [`CLAUDE.md`](./CLAUDE.md) for the
stack + workflow, [`docs/component-catalog.md`](./docs/component-catalog.md) for
the component inventory, and [`docs/COMPONENTS.md`](./docs/COMPONENTS.md) for the
contribution guide. Closed items keep their closing PR # inline.

---

## Epic 1 — Make the visual gate real

Advisory (`continue-on-error: true`) until baselines match Linux CI.

- [x] One-shot Docker refresh wrapper — `scripts/refresh-baselines.sh` + `npm run refresh-baselines` (#68)
- [ ] Run the refresh in `mcr.microsoft.com/playwright:v1.60.0-noble` (needs Docker)
- [ ] Remove `continue-on-error: true` from `.github/workflows/visual.yml` once baselines are stable *(DX study B2)*
- [ ] *(stretch)* Evaluate Percy / Chromatic if cross-platform drift recurs

## Epic 2 — Performance verification

- [x] `lighthouse-budgets.json` + LHCI assertions gating `npm run perf`/`lighthouse` (#68, #79)
- [x] Document the manual perf probes — `docs/perf-playbook.md` (#68)
- [x] Lighthouse measured on `/`, `/gallery`, `/docs`, `/demos/dashboard` — Perf 92–100, ≥ 90 all (#79)
- [x] `npm run lighthouse` a real green gate (category scores + CWV) (#79)
- [ ] Profile `/demos/data/large` scroll — 60 fps *(plan #013, manual)*
- [ ] Measure filter latency on `/demos/data/large` — <50 ms *(plan #013, manual)*
- [ ] Throttle theme toggle to Slow 3G — confirm zero flash *(plan #005, manual)*
- [x] *(follow-up, resolved in the Epic-12 a11y-debt pass)* `/demos/dashboard` a11y was 93 < 0.95 (Recharts SVG labelling + a heading-order bug). Recharts 3.8.1 (installed) ships `accessibilityLayer` on by default (verified `role="application" tabindex="0"` on every rendered `recharts-surface`) and the chart wrappers already carry `role="img" aria-label` — no `accessibilityLayer` wiring was actually needed, that "likely fix" predated the Recharts 2→3 default flip. The real remaining bug was `<h1>` → `<h3>` heading-order skip on the dashboard's 5 card titles, now `<h2>`. Re-measured: **1.0**.

## Epic 3 — ErrorBoundary coverage

- [x] Wrap all 12 Showcase/chart/form islands + runtime test (#66, #68)
- [ ] Wrap `ThemeIndicator` — the one demo island still unwrapped
- [ ] *(stretch)* Vite/Astro plugin to auto-wrap every `client:*` island

## Epic 4 — Brand & PWA assets — ✅ closed (#67)

- [x] Logo SVG, pwa-192/512/maskable, theme/background colors, OG + social meta, favicon.ico, sitemap (#64, #67)
- [ ] *(deferred)* Replace the algorithmic logo with real designer artwork

## Epic 5 — Dependency hygiene

- [x] TypeScript 6 + `ignoreDeprecations "6.0"`; vitest 4; zod 4; lucide 1.17; @astrojs/react 5.0.6 (#79)
- [x] Suppress Recharts SSR `width/height -1` warnings — `useMounted()` guard (#68)
- [x] GitHub Actions bumped to current majors (#81)
- [x] Retire `document.execCommand('copy')` — gallery `CodeSnippet` + FAB use `navigator.clipboard` (#64, #100)
- [x] Astro-6 dependabot `ignore` so the peer-capped bump stops recurring (#101)
- [ ] Re-pin `@base-ui-components/react` `1.0.0-rc.0` → stable *(upstream-gated — confirmed via the 2026-08 ecosystem study: this is the pre-rename package for MUI's own `@base-ui/react`, still at `1.0.0-rc.0` as of Aug 2026 with no GA cut since Dec 2025; check migration notes before bumping)*
- [ ] Astro 5 → 6 *(blocked: `@vite-pwa/astro` peer-caps at ^5)*
- [ ] Track `tailwindcss-motion` peerDep compat with Tailwind v4 minors *(PR #47)*
- [ ] Resolve Recharts `Cell` deprecation in `donut-chart.tsx` *(astro-check hint, non-blocking)*

## Epic 6 — Production readiness

- [x] Deployment — GitHub Pages workflow + guides (#67); **live at artemiop.com/inceptor/** with base-wired subpath (#83)
- [x] `repoSlug` reads `PUBLIC_REPO_SLUG` env (#68)
- [x] Privacy-respecting analytics skeleton (Plausible/Umami), flag-gated (#68)
- [x] **GitHub API auth** — token-backed server-side proxy (`/api/issues`, `/api/repo-stats`) in the self-hosted backend lifts the 60 req/h cap; islands route through it when `PUBLIC_API_BASE` is set (#109, Epic 19)
- [ ] Set `ANTHROPIC_API_KEY` secret for the Claude triage workflow *(user secret)*

## Epic 7 — Workflow & tooling

- [x] `.editorconfig` + Prettier scripts (#64)
- [ ] `format:check` step in CI — script exists, not gated *(DX study B1)*
- [ ] Refine centinela `React.createContext` grep to exclude `src/components/ui/`
- [ ] Promote prometeo/forja/centinela to a generic skill set for reuse

## Epic 8 — Scope intentionally trimmed in v1.0

- [x] `<DataTable>` column pinning *(deferred from #25 — shipped as part of Epic 23's broader ProTable-style power-features pass, #246)*
- [ ] Evaluate TanStack Form vs the react-hook-form + zod wrapper
- [ ] Tighten Slot/`cloneElement` semantics if prop conflicts surface

## Epic 9 — Feature backlog — ✅ closed (#65, #67)

- [x] i18n es/en routing (#67) + Spanish gallery/docs landings (#100)
- [x] Feature flags (#65); Sentry skeleton (#67); contact form + newsletter (#67); blog (#65); Pagefind search (#65)

---

## Epic 10 — Methodology layer (Shape Up + TDD + Spec-DD)

- [x] `@testing-library/react` + jest-dom; `npm run tdd`; `src/schemas/` (login, contact) (#63, #67)
- [x] `docs/lessons.md` created — lessons log + centinela double-reject convention (#100)
- [~] Behavior tests — RTL runtime tests for button, ErrorBoundary, switch, checkbox, tabs, rating, tag-input (#63, #68, #100); the Form/Field SSR-bug regression test still not written
- [ ] Document Shape Up cadence **in `CONTRIBUTING.md`** (lives in PRINCIPLES today)
- [x] Backend archetype reusing the shared schemas — `server-node/` (Hono) validates against `src/schemas/` directly; OpenAPI from `z.toJSONSchema()` (#109, Epic 19)

## Epic 11 — Governance baseline — ✅ closed (#60, #67, #68)

- [x] LICENSE, SECURITY, CODE_OF_CONDUCT, dependabot.yml, PR template, CODEOWNERS (#60, #67, #68)
- [x] `.claude/checklists/governance.md` — governance checklist single-sourced (#100)
- [ ] Branch protection on `main` — runbook shipped (#68); enforcement is a manual `gh api` step *(see DX study B4: align check names first)*

## Epic 12 — UX / ethics quality bar

- [x] `npm run a11y` (axe), `npm run lighthouse` (budgets), contrast + motion checks, `npm run ux:check` (#63, #64, #68)
- [x] `npm run keyboard-nav` — Playwright focus-visible tab-walk (#100)
- [x] Privacy toast on first load — closes the surveillance ethics gap (#100)
- [x] **CI gate on `ux:check` / `a11y` / `keyboard-nav`** — `ux:check` is gated (its tests run in `npm run test` → `npm run check`). `a11y` + `keyboard-nav` are **blocking** in `visual.yml` (`npx playwright test`, no `continue-on-error`) since 2026-06 — see that workflow's own "Gating since 2026-06" comment. This line previously (and incorrectly) described them as advisory; corrected during the Epic-12 a11y-debt pass below, which re-verified against the actual CI config rather than trusting the stale prose.
  - [x] `/` (home) `link-in-text-block` fixed — in-text gallery link now underlined; `/` dark is axe-clean (#111)
  - [x] `/` (home) light-mode `color-contrast` on decorative eyebrows + step numbers — **already resolved** prior to the a11y-debt pass (the flagged classes were already migrated off `text-primary/70–80` to full-opacity `text-primary`); a full-impact axe scan (all levels, not just critical/serious) on `/` in both color schemes now returns zero violations. No further shade/size change needed.
  - [x] `/gallery/` — `aria-allowed-attr` / `label` on demo instances are the two documented upstream `@base-ui-components/react` rc-status bugs (see `tests/visual/a11y.spec.ts`'s allowlist comment), already correctly excluded from the gate — not a debt item, an upstream-tracked exception. Everything else in the original list (`button-name`, `aria-meter-name`, `aria-toggle-field-name`, `color-contrast`) was already fixed by the time of this pass (a full-impact, scroll-triggered axe scan across all `client:visible` islands found none). The a11y-debt pass *did* find and fix three real, current issues Lighthouse's fuller a11y audit surfaced that the narrower WCAG-A/AA axe gate doesn't cover by design: (1) `heading-order` — `AlertTitle` hardcoded `<h5>`, now a plain `<div>` matching `CardTitle`'s existing convention; (2) `skip-link` — the sitewide "Skip to content" link's `#main-content` target was missing on most pages' `<main>` (only `/`, `/404`, `/how-it-works`, `/es/`, `/demos/ai-chat` had it) — now present on every page, with a regression test (`src/tests/skip-link-target.test.ts`) pinning it; (3) `FileUpload`'s dropzone copy + oversize-file error were hardcoded Spanish on the English `/gallery/` page (visible text vs. English `aria-label="Add files"` was a real mismatch, not just a rule quirk) — translated to English. Lighthouse `/gallery/` accessibility: 0.92 → 0.94 (remaining gap is entirely the two upstream Base UI items, unfixable from this repo).
  - [x] `/demos/dashboard/` — Recharts SVG labelling. Two things already cover this: `role="img" aria-label={ariaLabel}` on all 6 chart wrappers (`src/components/ui/charts/*.tsx`, shipped 2026-06-09) gives every chart an accessible name, and Recharts 3.8.1 (this repo's installed version) ships `accessibilityLayer` **on by default** (`role="application" tabindex="0"` + keyboard data-point nav on every `recharts-surface`, verified in the rendered DOM) — no wiring needed, the "likely fix" in Epic 2's follow-up predates the Recharts 2→3 default flip. The dashboard's own `heading-order` bug (`<h1>` → `<h3>` skip, 5 card titles) and missing skip-link target (see `/gallery/` above) were the two real, current issues; both fixed. Lighthouse `/demos/dashboard/` accessibility: 0.97 → **1.0**.

## Epic 13 — Sub-agent contract upgrades — ✅ closed (#63, #68, #100)

- [x] prometeo behavior-contracts + Triad + governance pre-check (#63)
- [x] forja TDD-trailer + Zod-not-interface + ADR-on-irreversible (#63)
- [x] centinela ethics/UX gate + red→green + failure-class routing (#63)
- [x] `.claude/checklists/ethics.{json,md}` + `governance.md` + `forbidden-imports.json` single-sourced (#68, #100)
- [ ] *(stretch)* `etico` sub-agent for `risk:high` → Stakeholder Analysis ADR

## Epic 14 — Daily DX surface — ✅ mostly closed (#63, #68, #100)

- [x] `monday` / `ship` / `doctor` / `docs` / `new-issue` scripts + slash mirrors (#63, #68)
- [x] `npm run check` consolidates check:astro + type-check + test + build (#63)
- [x] TDD tiers rubric in PRINCIPLES §2.1 (#63); prometeo `parallel_safe` (#63)
- [x] Centinela verdict tokens + **ADR 0003** (#63, #100)
- [ ] `scripts/parallel-worktrees.sh` — parallel-safe forja worktrees
- [ ] **chore-train lane** — long-lived `chore/<week>` + `centinela-light`

## Epic 15 — Docs site (custom `/docs/*` route)

- [x] Custom `/docs/[...slug].astro` route + sidebar + Pagefind + 7-section IA (#61, #65)
- [x] **ADR 0004** records the Starlight-vs-custom decision (#100)
- [x] **Single-source forbidden-imports JSON** `.claude/checklists/forbidden-imports.json` + scan test (#100) — closes F5's last drift point
- [ ] Move `INTEGRATION-PLAN.md` → `docs/history/`, slim README/CONTRIBUTING *(F5 reorg)*
- [ ] `scripts/sync-stack-versions.mjs` (regenerate from package.json in prebuild)
- [ ] `npm run docs:check` — broken-link checker + Pagefind dry-run
- [ ] Flesh out the `docs/building/*` migration-stub pages *(DX study C8)*
- [ ] *(stretch)* TypeDoc on `src/lib/*`; per-page "Was this helpful?" → FAB

## Epic 16 — Gallery + Demo + Marketing surface — ✅ mostly closed (#62, #90, #100)

- [x] Gallery/Demos/Marketing split; manifest; per-component pages; route 301s; launchpad `/` (#62)
- [x] Live-rendered gallery index (every component inline) (#90)
- [x] `CodeSnippet` — Shiki source + clipboard copy on detail pages (#100)
- [x] `/demos/settings` composed demo; dashboard data-viz (sparkline/gauge/bar-list) (#100)
- [ ] `VariantGrid` + full `PropsTable` (recipes shipped #100; prop tables still pending)
- [ ] Per-component Playwright baselines + manifest-driven `gallery.spec.ts` *(unblocks Epic 1)*
- [x] **`<Playground>` live prop editing** *(#248)* — shipped on `sucrase` directly (not `react-runner`, which peer-caps at React ≤18, incompatible with this repo's React 19) — a single-file transpile-on-keystroke editor scoped to a fixed component scope, gated `client:visible`, wired into 3 gallery pages as a proof of concept (`primitives`/`feedback`/`disclosure`). An "Open in StackBlitz" external link and full rollout to every component remain open. `/gallery.json` endpoint stays a stretch add-on.
- [x] **Blocks-style Preview/Code toggle** for composed page sections *(#249)* — `BlockPreviewToggle.astro`, reusing `CodeSnippet`, applied to Epic 27's login/settings/app-layout blocks. Dashboard-KPI-row/settings-form-as-isolated-snippet still open.
- [x] **Inline maturity/hydration badges** on each component's `/gallery` detail page *(#248)* — `src/lib/gallery-badges.ts` extends the existing ✅/🔵/🧪 stability glyphs inline near the title, plus a hydration-directive glyph (optional `hydration?` field on `GalleryEntry`, backward-compatible). `PropsTable`-row-level badges still open (no `PropsTable` exists yet, see the line above in this epic).

### Per-archetype demos (when archetypes land)

- [x] **backend** `/demos/api` — documents the live `/api/*` contract + Swagger link (#109, Epic 19)
- [ ] **decentralized** `/demos/wallet` · **onion** `/demos/onion-safe` (zero-external-request assertion)

---

## Epic 17 — Component library — ✅ shipped (#92–#99)

~44 components across 13 gallery categories, all on Base UI primitives
(shadcn-style) or dependency-free markup. Inventory + scorecard:
[`docs/component-catalog.md`](./docs/component-catalog.md). ADR 0005 records the
choice.

- [x] Form controls — Select, Checkbox, Radio, Switch, Slider, Textarea (#92)
- [x] Overlays — Tooltip, Popover, Alert dialog, Hover card, Context menu (#93)
- [x] Disclosure & layout — Accordion, Collapsible, Avatar, Skeleton, Separator, Scroll area, Aspect ratio (#94)
- [x] Feedback & status — Breadcrumb, Pagination, Alert, Spinner, Meter, Kbd, Empty state, Description list (#95)
- [x] Advanced inputs — Toggle, Toggle group, Number field, Toolbar, Sheet, Rating, Tag input, Input OTP (#96)
- [x] Navigation & menus — Combobox, Command palette (⌘K), Navigation menu, Menubar, Stepper (#97)
- [x] Extras & data-viz — Tree view, Timeline, Bar list, Sparkline, Gauge (#98)
- [x] Catalog doc synced (#99)
- [ ] *(dependency-gated, per-project)* Rich text, Carousel, Lightbox, Code block (Shiki), advanced charts — documented in the catalog. Date/Color picker (#244) and Splitter (#243) shipped — see Epic 21/22.
- [ ] *(niche / on-demand)* Mentions, Cascader, Transfer, QR, Tour, Watermark, Segment Group *(the last ~90% covered already by the shipped Toggle Group — only the sliding-indicator polish is missing)*, Listbox, JSON tree view *(specialized Tree View variant — build only when a concrete consumer needs it, e.g. an API-payload/audit-log viewer)*, Timer, Floating panel, Signature pad, Image cropper
- [ ] *(explicitly not building — recorded so it isn't re-proposed)* Marquee, Angle slider, Swap — all fit consumer/marketing/creative-tool UI, not enterprise-admin CRUD, per the 2026-08 ecosystem study's niche-primitive triage
- [ ] *(explicitly deferred, not core)* Kanban board, Gantt chart — real components exist to copy (Kibo UI, `kibo-ui.com`, MIT), but they're project-management-tool primitives, not general admin-dashboard ones (same reasoning `docs/CLOUDSCAPE-GAP-ROADMAP.md:114` already applies to board/DnD UI: *"build only if a real downstream project needs one, then extract upstream"*). If ever needed: Kanban is a clean port (~250 LOC, `@dnd-kit/core`, real keyboard/SR accessibility story); Gantt is not (~1000+ LOC, drags in `jotai` which conflicts with this repo's Nano-Stores-only convention — would need an internal-state rewrite, not a copy-paste)
- [ ] *(explicitly deferred, not core)* Full event scheduler (day/week/month views, drag-to-reschedule, recurring events) — MUI X paywalls exactly this behind a Premium commercial license and still ships incomplete RFC 5545 recurrence coverage; Ant Design and Astryx both stopped at a plain date-picker/month-grid and never built one either. Not a near-term epic. If ever picked up: a **minimal v1** (month-grid + flat per-day event list, no drag, no recurrence, built on `react-big-calendar` — MIT, no license fee) is a plausible standalone epic; a **full scheduler** (drag/resize, resource rows, recurring events with DST-aware exceptions) is its own multi-phase initiative comparable in effort to a new component category, likely requiring either a commercial license (FullCalendar Premium, ~$480/dev/yr) or a from-scratch `rrule`/`rrule-temporal` integration

## Epic 18 — DX hardening (from the 2026-06 three-agent DX study)

Three subagents studied onboarding, the daily authoring loop, and tooling/CI.
**Cross-cutting finding:** the quality bar (ux:check, a11y, forbidden-imports,
ethics, visual) is enforced only by the `centinela` sub-agent during a Claude Code run —
a human or Dependabot PR bypasses all of it because CI runs only `check` +
`build`. Ordered by impact/effort.

### Gallery wiring (the #1 daily papercut)

- [ ] **Codegen gallery island wiring from the manifest** — generate `src/components/gallery/_islands.generated` (imports + a `<GalleryIsland name>` dispatcher); the 2 pages import one file. Adding a component drops from ~6 edits in 2 files to 1. Delivers the `islands.ts` the manifest comment already promises. *(H/M)*
- [ ] **`npm run new-component` scaffolder** — ui + test + manifest entry + recipe + runs the codegen (mirror `new-issue.sh`). *(H/M)*
- [ ] **Real manifest↔wiring guard test** — `gallery-page.test.ts` checks a hardcoded 12-name list; derive from the manifest and assert import+render in both pages (a half-wired component passes today). *(H/S)*

### Close the CI gate

- [ ] **Wire `ux:check` / `a11y` / `keyboard-nav` / `format:check` / `lighthouse` into CI** — all exist, none run in any workflow. *(H/M; = Epic 12 + Epic 7)*
- [ ] **Promote the visual gate to required** — refresh Linux baselines, drop `continue-on-error`. *(H/S; = Epic 1)*
- [ ] **Add ESLint** (flat config + typescript-eslint + react-hooks + jsx-a11y + astro) — none exists, yet `forja.md` says "never disable an ESLint rule". *(M/M)*
- [ ] **Align governance required-check names** with the actual single `build` CI job (or split into named jobs). *(M/S; = Epic 11)*

### Inner loop & environment

- [ ] **`dev:fresh` + `optimizeDeps`** — kill the `504 Outdated Optimize Dep` blank-island bug after dep changes (`rm -rf node_modules/.vite && astro dev --force` + pre-warm base-ui/recharts/motion/tanstack); document the symptom. *(H/S)*
- [ ] **husky + lint-staged** — pre-commit prettier on staged; pre-push `check:astro`+`type-check`+`test`. *(H/M)*
- [ ] **`check:fast`** (no build) for the inner loop; full `check` for CI/`ship`. *(M/S)*
- [ ] **Global jest-dom types** (`tsconfig types` or `vitest-env.d.ts`) + a behavior-test filename convention to drop the easy-to-forget `// @vitest-environment jsdom` pragma. *(M/S)*
- [ ] **`.vscode/` settings + `extensions.json`** — formatOnSave + Prettier default + Astro/Tailwind/Playwright recommendations (only a stray Snyk line today). *(M/S)*

### Docs / config drift (cheap, high-confusion)

- [x] **Kill the dual deploy workflow** — `cd.yml` is now `workflow_dispatch`-only (a copy-me template for other providers); `deploy.yml` is the sole push-to-`main` deploy, so no more misleading green "deploy" (#110)
- [ ] **Reconcile `SETUP.md`** with `.env.example` (`cp .env.example .env`), `deploy.yml` (not `cd.yml`), and `FeedbackFAB` (`PUBLIC_REPO_SLUG` env, not source edit). *(M/S)*
- [~] **Pin Node** — `.nvmrc` (22) + `engines.node >=22` added (#110); surfacing `npm run doctor` as Quick-Start step 0 still open
- [ ] **Document the non-Claude-Code path** — the sub-agent workflow has no fallback in CONTRIBUTING; add a "two ways to ship" + `docs/start-here/first-feature.md`. *(M/M)*
- [~] CI triggers now match real branch names (`main`, `phase-*/**`, `feat/**`, `fix/**`, `docs/**`, `chore/**`) (#110); README `check` description, `npm run help`, post-deploy smoke-check (curl 200) still open

### Component documentation depth *(from the 2026-08 ecosystem-comparison study)*

- [x] **Testing-recipe polyfills in `vitest.setup.ts`** *(#242, #243, #248)* — `matchMedia`, `scrollIntoView`, `ResizeObserver`, `IntersectionObserver` all now polyfilled. Recipe documented as a named section in `docs/COMPONENTS.md` §7 (#248) — directly unblocks the still-partial RTL behavior-test line in Epic 10.
- [x] **Keyboard-navigation contract tables** *(#248)* — MUI Data Grid's `Key | Description` convention, grouped by interaction context, using Inceptor's `<Kbd>` component — added to `docs/component-guidelines/{data,navmenu,extras}.md` for `DataTable`/`Combobox`/`Command palette`/`Menubar`/`Tree view`, read from real source (including honest "not actually keyboard-operable" admissions where true, e.g. DataTable column-resize, Tree view's arrow-key nav despite `role="tree"` markup).

## Epic 19 — Self-hosted backend archetypes — ✅ shipped (#109)

Opt-in backend that fills the gaps the static site left dangling (forms POSTing
nowhere, browser-side GitHub at 60 req/h, feedback as a prefilled URL), **without
dropping the static deploy**. One `PUBLIC_API_BASE` switch; unset = today's
behavior. Two interchangeable runtimes share one `/api/*` contract. ADR 0006.

- [x] `server-node/` — Hono; **reuses** `src/schemas/` (Zod) for validation; OpenAPI from `z.toJSONSchema()`; vitest (#109)
- [x] `server-flask/` — Flask + Pydantic mirror; pytest + ruff; same contract (#109)
- [x] Endpoints — `/api/contact`, `/api/newsletter`, `/api/issues`, `/api/repo-stats`, `/api/feedback`, `/api/openapi.json`, `/api/docs`, `/api/health` (#109)
- [x] `PUBLIC_API_BASE` discovery in `src/lib/api.ts`; islands + forms route through the backend when set (#109)
- [x] Cross-runtime `openapi.golden.json` contract + a test in both suites (#109)
- [x] Docker compose (`--profile backend`) + bare scripts; `/demos/api`; `docs/building/backend` (#109)
- [ ] `FeedbackFAB` → `POST /api/feedback` when a backend is wired (today it still opens the prefilled issue URL) *(follow-up)*
- [ ] *(stretch)* serverless deploy targets (Workers/Lambda) for the same handlers; rate-limit + spam middleware

---

## Epic 20 — First-run experience (from POSITIONING §4)

Make `create-inceptor-app`'s first 60 seconds prove the differentiator instead
of hiding it. The positioning decision is fixed in
[`docs/POSITIONING.md`](./docs/POSITIONING.md) §4: **lean by default,
differentiator *shown* not gated, depth *earned* via just-in-time disclosure —
no upfront picker.** This epic turns that decision into shipped surface.

- [ ] **Seeded example issue** — `create-inceptor-app` scaffolds one pre-written
  GitHub issue (or local `examples/first-issue.md`) the loop can run against, so
  a new user watches issue → prometeo → forja → centinela → PR without authoring
  anything.
- [ ] **`/how-it-works` walkthrough** — a page (or fold into `/showcase`) that
  shows the sub-agent loop running on the seed; the live differentiator demo.
  *(Open question in POSITIONING §6: route name vs. `/showcase`.)*
- [ ] **FeedbackFAB live from second one** — confirm the FAB renders on the
  scaffolded app's first run with no config; it's the cheapest user→issue demo.
- [ ] **Governance dormant-but-visible** — TDD tiers / ethics checklist /
  `risk:high` present and documented but off by default; a README one-liner
  points at the enable path (not off-and-hidden).
- [ ] **Just-in-time disclosure hooks** — surface each deeper layer when it
  becomes relevant (`enable tdd-tier` after first bug; ethics + ADR flow on first
  `risk:high`; a `TEACHING.md` door for coursework). *(Ergonomics open in
  POSITIONING §6: CLI subcommand vs. doc-driven manual step.)*
- [ ] **No upfront picker** — explicitly *not* building a "lean/governed/teaching"
  init prompt; recorded here so it isn't re-proposed.

---

## Epic 21 — Universal input & utility primitives — ✅ shipped (#244)

The single most-repeated gap across a 6-library comparison (Astryx, MUI, shadcn,
Chakra, Ant Design, Ark UI): **date/time picker was the only component all six
had that Inceptor has none of.** Scope resolved by follow-up research — this is
input-only work, *not* a calendar/scheduler app (see the explicit deferral in
Epic 17). Ordered by impact/effort.

- [x] **Date Picker + Date Range Picker** *(H/S–M)* — `Popover` + `Calendar`
  composition on `react-day-picker` (MIT, ~22 kB, actively maintained, 500k+
  weekly downloads), no root component — copy shadcn's Base UI `date-picker`
  pattern near-verbatim, it's built the same way this repo already builds
  primitives. `mode="range"` covers the range variant. (#244)
- [x] **Time Picker** *(M/S)* — a time-input composed alongside the date
  picker (date+time combined), same `react-day-picker`/Base UI foundation. (#244)
- [x] **Color Picker** *(M/S)* — theming/branding admin screens. (#244)
- [x] **Editable** *(H/S)* — inline click-to-edit text; table-cell/settings-label
  renaming is a CRUD staple. Built on `@zag-js/editable` per ADR 0009. (#244)
- [x] **Password Input** *(H/XS)* — reveal toggle on top of the existing
  `Input`; every auth/settings form needs it. (#244)
- [x] **Clipboard** *(M/XS)* — copy-to-clipboard state (icon swap + timeout),
  used constantly for API keys/IDs/webhook URLs in dev-facing admin panels. (#244)
- [x] *(polish, not new)* **Segmented control sliding indicator** — added as
  `variant="segmented"` on the existing Toggle Group, additive, no regression
  to the default variant. (#244)
- [x] *(architecture)* **Write ADR 0009** — "Base UI remains primary; permit
  `@zag-js/*` machines for primitives Base UI does not ship." Base UI is still
  `1.0.0-rc.0` with no GA cut since Dec 2025, while Ark UI (the zag.js-backed
  alternative) ships stable releases every 2–5 weeks. Not a reason to migrate
  (ADR 0002 already logged this risk, and the `render`-prop conversion cost is
  real) — but for primitives Base UI has no equivalent for (date-picker before
  this epic existed, Splitter, Editable, Tour), depending directly on
  `@zag-js/<component>` (not the full `@ark-ui/react` wrapper) and wrapping it
  in the same shadcn-style pattern is lower-risk than either hand-rolling
  every gap primitive or reopening ADR 0002 wholesale. (`docs/decisions/0009-zag-js-for-gap-primitives.md`)

## Epic 22 — Resizable layout & bulk actions — ✅ shipped (#243)

- [x] **Splitter** *(H/M)* — resizable panes for master-detail layouts
  (`AppLayoutIsland`, `ResourceDetails`) — a defining Cloudscape/enterprise-
  console pattern. Built on `@zag-js/splitter` per ADR 0009; keyboard-resizable
  for free from the state machine. (#243)
- [x] **Action Bar** *(H/S)* — contextual bulk-action toolbar, standalone and
  data-source-agnostic (DataTable had no row-selection state yet at ship
  time — wired together in Epic 23). (#243)

## Epic 23 — DataTable power features — ✅ shipped (#246)

Ant Design Pro's `ProTable` is the most feature-complete admin-table prior art
studied. Absorbs the column-pinning line from Epic 8. Combines with the
existing five-state `useListing` model (loading/error/empty-zero/empty-
filtered/ready) rather than replacing it — that model is already more
rigorous about empty/error UX than ProTable's own docs describe.

- [x] Column pinning *(deferred from #25, Epic 8)* (#246)
- [x] Per-column filter dropdowns (not just the current global text filter) (#246)
- [x] Expandable rows (folded into the same virtualized item list so scroll
  offsets stay accurate — regression-tested after a review cycle caught a real
  coverage gap here) + a computed summary/footer row (#246)
- [x] Sticky header with configurable offset (#246)
- [x] Column-visibility persistence in `localStorage` (SSR-safe, post-mount only) (#246)
- [x] A `request(params, sort, filter) => {data, total}`-shaped contract,
  wired through the real `useListing` state machine, not a parallel one (#246)
- [x] **Download Trigger** — standalone export-button-with-loading-state
  component, wired into `DataTable`'s toolbar via `onExport` (#246)

## Epic 24 — Unified field abstraction (`fieldType`) — ✅ shipped (#247)

The highest-leverage single idea from the study, with no exact equivalent in
the other 5 libraries — inspired by Ant ProComponents' `ProField`
`valueType`. One data-type definition (money, date, select w/ options,
status…) driving `DataTable` cell rendering, filter input, `Form` field, and
`description-list` row — previously four separate, independently-wired
surfaces. Directly accelerates the in-flight service-shell/resource-details/
wizard work (Epic from #202).

- [x] Design the `fieldType` union + shared renderer contract — `src/lib/field-type.ts` (#247)
- [x] Wire `DataTable` columns through it (`ColumnMeta.fieldType`, additive — explicit `cell` always wins) (#247)
- [x] Wire `Form` fields through it (react-hook-form + zod stays underneath, via `FieldFormItem`) (#247)
- [x] Wire `description-list` rows through it (#247)
- [x] Wire filter inputs (`PropertyFilter`) through it *(known gap: date/dateRange fieldType only wires the input widget — `filterByTokens`'s numeric coercion isn't date-aware yet; degrades safely, documented in `docs/component-guidelines/data.md`)* (#247)

## Epic 25 — Generative theming — ✅ shipped (#241)

Four of six studied libraries (Chakra semantic tokens, Astryx `defineTheme()`,
MUI CSS-variables mode, Ant Seed→Map→Alias) derive light+dark from a single
definition; `src/styles/global.css` previously hand-duplicated the full
palette under `:root` and `.dark`.

- [x] Semantic tokens as one `{ base, dark }` definition per token via CSS
  `light-dark()` — same CSS variable names, byte-identical resolved values,
  no build step needed (#241)
- [x] `defineTheme(accentColor)` — derive a full accessible palette from one
  brand color (`src/lib/define-theme.ts`); ties into the re-brand-on-instantiate
  workflow `CLAUDE.md` documents for `create-inceptor-app`, not yet wired into
  a setup script (#241)

## Epic 26 — Agent-consumable component registry — ✅ shipped (#245)

Four independent sources (shadcn's registry+MCP, Ark UI's MCP+`llms.txt`, Ant
Pro's agent-facing guideline docs, Astryx's CLI+MCP+vibe-test harness)
converged on this without coordinating — the idea with the most philosophical
fit for a template whose entire premise is "Claude builds the UI."

- [x] `registry.json` (shadcn-`build`-compatible shape) exposing Inceptor's
  own components, generated from `src/content/gallery.ts` via `npm run gen:registry` (#245)
- [x] An MCP server serving that registry — `mcp-server/`, exposing
  `list_components`/`get_component` tools, verified over real stdio transport (#245)
- [x] Per-component guideline docs in Ant Pro's format — Purpose / When to use
  / API overview / Common mistakes — `docs/component-guidelines/`, covering
  15 of the most-used/most-complex components to start (#245)
- [x] **Verified (2026-08-10) — cross-registry `npx shadcn add` is a
  targeted tactic, not a blanket strategy.** Real installs against a
  `components.json`/Tailwind v4 setup matching Inceptor's own, using live
  Kibo UI registry URLs:
  - Primitive-free items install clean: `kibo-ui.com/r/marquee.json` added
    `src/components/kibo-ui/marquee/index.tsx` with zero `@radix-ui`/`radix-ui`
    imports and its real npm dependency (`react-fast-marquee`) resolved and
    installed.
  - Primitive-coupled items pull Radix straight in, with **no warning from
    the CLI**: `kibo-ui.com/r/dialog-stack.json` added a file importing
    `@radix-ui/react-use-controllable-state` and the consolidated `radix-ui`
    package directly.
  - **The sharper, unanticipated risk**: `kibo-ui.com/r/kanban.json` itself
    is Radix-free (dnd-kit-based), but its own `registryDependencies` —
    `["card", "scroll-area"]` — are bare names, which shadcn resolves against
    the *default Radix-based* shadcn/ui registry since Kibo doesn't redefine
    them. The CLI wrote `src/components/ui/scroll-area.tsx` (Radix) straight
    over the filename Inceptor's own hand-built Base UI `ScrollArea`
    occupies. `card.tsx` happened to land byte-identical (no primitive
    involved, so no damage); `scroll-area.tsx` is a **silent destructive
    overwrite** of an owned file with a real consumer
    (`ShowcaseDisclosure.tsx`) — worse than "adds an unwanted dependency,"
    it swaps the accessibility primitive under an existing import without
    tripping a type error, because both versions export a same-shaped
    `<ScrollArea>` component.
  - **Gap found in centinela's own safety net**: its forbidden-import grep
    (`from ['"]@radix-ui/`) catches `@radix-ui/react-use-controllable-state`
    but misses the bare `from "radix-ui"` form used by `dialog-stack` — the
    pattern should check both.
  - **Reverse direction** (third parties installing *from* Inceptor):
    Inceptor's `registry.json` validates cleanly against the real
    `registry-item.json` JSON Schema for 24 of 25 items; `field-type` fails
    one rule (a `registry:file`-typed entry needs an explicit `target`,
    which it's missing) — a one-line fix, not a structural blocker, so this
    direction would work once hosted.
  - **Verdict**: use cross-registry installs case by case for genuinely
    primitive-free components (icons-style, layout-style, data-viz-style),
    always grepping the installed file for *both* `@radix-ui/` and bare
    `radix-ui` afterward, and always diffing/renaming before letting
    anything land under a `src/components/ui/` filename Inceptor already
    owns. Do **not** treat it as a blanket strategy for filling gaps like
    Kanban/Carousel — even a "primitive-light" top-level component can
    smuggle Radix in through `registryDependencies` you never asked for,
    and neither the CLI nor a filename check alone will catch it.
- [x] *(stretch, validates the whole forja/centinela premise)* A "vibe-test"
  harness — spawn a fresh model session, give it ONLY one component's
  `docs/component-guidelines/` section (no source access), ask it to build a
  working usage example, type-check the result for real against the actual
  component. Astryx runs exactly this against its own docs; Inceptor's
  entire workflow depends on the same property holding.
  `npm run vibe-test` (manual today — see `docs/vibe-test.md`, and "Still
  genuinely deferred" below re: nightly automation).

## Epic 27 — Installable page blocks — ✅ shipped (#249)

Inceptor has islands (`AppLayoutIsland`, `WizardIsland`, `DetailsPageSimple`)
but previously had no complete, installable page compositions — a structural
gap, not a component-count one.

- [x] Login/auth page — `LoginForm` island + `/login`, reuses the existing
  `src/schemas/login.ts` (#249)
- [x] Settings page as an installable block — `SettingsDemo.tsx` formalized
  with a Danger-zone tab, now powers both `/demos/settings` and `/blocks/settings` (#249)
- [x] 2 `AppLayout` sidebar variants (icon-collapse, dual-sidebar) — opt-in
  `sidebarVariant` prop on `AppLayoutIsland`, backward-compatible when omitted (#249)
- [x] Preview/Code toggle per block, reusing `CodeSnippet` — `BlockPreviewToggle.astro`
  (Astro-only, no nested islands) + new `/blocks/*` routes (#249)

## Epic 28 — AI kit refinement — ✅ shipped (#242)

- [x] **Chat auto-scroll** — `ChatThread` had no scroll-anchoring at all
  (reported directly against `/demos/ai-chat`); fixed with a bottom-sentinel
  effect (#188 direct fix), then refined to the full shadcn `MessageScroller`
  behavior — stick to bottom *unless* the user has scrolled up, plus a
  "Nuevos mensajes ↓" jump-to-bottom affordance (#242)
- [x] `shimmer` / `scroll-fade-y` CSS utilities for `streaming-text.tsx`
  (shimmer degrades to static under `prefers-reduced-motion`) (#242)
- [x] **Citation** component — `CitationRef`/`CitationList`, source-attribution
  for AI answers, wired into `ShowcaseAI.tsx` (#242)

## Epic 29a — Desktop packaging via Tauri (opt-in)

An Inceptor-derived project can wrap its static build in a real desktop
app (Windows/macOS/Linux) without every project paying for Rust/Tauri
weight by default. Per `docs/POSITIONING.md` §4, this is a layer-in
command, not an init-time picker option.

- [x] `scripts/add-tauri.mjs` generator + `templates/tauri-desktop/`
  scaffold — merges into an existing project's `package.json`/`.gitignore`
  rather than creating a new project (unlike `scripts/init.mjs`)
- [x] Minimal Tauri v2 capabilities (`core:default` only) — nothing
  granted beyond a plain window until a project deliberately extends it
- [x] `docs/runbooks/tauri-desktop.md` — copied into every project that
  runs the generator, covers dev workflow, the cross-origin WebView
  gotcha, and what's deliberately NOT included (signing, auto-update,
  store distribution)
- [x] `.github/workflows/tauri-desktop.yml` — on-demand (`workflow_dispatch`
  only) build verification across all three desktop OSes, zero secrets,
  zero impact on normal push/PR CI

**Design spec:** `docs/superpowers/specs/2026-08-20-tauri-desktop-design.md`

## Epic 29b — Mobile packaging via Tauri (iOS/Android) — not yet started

Follow-up to Epic 29a. Needs its own spec: store accounts, code signing,
and (for iOS) a Mac runner + Apple Developer account are per-project,
human-provisioned prerequisites this template can document but can't
provision. See the sibling `watchboard` repo's
`docs/superpowers/plans/2026-08-19-tauri-android-play-store.md` for a
worked example of the credential/signing/CI shape this will need.

---

## Status legend

- `[ ]` open · `[~]` partial (detail in the line) · `[x]` done (carries the PR #)

## Process

1. Pick an item → file an issue via `.github/ISSUE_TEMPLATE/` → reference this line.
2. On merge, check the box and append the PR #.
