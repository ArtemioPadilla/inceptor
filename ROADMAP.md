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

## Epic 10 — Methodology layer (Shape Up + TDD + Spec-DD)

Bake the principles documented in [`docs/PRINCIPLES.md`](./docs/PRINCIPLES.md)
into the tooling. The framework decisions are recorded in `docs/decisions/`;
the foundational docs landed with the methodology-layer PR. Remaining work:

- [ ] Install `@testing-library/react` + `@testing-library/jest-dom` —
      needed for behavior tests (currently we have only `?raw` source-text
      assertions)
- [ ] Write 3-4 example behavior tests demonstrating the red→green pattern;
      include at least one that would have caught the Form/Field.Control SSR
      bug surfaced in PR #17
- [ ] Add `npm run tdd` watch script (`vitest --watch` with focused output)
- [ ] Create `src/schemas/` directory; extract the `ShowcaseForm` Zod schema
      as the first inhabitant
- [ ] Document the Shape Up cycle cadence in `CONTRIBUTING.md` (Monday ritual,
      Friday hill-chart update, cooldown discipline)
- [ ] Add `docs/lessons.md` (initially empty) — populated by centinela on the
      double-reject trigger
- [ ] *(later, with backend archetype)* install `@hono/zod-openapi`, derive
      OpenAPI from shared schemas

## Epic 11 — Governance baseline

Standard files every personal scaffold should ship with. Cheap to land.

- [ ] `LICENSE` — pick MIT (default for personal scaffold; switch per project)
- [ ] `SECURITY.md` — vulnerability disclosure policy with contact email and
      no-penalty pledge
