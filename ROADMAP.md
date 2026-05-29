# Roadmap

## Implementation status (2026-05-28, post-deferred-items)

The Phase A–H marathon (PRs #57–#66) plus the two deferred-items PRs
(**#67** + **#68**) closed the bulk of Epics 1–16. Test suite went 295 → **349**.
Page count went 5 → **53**. `main` is green: `npm run check` (astro check 0
errors, 349 tests, 53 pages built).

**Phases shipped (8/8):**

- ✅ Phase A — PRs #59 (F1-F7 docs) + #60 (LICENSE + DX surface)
- ✅ Phase B — PR #61 (custom /docs/* route, 36 pages, sidebar nav)
- ✅ Phase C — PR #62 (/gallery, /demos, launchpad, 49 → 51 pages)
- ✅ Phase D — PR #63 (TDD + Spec-DD + UX checks + sub-agent contracts)
- ✅ Phase E — PR #64 (Lighthouse-CI config)
- ✅ Phase F — PR #64 (sitemap, favicon.ico, robots.txt, execCommand removed)
- ✅ Phase G — PR #64 (.editorconfig, Prettier)
- ✅ Phase H — PR #65 (feature flags, blog, Pagefind search)

**Deferred-items batch shipped (PRs #67 + #68):**

- ✅ Brand & PWA artwork — logo SVG, PWA 192/512/maskable icons, OG image +
  social meta, favicon.ico, apple-touch-icon (#67) — **closes Epic 4**
- ✅ Governance baseline — SECURITY.md, CODE_OF_CONDUCT.md, dependabot.yml,
  PR template (#67) + CODEOWNERS, branch-protection runbook (#68) —
  **closes Epic 11** (branch-protection enforcement still a manual gh step)
- ✅ Deployment config — GitHub Pages workflow + Cloudflare/Netlify/Vercel
  guides (#67); actual deploy + secrets still need the user
- ✅ i18n (es/en routing), contact form, newsletter, Sentry skeleton (#67) —
  **closes Epic 9**
- ✅ ErrorBoundary fan-out — all 12 Showcase/chart/form islands wrapped +
  runtime test (#68) — **Epic 3 all but ThemeIndicator**
- ✅ Recharts SSR width/height -1 warnings suppressed (#68)
- ✅ repoSlug env + analytics (Plausible/Umami) skeleton (#68)
- ✅ `npm run doctor` + monday/ship/doctor slash commands (#68)
- ✅ Lighthouse budgets file + assertions (#68)
- ✅ Single-source ethics checklist `.claude/checklists/ethics.{json,md}` (#68)
- ✅ Tier-2 runbooks — `.env.example`, `scripts/refresh-baselines.sh`,
  `docs/perf-playbook.md` (#68)

**Maintenance batch shipped (PRs #79 + #81):**

- ✅ TypeScript 6 + `ignoreDeprecations "6.0"`, vitest 4, zod 4, lucide 1.17,
  @astrojs/react 5.0.6 (#79) — closes the unblocked Epic 5 dep bumps
- ✅ Lighthouse measured (Perf 92–100, ≥ 90 on all pages) + `npm run lighthouse`
  made a real green gate (#79) — closes the Lighthouse arm of Epic 2
- ✅ GitHub Actions bumped to current majors (#81)
- ✅ `.env.example` actually committed (the `.env.*` ignore had swallowed it
  in #67) + `.lighthouseci/` ignored (#79)

**Still genuinely deferred** (require external action — each has a runbook):

- Interactive perf probes (`docs/perf-playbook.md`) — 60 fps scroll, < 50 ms
  filter, zero theme flash (need a manual Chrome DevTools session)
- Refresh visual baselines in Linux Docker (`npm run refresh-baselines`), then
  drop `continue-on-error` from `visual.yml` (needs Docker running)
- GitHub API token, `ANTHROPIC_API_KEY`, real deploy target — user secrets
- Real (non-algorithmic) brand artwork — needs a designer; placeholder ships now
- Astro 6 + `@base-ui-components/react` stable — both upstream-gated (PWA
  plugin peer-caps astro at ^5; base-ui still rc.0)

## Where we are (2026-05-28)

The Astro 5 + React 19 + shadcn/Base UI + TanStack + Tremor Raw + Motion +
`@vite-pwa/astro` integration is complete. `main` carries the 27-issue plan
from [`INTEGRATION-PLAN.md`](./INTEGRATION-PLAN.md), the Phase A–H marathon,
and the deferred-items batch (PRs #67–#68).

See [`README.md`](./README.md) for the user-facing pitch, [`CLAUDE.md`](./CLAUDE.md)
for the stack + workflow, and [`docs/COMPONENTS.md`](./docs/COMPONENTS.md)
for the contribution guide.

This file tracks **post-integration follow-ups**. Each item carries a
provenance pointer (PR #, rule, or file path) so the *why* doesn't decay.
Closed items keep their closing PR # inline.

---

## Epic 1 — Make the visual gate real

The Playwright workflow is advisory (`continue-on-error: true`) until
baselines match the Linux CI environment. Tooling now exists; the refresh
itself needs a local Docker run.

- [x] Add a one-shot Docker refresh wrapper — `scripts/refresh-baselines.sh`
      + `npm run refresh-baselines` (#68)
- [ ] Run the refresh in `mcr.microsoft.com/playwright:v1.60.0-noble`
      — `npm run refresh-baselines` (needs Docker on the user's machine)
- [ ] Remove `continue-on-error: true` from
      `.github/workflows/visual.yml` once baselines are stable
- [ ] *(stretch)* Evaluate Percy / Chromatic if cross-platform drift
      becomes recurring

## Epic 2 — Performance verification

INTEGRATION-PLAN asked for Lighthouse ≥ 90, 60 fps scroll, <50 ms filter
latency, and zero theme-toggle flash on Slow 3G. Lighthouse is now measured
and gated; the three interactive probes still need a manual DevTools session.

- [x] *(was stretch)* `lighthouse-budgets.json` budget file + LHCI
      assertions gating `npm run perf` / `npm run lighthouse` (#68, tuned #79)
- [x] Document the manual perf probes — `docs/perf-playbook.md` (#68)
- [x] Run Lighthouse on `/`, `/gallery`, `/docs`, `/demos/dashboard` — Perf
      92–100, **≥ 90 on all** (#79); scores in `docs/perf-playbook.md`
- [x] Make `npm run lighthouse` a real green gate — dropped the over-granular
      `lighthouse:no-pwa` assertion preset; gate on category scores + CWV (#79)
- [ ] Profile `/demos/data/large` scroll in Chrome DevTools — 60 fps *(plan #013)*
- [ ] Measure filter latency on `/demos/data/large` — <50 ms input→render *(plan #013)*
- [ ] Throttle theme toggle to Slow 3G — confirm zero flash *(plan #005)*
- [ ] *(follow-up)* `/demos/dashboard` accessibility is 93 (< 0.95 aspiration,
      likely Recharts SVG labelling); A11y gate sits at 0.90 until fixed

## Epic 3 — ErrorBoundary coverage gaps

Demo + composed islands are wrapped. Remaining unwrapped islands are
infrastructure (`HydrationCanary`, `OfflineBanner`, `InstallButton`,
`UpdateToast`, `QueryProvider`) which render null/provider-only and would
be circular to wrap (ErrorBoundary itself depends on report-issue).

- [x] Wrap `Showcase{Dialog,Dropdown,Tabs,Toast,Form}` (#68)
- [x] Wrap `ShowcaseCharts`, `ShowcaseKpis`, `ShowcaseDataTable`,
      `ShowcaseSimples`, `ShowcasePWA` (#68)
- [x] Wrap `LargeTable`, `QueryDemo` (#66); `ContactForm`, `NewsletterForm` (#68)
- [x] Add a runtime ErrorBoundary test (render → throw → assert fallback) —
      `src/components/islands/ErrorBoundary.test.tsx` (#68)
- [ ] Wrap `ThemeIndicator` — the one demo island still unwrapped
- [ ] *(stretch)* Build a Vite/Astro plugin that auto-wraps every
      `client:*` island — satisfies #49's literal *"auto-applied via
      `astro.config.mjs`"* spec

## Epic 4 — Brand & PWA assets — ✅ closed (#67)

- [x] Replace `pwa-512` placeholder lettermark with real artwork —
      `public/icons/logo-source.svg` 3-node Inceptor loop (#67); a designer can
      swap the SVG and re-run `scripts/generate-og.mjs`
- [x] Add `pwa-192.png` (#67)
- [x] Add maskable icon variants — `pwa-maskable-512.png` (#67)
- [x] Verify `theme_color` / `background_color` match brand palette — emerald
      `#10b981` / `#0a0a0a` (#67)
- [x] Add OG image + social meta tags — `og-image.png` + og:* / twitter:* (#67)
- [x] Add `favicon.ico` alongside `favicon.svg` (#64, refreshed #67)
- [x] Add a `sitemap.xml` generator — `@astrojs/sitemap` (#64)

## Epic 5 — Dependency hygiene

- [x] Bump TypeScript `^5.6` → `^6.0.3` + `tsconfig` `ignoreDeprecations`
      `"5.0"` → `"6.0"` (TS6 was the unblock) (#79)
- [x] Bump vitest `^2` → `^4.1.7` (migrated removed `environmentMatchGlobs`
      to per-file pragma); zod `^3` → `^4.4.3`; lucide `^1.16` → `^1.17`;
      @astrojs/react `5.0.5` → `5.0.6` (#79)
- [x] Suppress Recharts SSR `width/height -1` console warnings —
      `useMounted()` guard across all 4 chart wrappers (#68)
- [x] Bump GitHub Actions to current majors (checkout v6, setup-node v6,
      upload-artifact v7, upload/deploy-pages v5) (#81)
- [ ] Re-pin `@base-ui-components/react` `1.0.0-rc.0` → stable *(still
      `rc.0` upstream; no stable to pin to)*
- [ ] Astro 5 → 6 — **blocked**: `@vite-pwa/astro@1.2.0` peer-caps at astro
      `^5`; revisit when the PWA plugin ships Astro 6 support (dependabot
      #74/#80 closed)
- [ ] Track `tailwindcss-motion` peerDep compat with future Tailwind v4
      minors *(see PR #47 open question)*
- [ ] Replace `document.execCommand('copy')` in `FeedbackFAB.astro` with
      `navigator.clipboard.writeText` — to be folded into the gallery
      `CodeSnippet` work (Epic 16)
- [ ] Resolve Recharts `Cell` deprecation in `donut-chart.tsx` *(astro-check
      hint, non-blocking)*

## Epic 6 — Production readiness

- [ ] **GitHub API auth** — token + server-side fetch for `DashboardIsland`
      and `IssuesList`; current 60 req/h unauth limit too low for production
- [x] Deployment config — GitHub Pages workflow + Cloudflare/Netlify/Vercel
      guides in `docs/deploy/` (#67); actual deploy + custom domain need the user
- [ ] Set `ANTHROPIC_API_KEY` secret for the Claude triage workflow *(user secret)*
- [x] `repoSlug` reads `PUBLIC_REPO_SLUG` env in `FeedbackFAB.astro` (#68)
- [x] Privacy-respecting analytics skeleton (Plausible / Umami), flag-gated —
      `src/lib/analytics.ts` (#68); set `PUBLIC_FLAG_ANALYTICS` to enable

## Epic 7 — Workflow & tooling

- [ ] Refine the centinela `React.createContext` grep to exclude
      `src/components/ui/` (compound-component intra-island Context is
      legitimate per CLAUDE.md rule scope)
- [ ] Promote `prometeo` / `forja` / `centinela` sub-agents to a generic
      Inceptor skill set so other repos can adopt without copying `.claude/agents/*.md`
- [x] Add `.editorconfig` (#64)
- [x] Add Prettier (`format` / `format:check` scripts) (#64)
- [ ] Add a `format:check` step in CI — scripts exist but `ci.yml` runs only
      `npm run check` + `build`; Prettier is not yet gated

## Epic 8 — Scope intentionally trimmed in v1.0

- [ ] `<DataTable>` column pinning — mentioned in #25 description, not
      in acceptance criteria; deferred
- [ ] Evaluate TanStack Form as an alternative to the
      `react-hook-form` + `zod` wrapper in `src/components/ui/form.tsx`
- [ ] Tighten Slot semantics in `src/components/ui/button.tsx` and
      `cloneElement` in `src/components/ui/form.tsx` to match Radix
      `mergeProps` if prop conflicts surface

## Epic 9 — Feature backlog — ✅ closed (#65, #67)

- [x] i18n — multi-language routing (es / en) via Astro (#67)
- [x] Feature flags (env-aware beta/prod gating) — `src/lib/flags.ts` (#65)
- [x] Error monitoring beyond ErrorBoundary — Sentry skeleton, opt-in (#67)
- [x] Contact form — `ContactForm` island + `ContactSchema`, endpoint-driven (#67)
- [x] Blog via Astro content collections (#65)
- [x] Site search — Pagefind (#65)
- [x] Newsletter signup — `NewsletterForm` island, endpoint-driven (#67)

---

## Epic 10 — Methodology layer (Shape Up + TDD + Spec-DD)

Bake the principles in [`docs/PRINCIPLES.md`](./docs/PRINCIPLES.md) into the
tooling. Framework decisions recorded in `docs/decisions/`.

- [x] Install `@testing-library/react` + `@testing-library/jest-dom` (#63)
- [x] Add `npm run tdd` watch script (#63)
- [x] Create `src/schemas/` directory; first inhabitant `login.ts`, plus
      `contact.ts` (#63, #67)
- [~] Behavior tests demonstrating red→green — RTL infra + `button.test.tsx`
      and `ErrorBoundary.test.tsx` runtime tests exist (#63, #68); the
      specific Form/Field.Control SSR-bug regression test is not yet written
- [ ] Document the Shape Up cycle cadence **in `CONTRIBUTING.md`** (Monday
      ritual, Friday hill-chart, cooldown) — cadence lives in PRINCIPLES today,
      not CONTRIBUTING
- [ ] Add `docs/lessons.md` (initially empty) — populated by centinela on the
      double-reject trigger *(file not yet created)*
- [ ] *(later, with backend archetype)* install `@hono/zod-openapi`, derive
      OpenAPI from shared schemas

## Epic 11 — Governance baseline — ✅ closed (#60, #67, #68)

- [x] `LICENSE` — MIT (#60)
- [x] `SECURITY.md` — disclosure policy + no-penalty pledge (#67)
- [x] `CODE_OF_CONDUCT.md` — Contributor Covenant reference (#67)
- [x] `.github/dependabot.yml` — weekly npm + Actions updates (#67); already
      live (opened zod + tooling PRs)
- [x] `.github/PULL_REQUEST_TEMPLATE.md` — 8-item ethics checklist + tier
      opt-out (#67)
- [x] `.github/CODEOWNERS` — template with default rule + examples (#68)
- [ ] Branch protection on `main` — runbook shipped
      (`docs/governance/branch-protection.md`, #68); enforcement is a manual
      `gh api` step the user runs once

## Epic 12 — UX / ethics quality bar

The 7 measurable criteria from [`docs/PRINCIPLES.md`](./docs/PRINCIPLES.md) §5
become mechanical gates.

- [x] `npm run a11y` — axe-core via Playwright (#63)
- [x] `npm run lighthouse` — `@lhci/cli`, budgets added (#64, #68)
- [x] Contrast check — `src/tests/ux-contrast.test.ts` (WCAG AA pairs), runs
      in `ux:check` (#63)
- [x] Motion check — `src/tests/ux-motion.test.ts`, runs in `ux:check` (#63)
- [ ] `npm run keyboard-nav` — Playwright tab-walk asserting `:focus-visible`
      ring on every interactive element *(not yet scripted)*
- [x] `npm run ux:check` — composite of contrast + motion (#63)
- [ ] CI gate on `ux:check` — `npm run check` does **not** yet include
      `ux:check`; wire it into `check` or a dedicated CI step
- [ ] Privacy toast on first page load — closes the HydrationCanary
      surveillance gap (ethics item #6) *(not yet built)*

## Epic 13 — Sub-agent contract upgrades

Landed with Phase D (#63); machine-readable checklists partly single-sourced.

- [x] **prometeo** — behavior contracts + Functional Triad classification +
      governance pre-check (#63)
- [x] **forja** — TDD-trailer discipline + Zod-not-interface + ADR-on-
      irreversible-decision forbidden actions (#63)
- [x] **centinela** — Ethics & UX gate + red→green verification + failure-
      class routing (#63)
- [x] *(was stretch)* `.claude/checklists/ethics.{json,md}` — single source for
      the 8-item checklist, referenced by PR template + centinela (#68)
- [ ] `.claude/checklists/governance.md` — governance checklist not yet
      single-sourced (only ethics is)
- [ ] *(stretch)* Spawn an `etico` sub-agent for `risk:high` issues —
      Stakeholder Analysis 7-step → ADR

---

## Review findings — multi-agent enhancements (2026-05-28)

Five subagents (engineering pragmatism, DX, brand, methodology rigor,
ethics + UX) reviewed the methodology + ethics + governance layer (PR #58).
These were folded into Epics 10–16 during Phases A–H. Status below.

### F1. Tier the ethics checklist by surface area — ✅ done (#63)

Three tiers (0/1/2) implemented; `centinela` picks the tier; required-set
encoded in `.claude/checklists/ethics.json` (#68).

### F2. Replace TDD git-log topology with a `Tdd-Red:` commit trailer — ✅ done (#63)

`Tdd-Red: <sha>` trailer (+ `Tdd-Red-Verified: inline`); survives squash/rebase.

### F3. Promote item #7 (vulnerable groups) to required — ✅ done (#63)

Required set is now #1, #7, #8 at tier-1; +#2, #6 at tier-2 (see ethics.json).

### F4. Define `risk:high` mechanically, not by self-label — ✅ done (#63)

Hard triggers (non-same-origin fetch, localStorage/IDB write of user input,
`/learn|/kids|/payments|/auth` routes, `src/lib/diagnostics.*` changes) encoded
in prometeo's plan output.

### F5. Consolidate the documentation surface — ~ partial

Custom `/docs/*` site with 7 sections shipped (#61); single-source ethics
checklist done (#68). **Still open:** forbidden-imports JSON single source,
and `INTEGRATION-PLAN.md` still lives at repo root (not moved to
`docs/history/`). See Epic 15.

### F6. Cooldown needs structural enforcement — [ ] open

Neither the hard `/goal` gate nor the tagged-branch option is implemented.

### F7. Functional Triad must change implementation, not just label — ✅ done (#63)

Each triad corner auto-promotes its optional ethics items to required;
`centinela` enforces against the declared per-issue set.

## Epic 14 — Daily DX surface

- [x] `npm run monday` — `scripts/monday.sh` (#63)
- [x] `npm run ship` — `scripts/ship.sh` (#63)
- [x] `npm run check` consolidates `build` + `check:astro` + `type-check` +
      `test` (#63) — *note: does not yet include `ux:check` (Epic 12)*
- [x] `npm run doctor` — `scripts/doctor.sh` preflight (#63), slash-command
      mirror (#68)
- [x] `npm run docs` — opens `docs/INDEX.md` (#63)
- [ ] `scripts/parallel-worktrees.sh` — parallel-safe forja worktrees *(not built)*
- [x] `scripts/new-issue.sh` — interactive `gh issue create` wrapper (#63)
- [x] `.claude/commands/monday.md`, `ship.md`, `doctor.md` slash mirrors (#68)
- [x] **TDD tiers** — `tdd-tier:strict|smoke|exempt` rubric in
      `docs/PRINCIPLES.md` §2.1 (#63)
- [ ] **chore-train lane** — long-lived `chore/<week>` branch + `centinela-light`
      *(not built)*
- [~] **Centinela verdict tokens** — `verdict_token` + `failure_class` fenced
      JSON implemented in the agent contract (#63); ADR
      `docs/decisions/0003-centinela-verdict-tokens.md` not yet written
- [x] **prometeo `parallel_safe: bool`** per issue in plan frontmatter (#63)

## Epic 15 — Docs site (custom `/docs/*` route)

*Built as a custom `/docs/[...slug].astro` route, not Starlight — Starlight
0.37 lacked `routePrefix` and 0.39+ requires Astro 6, incompatible with
`@vite-pwa/astro`. See PR #61.*

- [x] Mount docs at `/docs/*` — custom route + `DocsLayout` + `DocsSidebar` (#61)
- [x] Configure Pagefind search (#65)
- [x] Information architecture — 7 sections present (`start-here`, `stack`,
      `how-we-work`, `ethics-ux`, `building`, `reference`, `decisions`,
      plus `history`) (#61)
- [ ] **Single-source forbidden-imports JSON** at
      `.claude/checklists/forbidden-imports.json` — not yet extracted (closes
      F5's last drift point)
- [ ] `scripts/sync-stack-versions.mjs` — regenerate stack-versions from
      `package.json` in prebuild *(not built)*
- [ ] Live components: `/docs/reference/components/<name>` inline-rendering
      the real `src/components/ui/<name>` *(gallery covers this separately)*
- [ ] `npm run docs:check` — broken-link checker + Pagefind dry-run *(not built)*
- [ ] **Repo markdown reorg (F5)** — move `INTEGRATION-PLAN.md` →
      `docs/history/`, slim `README`/`CONTRIBUTING`, stub `SETUP.md`
- [ ] ADR `docs/decisions/0003-custom-docs-route.md` recording the
      Starlight-vs-custom decision *(not yet written)*
- [ ] *(stretch)* TypeDoc on `src/lib/*`; per-page "Was this helpful?" → FAB

## Epic 16 — Gallery + Demo + Marketing surface — ✅ mostly closed (#62)

- [x] **Vocabulary + scope** — Gallery / Demos / Marketing split (#62)
- [x] **Built-in, not Storybook** — Astro pages + existing visual infra (#62)
- [x] `src/content/gallery.ts` — component manifest (#62)
- [x] Gallery page shell + per-component pages `/gallery/<component>` (#62)
- [x] **Migrate** every `Showcase*` island → `/gallery/<component>` (#62)
- [x] `/gallery/index.astro` thumbnail grid (#62)
- [x] **Move routes** `/dashboard|/data|/data/large` → `/demos/*` with 301
      redirects; `/showcase` → `/gallery` (#62)
- [x] `/demos/index.astro` composed-demo index (#62)
- [x] **Rewrite `/`** as launchpad, bundling Epic 4 brand assets (#62, #67)
- [ ] `src/components/gallery/CodeSnippet.tsx` — Shiki + clipboard copy
      (also retires the `execCommand` deprecation, Epic 5) *(not built)*
- [ ] `VariantGrid.tsx` cva-aware matrix; `PropsTable.astro` from
      `<name>.gallery.ts` *(not built)*
- [ ] **Restructure Playwright baselines** per-component — unblocks Epic 1
- [ ] `tests/visual/gallery.spec.ts` — manifest-driven auto-enrolment
- [ ] *(stretch)* `<Playground>` live prop editing; `/gallery.json` endpoint

### Per-archetype demo strategy (when archetypes land)

- **backend** — `/demos/api` with Swagger UI from OpenAPI derived from `src/schemas/`
- **decentralized** — `/demos/wallet` with wallet-connect, opt-in gated
- **onion** — `/demos/onion-safe` asserts zero external requests at build time

---

## Status legend

- `[ ]` — open / not started
- `[~]` — partially done (detail in the line)
- `[x]` — done; line carries the closing PR number

## Process

1. Pick an item.
2. File a GitHub issue via the matching `.github/ISSUE_TEMPLATE/` form.
3. Reference this roadmap line in the issue body for context.
4. Once the PR merges, edit this file: check the box and append the PR #.
