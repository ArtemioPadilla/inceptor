# Principles

The non-code substrate of this scaffold. The technical stack (Astro, React 19,
shadcn/Base UI, TanStack, Tremor Raw, Motion, vite-pwa) is documented in
[`CLAUDE.md`](../CLAUDE.md). This file documents *how we work* and *what we
won't ship*.

Sections below are the single source of truth. When the constellation lands
(`backend`, `decentralized`, `onion` archetypes), each archetype inherits this
file and only overrides stack/deploy specifics in its own `archetype.md`.

---

## 1. Way of working — Shape Up + Inceptor

We use a **Shape Up** cadence, not Scrum. Solo-dev-plus-AI-sub-agents makes the
team ceremonies of Scrum degenerate. Shape Up's primitives translate cleanly:

| Shape Up | This repo |
|---|---|
| Pitch | A written issue spec — problem, appetite, solution sketch, rabbit-holes, no-gos. Examples: `INTEGRATION-PLAN.md` entries; `.github/ISSUE_TEMPLATE/` forms |
| Appetite | Phase or milestone — *fixed time, variable scope* |
| Betting table | Monday ritual: pick the next pitch, hand the scope to Claude Code |
| Cycle | The phase duration |
| Cooldown | 2-day gap after each phase — no new features, only docs / refactors / dep bumps / debt-paying |

**Cooldown is enforced structurally, not on honor.** Between phases, `main`
carries a `cooldown/<phase>-end` git tag. `prometeo` refuses to plan
`type:feat` issues until the tag is replaced by `cooldown-cleared` (which
requires the cooldown debt list to be empty — see Epic 13 for the mechanism).
Only `type:chore` and `type:docs` pass during cooldown.

The Agile Manifesto values (working software over docs, responding to change,
collaboration over contracts, individuals over process) live as **taste**, not
ceremony.

See [`docs/decisions/0001-shape-up-over-scrum.md`](./decisions/0001-shape-up-over-scrum.md)
for the full rationale.

### The Monday ritual (15 min, solo)

1. Open [`ROADMAP.md`](../ROADMAP.md), pick a phase / milestone — that's the appetite
2. Open or write the pitch as a GitHub issue (use `.github/ISSUE_TEMPLATE/`)
3. Hand the scope to Claude Code — prometeo plans, you approve, forja+centinela execute per issue
4. Friday afternoon: hill-chart update on `ROADMAP.md` (still figuring out vs executing)
5. End of phase: cooldown — no new features, only debt-paying work

Lessons-learned is captured in `docs/lessons.md` **only when centinela rejects
the same issue twice in a row**. Specific trigger, low overhead — no recurring
retro ceremony.

---

## 2. TDD — red → green → refactor

`type:feat` and `type:fix` issues ship a **failing behavior test first**, then
the implementation. Enforcement uses **commit trailers**, not git-log topology
(which breaks on squash-merges, rebases, and legitimate single-commit fixes).

### 2.1 The TDD tier rubric

Not every change deserves a red→green dance. Three tiers, set via
`tdd-tier:` issue label:

| Tier | Applies when | Required artifact |
|---|---|---|
| `tdd-tier:strict` | Default for `type:feat` and `type:fix` that change behavior | A `test(...)` commit *and* a `Tdd-Red: <sha>` trailer on the green commit *(or `Tdd-Red-Verified: inline` if test and fix landed in one commit after the test was verified red in-tree)* |
| `tdd-tier:smoke` | One-line variants, CSS-only tweaks, prop additions with default | A `?raw` source-text or render-once assertion is enough |
| `tdd-tier:exempt` | Copy fixes, comments, ADR additions, dep bumps with no behavior change | No new test required |

`prometeo` proposes the tier in its plan output; the human accepts or edits
the label before the run starts. `centinela` enforces against the labelled
tier, not against a global rule.

### 2.2 The trailer convention

The green commit carries a Git trailer:

```
feat(ui): button supports loading state (#N)

Adds a `loading` prop that disables clicks and shows a spinner.

Tdd-Red: 0a1b2c3
```

`Tdd-Red: <sha>` points back to the originating red commit on the branch
(survives rebase, survives squash because the trailer is preserved in the
merge commit message). For legitimate single-commit work (regression
test+fix in one), use `Tdd-Red-Verified: inline` — declares that the test
was written and verified red in the working tree before the fix.

### 2.3 The loop