- [ ] `CODE_OF_CONDUCT.md` — Contributor Covenant 2.1 verbatim
- [ ] `.github/dependabot.yml` — weekly npm + Actions dependency updates
- [ ] `.github/PULL_REQUEST_TEMPLATE.md` — includes the 8-item ethics checklist
      (required items #1, #2, #6, #8) plus a doc/test-only opt-out toggle
- [ ] `.github/CODEOWNERS` *(optional)* — useful if the scaffold becomes
      shared
- [ ] Branch protection on `main`: require PR, status checks, linear history

## Epic 12 — UX / ethics quality bar

The 7 measurable criteria from [`docs/PRINCIPLES.md`](./docs/PRINCIPLES.md) §5
become mechanical gates. Each tool stands up independently.

- [ ] `npm run a11y` — axe-core via Playwright on `/`, `/showcase`, `/dashboard`
      (light + dark) — 0 serious / 0 critical
- [ ] `npm run lighthouse` — `@lhci/cli` on `/` and `/dashboard`, mobile preset,
      Perf ≥ 90 / A11y ≥ 95 / BP ≥ 95
- [ ] `npm run contrast` — build-time check on `:root` / `.dark` CSS var pairs
      against WCAG AA 4.5:1
- [ ] `npm run motion-check` — lint that every `motion/react` `animate=` is
      inside `<LazyMotion>` with `useReducedMotion()` branch (or uses
      `tailwindcss-motion` which respects the OS pref by default)
- [ ] `npm run keyboard-nav` — Playwright tab-walk through `/showcase` asserting
      visible `:focus-visible` ring on every interactive element
- [ ] `npm run ux:check` — composite of all the above
- [ ] CI integration: gate on `ux:check` (or split Lighthouse to nightly if PR
      runtime becomes painful)
- [ ] Privacy toast on first page load — *"Diagnostics are captured locally and
      only sent if you open an issue"* — closes the surveillance gap in the
      HydrationCanary capture (ethics checklist item #6)

## Epic 13 — Sub-agent contract upgrades

After Epics 10–12 land (the docs and tooling need to exist first), the
sub-agents enforce the framework. Order matters; do this last.

- [ ] **prometeo** — emit `## Behavior contracts` section per `type:feat`/`fix`
      issue (TDD seeds); classify each `type:feat` by Functional Triad corner
      (tool / medium / social actor); add governance pre-check step reading
      `.claude/checklists/governance.md`
- [ ] **forja** — add to Forbidden actions: *"Never commit production code in a
      branch without a prior `test(...)` commit that initially failed"*; require
      any cross-boundary type to start as a Zod schema in `src/schemas/`; any
      irreversible architectural decision triggers an ADR commit in
      `docs/decisions/`
- [ ] **centinela** — add step 3.5 "Ethics & UX gate" running `npm run ux:check`
      + greppable presence-check of the 8-item checklist in the PR body; add
      step 4.5 "Red→green verification" checking `git log` ordering and
      re-running the red commit's test; introduce `ETHICS_OR_UX_FAIL` failure
      classification distinct from `BUILD_FAIL` so the orchestrator routes
      back to forja with the right prompt
- [ ] *(stretch)* Create `.claude/checklists/ethics.md` and
      `.claude/checklists/governance.md` — machine-readable versions of the
      checklists in `docs/ETHICS.md` so sub-agents reference them without
      duplicating the text
- [ ] *(stretch)* Spawn a new `etico` sub-agent for `risk:high` issues —
      performs the Stakeholder Analysis 7-step (see `docs/ETHICS.md`) and
      writes the resulting ADR

---

## Review findings — multi-agent enhancements (2026-05-28)

Five subagents (engineering pragmatism, DX, brand, methodology rigor,
ethics + UX) independently reviewed the methodology + ethics + governance
layer that landed in PR #58. These enhancements should be folded into
Epics 10–13 **before implementation begins** — they close real gaps in
the framework as currently documented.

Each item names the source agent(s) and the doc/epic it modifies.

### F1. Tier the ethics checklist by surface area

*Source: DX subagent.* Modifies: `docs/ETHICS.md`, Epic 12, Epic 13.

Eight questions on a typo PR will erode the rule. Define three tiers:

- **Tier-0** (`docs/**`, `*.md`, `*.mdx`, `tests/**`, typo PRs) — auto-skip via path glob
- **Tier-1** (UI tweaks — color, copy, layout that doesn't change behavior) — 3 questions only: intent (#1), vulnerable-group (#7), predictable-misuse (#8)
- **Tier-2** (new persuasive surface — new affordance, new flow, new telemetry) — all 8 questions

`centinela` picks the tier from the PR diff. Required-set in `docs/ETHICS.md` updates accordingly.

### F2. Replace TDD git-log topology with a `Tdd-Red:` commit trailer

*Source: Pragmatism + Methodology subagents.* Modifies: `docs/PRINCIPLES.md` §2, Epic 13.

The PRINCIPLES.md §2 spec ("test commit precedes feat commit on the branch") breaks on:

- Squash-merges (destroy commit ordering)
- Rebases (linearize history, reorder commits)
- Legitimate test+fix-in-one regression commits

Replace with a commit-trailer convention: the green commit carries `Tdd-Red: <sha>` pointing back to the originating red commit. Survives rebase + squash. Single-commit legit shortcut: `Tdd-Red-Verified: inline` (declares the test was written and verified red in the same working tree before the fix). `centinela` greps for the trailer.

### F3. Promote item #7 (vulnerable groups) to required in the ethics checklist

*Source: Ethics + UX subagent.* Modifies: `docs/ETHICS.md`, `docs/PRINCIPLES.md` §4, Epic 11 (PR template).

Current required set (#1, #2, #6, #8) catches intent, deception, surveillance, and foreseeable misuse — but misses the most common real-harm vector: flows that quietly exclude screen-reader users, anxious users, non-native readers, or motor-impaired users. Promote #7 to required. Allow `N/A — non-user-visible change` as the only opt-out, justified in one line.

### F4. Define `risk:high` mechanically, not by self-label

*Source: Ethics + UX subagent.* Modifies: `docs/PRINCIPLES.md` §4, `docs/ETHICS.md` §Stakeholder Analysis, Epic 13.

Self-labelling will be under-applied. Encode hard triggers in `prometeo`'s plan output that auto-apply `risk:high`:

- New network request to a non-same-origin endpoint
- New `localStorage` / `IndexedDB` / cookie write of user input
- Routes under `/learn`, `/kids`, `/payments`, `/auth`
- Any change to `src/lib/diagnostics.*` or telemetry surfaces

If any trigger fires, `risk:high` is auto-applied and `centinela` blocks merge until the Stakeholder Analysis ADR exists in `docs/decisions/`.

### F5. Consolidate the documentation surface

*Source: DX subagent.* Modifies: all top-level markdown files, README.md.

Today: 8 markdown files (`README`, `CLAUDE`, `PRINCIPLES`, `ETHICS`, `COMPONENTS`, `CONTRIBUTING`, `ROADMAP`, `INTEGRATION-PLAN`, `SETUP`). Forbidden-imports list lives in three of them. They will drift.

**Decision deferred** to the docs-strategy subagent in Epic 14 (see below). Two paths:

- (a) Consolidate to ~4 files keyed by reader-question (`START-HERE`, `STACK`, `HOW-WE-WORK`, `BUILDING`)
- (b) Keep current structure + add `docs/INDEX.md` keyed by "where do I find X?"

### F6. Cooldown needs structural enforcement, not honor system

*Source: Methodology + DX subagents.* Modifies: `docs/PRINCIPLES.md` §1 (cadence), Epic 13.

A 2-day "no new features" rule held by self-discipline alone will be skipped. Pick one:

- **Hard**: `/goal` refuses to start a new phase if `< 2 working days` have elapsed since the last phase's last merged PR on `main`, unless invoked as `/goal --skip-cooldown <reason>` — the friction of typing the reason IS the cooldown.
- **Tagged**: between phases, `main` is tagged `cooldown/<phase>-end`. `prometeo` refuses to plan `type:feat` issues until the tag is `cooldown-cleared`. Only `type:chore` and `type:docs` pass the gate.

Recommendation: the tagged option — mechanical, no orchestrator state.

### F7. Functional Triad must change implementation, not just label it

*Source: Methodology + Ethics subagents.* Modifies: `docs/ETHICS.md` §Functional Triad, Epic 13.

Current spec: `prometeo` classifies each `type:feat` by triad corner. Pure labelling — doesn't change downstream behavior. Wire each corner to the optional checklist items it auto-promotes to required:

| Triad corner | Auto-promote these optional items to required |
|---|---|
| **Tool** (extends capability) | #3 (asymmetric persistence) |
| **Medium** (presents experience) | #5 (emotional reciprocity), #7 (already required after F3 — included for emphasis) |
| **Social actor** (takes persona / makes claims) | #4 (borrowed credibility), #5 (emotional reciprocity) |

`prometeo`'s plan output declares the required-set for the issue. `centinela` enforces against the declared set, not just the global required-set.

---

## Status legend

- `[ ]` — open / not started
- `[x]` — done; replace the line with the closing PR number and date

## Process

1. Pick an item.
2. File a GitHub issue via the matching `.github/ISSUE_TEMPLATE/` form.
3. Reference this roadmap line in the issue body for context.
4. Once the PR merges, edit this file: check the box and append the PR #.
