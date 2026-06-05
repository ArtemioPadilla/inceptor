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
- [ ] *(follow-up)* `/demos/dashboard` a11y 93 < 0.95 (Recharts SVG labelling); gate at 0.90 until fixed

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
- [ ] Re-pin `@base-ui-components/react` `1.0.0-rc.0` → stable *(upstream-gated)*
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

- [ ] `<DataTable>` column pinning *(deferred from #25)*
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
- [~] **CI gate on `ux:check` / `a11y` / `keyboard-nav`** — `ux:check` is already gated (its tests run in `npm run test` → `npm run check`). `a11y` + `keyboard-nav` already *run* in CI via `visual.yml`'s `npx playwright test`, but **advisory** (`continue-on-error`). Flipping them to blocking is gated on fixing the real violations below — that's the remaining DX-study-B1 work, not a CI-wiring gap.
  - [x] `/` (home) `link-in-text-block` fixed — in-text gallery link now underlined; `/` dark is axe-clean (#111)
  - [ ] `/` (home) light-mode `color-contrast` — emerald `text-primary/70–80` on decorative eyebrows + step numbers (10 nodes); needs a palette/shade decision (emerald-700 or larger/bolder), not an autonomous redesign
  - [ ] `/gallery/` — `aria-allowed-attr`, `button-name`, `label`, `aria-meter-name`, `aria-toggle-field-name` (demo instances missing labels) + `color-contrast`; `keyboard-nav` focus-indicator failures
  - [ ] `/demos/dashboard/` — Recharts SVG labelling (see Epic 2 follow-up)

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
- [ ] *(stretch)* `<Playground>` live prop editing; `/gallery.json` endpoint

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
- [ ] *(dependency-gated, per-project)* Date/Color picker, Rich text, Carousel, Resizable, Lightbox, Code block (Shiki), DnD, advanced charts — documented in the catalog
- [ ] *(niche / on-demand)* Mentions, Cascader, Transfer, QR, Tour, Watermark

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

## Status legend

- `[ ]` open · `[~]` partial (detail in the line) · `[x]` done (carries the PR #)

## Process

1. Pick an item → file an issue via `.github/ISSUE_TEMPLATE/` → reference this line.
2. On merge, check the box and append the PR #.