- **prometeo** emits a `## Behavior contracts` section per issue: the 1-3
  user-observable behaviors that must hold (e.g. *"Field.Control renders
  without `useId` SSR error"*, *"Button with `loading` prop disables clicks"*).
  Also proposes a `tdd-tier:` label.
- **forja** writes the failing test, commits it (`test(scope): red for
  <behavior> (#N)`), runs `vitest --run` to confirm red, writes the
  implementation, commits it with the `Tdd-Red:` trailer pointing at the
  red commit's SHA.
- **centinela** greps the green commit for the trailer and re-runs the
  red commit's test from its tree to confirm it failed.

Source-text `?raw` assertions stay as smoke tests but they don't count as a
strict-tier behavior contract. The Form ↔ Field.Control SSR bug from Phase 1
would have been caught by a real render test.

Bugs found in production: **regression test first, fix second** — non-negotiable
regardless of tier.

---

## 3. Spec-DD — Zod as the source of truth

Every cross-boundary type is a Zod schema, not a TypeScript interface. Types are
derived (`z.infer<typeof X>`), never authored alongside the schema.

- Schemas live in `src/schemas/`
- Forms: existing pattern in `src/components/ui/form.tsx` (already Zod-backed)
- Backend archetype (when it lands): `@hono/zod-openapi` produces OpenAPI specs
  from the same schemas → typed client + runtime validation share one source
- Tests assert **against** schemas
  (`expect(UserSchema.safeParse(input).success).toBe(true)`); schemas are not
  replaced by tests
- TypeScript `interface` for cross-boundary types is forbidden — use Zod, then
  `z.infer`

---

## 4. Persuasive design — ethical by default

This project ships persuasive technology. The FeedbackFAB is a *reduction-tech
trigger*; the sub-agent loop is a *tunneling sequence*; ErrorBoundary fallbacks are
*social-actor consolations*. We've been doing captology without naming it.

The full framework — grounded in BJ Fogg's *Persuasive Technology* (2003) plus
modern dark-patterns guidance — lives in [`docs/ETHICS.md`](./ETHICS.md).

Every UI-affecting PR passes the **8-item ethics checklist** before merge. The
checklist is **tiered** by PR surface area (full rubric in `docs/ETHICS.md`):

- **Tier-0** (docs / tests / typo fixes via path glob) — auto-skip
- **Tier-1** (UI tweaks that don't add behavior) — required items: **#1, #7, #8**
- **Tier-2** (new persuasive surface, new affordance, new flow, new telemetry) — required items: **#1, #2, #6, #7, #8** (Functional Triad classification may promote optional items #3, #4, #5 to required — see `docs/ETHICS.md`)

The 8 items:

1. Intent declared
2. No deception, no coercion
3. Asymmetric persistence justified
4. Borrowed credibility honest
5. Emotional cues reciprocal or disclosed
6. Surveillance overt and supportive
7. Vulnerable-group impact considered
8. Unintended-but-predictable outcomes named

**Item #7 is required at every non-zero tier** — it catches the most common
real-harm vector (quiet exclusion of screen-reader / anxious / non-native /
motor-impaired users), which the previous (1, 2, 6, 8) required set missed.

### `risk:high` is mechanical, not self-labelled

`prometeo` auto-applies `risk:high` when its planned changes match any of:

- New network request to a non-same-origin endpoint
- New `localStorage` / `IndexedDB` / cookie write of user input
- Routes under `/learn`, `/kids`, `/payments`, `/auth`
- Any change to `src/lib/diagnostics.*` or telemetry surfaces

`risk:high` requires the [Stakeholder Analysis ADR](./ETHICS.md#stakeholder-analysis)
in `docs/decisions/` before merge.

Mechanical checks via `npm run ux:check` catch the dark-pattern signatures that
have measurable forms (deceptive defaults, `prefers-reduced-motion` violations,
contrast failures, accessibility-washed CTAs — see ETHICS.md "false hierarchy").

---

## 5. UX/UI quality bar

7 measurable criteria, each gated in CI when their tooling lands (tracked in
[`ROADMAP.md`](../ROADMAP.md) Epic 12):

| # | Criterion | Tool | Threshold |
|---|---|---|---|
| 1 | a11y violations | axe-core via Playwright | 0 serious, 0 critical |
| 2 | Lighthouse Performance | `@lhci/cli` mobile preset | ≥ 90 |
| 3 | Lighthouse a11y + Best Practices | `@lhci/cli` mobile preset | ≥ 95 each |
| 4 | `prefers-reduced-motion` respected | lint: every `motion/react animate=` is inside `LazyMotion` + `useReducedMotion()` branch (or `tailwindcss-motion`) | 0 unguarded |
| 5 | WCAG AA contrast | build-time check on `:root` / `.dark` var pairs | 0 failures (≥ 4.5:1) |
| 6 | Keyboard nav + visible focus | Playwright tab-walk on `/showcase` | 100% reachable + `:focus-visible` ring |
| 7 | Theme-toggle zero-flash on Slow 3G | Playwright with network throttling | 0 FOUC frames |

Visual-regression CI (`tests/__screenshots__/`) and `ux:check` are **separate
gates** with a shared Playwright runner — visual catches *unintended* change,
ux:check catches *intentional* harm.

---

## 6. Governance baseline

Minimum baseline (tracked in [`ROADMAP.md`](../ROADMAP.md) Epic 11):

- **LICENSE** — MIT for the scaffold; switch per project as needed
- **`SECURITY.md`** — vulnerability disclosure policy
- **`CODE_OF_CONDUCT.md`** — Contributor Covenant 2.1
- **`.github/dependabot.yml`** — weekly npm + Actions dependency updates
- **ADRs in `docs/decisions/`** — every irreversible architectural decision
  gets one ([template](./decisions/TEMPLATE.md))
- **CODEOWNERS** — optional; useful when the scaffold becomes shared
- **Branch protection** on `main`: require PR, require status checks, require
  linear history

---

## 7. The non-negotiables

These are absolute. Sub-agents enforce them; centinela rejects PRs that violate:

- Never push to `main` — every change goes through a feature branch + PR
- Never bypass centinela
- Never ship code that fails the 8-item ethics checklist (required items)
- Never use `--no-verify` or skip hooks
- Never use the prohibitions in [`CLAUDE.md`](../CLAUDE.md): `@radix-ui/*`,
  `framer-motion`, `@tremor/react`, `@astrojs/tailwind`, cross-island
  `React.createContext`

---

## References

- Fogg, B.J. (2003). *Persuasive Technology: Using Computers to Change What We
  Think and Do.* Morgan Kaufmann.
- Beck, K. et al. (2001). [Manifesto for Agile Software Development.](https://agilemanifesto.org/)
- Singer, R. (2019). [Shape Up: Stop Running in Circles and Ship Work that Matters.](https://basecamp.com/shapeup) Basecamp.
- Beck, K. (2002). *Test-Driven Development: By Example.* Addison-Wesley.
- European Commission (2022). [Digital Services Act, Article 25.](https://eur-lex.europa.eu/eli/reg/2022/2065)
