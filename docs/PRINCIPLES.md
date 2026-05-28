# Principles

The non-code substrate of this scaffold. The technical stack (Astro, React 19,
shadcn/Base UI, TanStack, Tremor Raw, Motion, vite-pwa) is documented in
[`CLAUDE.md`](../CLAUDE.md). This file documents *how we work* and *what we
won't ship*.

Sections below are the single source of truth. When the constellation lands
(`backend`, `decentralized`, `onion` archetypes), each archetype inherits this
file and only overrides stack/deploy specifics in its own `archetype.md`.

---

## 1. Way of working — Shape Up + IDD

We use a **Shape Up** cadence, not Scrum. Solo-dev-plus-AI-sub-agents makes the
team ceremonies of Scrum degenerate. Shape Up's primitives translate cleanly:

| Shape Up | This repo |
|---|---|
| Pitch | A written issue spec — problem, appetite, solution sketch, rabbit-holes, no-gos. Examples: `INTEGRATION-PLAN.md` entries; `.github/ISSUE_TEMPLATE/` forms |
| Appetite | Phase or milestone — *fixed time, variable scope* |
| Betting table | Monday ritual: pick the next pitch, invoke `/goal <scope>` |
| Cycle | The phase duration |
| Cooldown | 2-day gap after each phase — no new features, only docs / refactors / dep bumps / debt-paying |

The Agile Manifesto values (working software over docs, responding to change,
collaboration over contracts, individuals over process) live as **taste**, not
ceremony.

See [`docs/decisions/0001-shape-up-over-scrum.md`](./decisions/0001-shape-up-over-scrum.md)
for the full rationale.

### The Monday ritual (15 min, solo)

1. Open [`ROADMAP.md`](../ROADMAP.md), pick a phase / milestone — that's the appetite
2. Open or write the pitch as a GitHub issue (use `.github/ISSUE_TEMPLATE/`)
3. Invoke `/goal <scope>` — prometeo plans, you approve, forja+centinela execute per issue
4. Friday afternoon: hill-chart update on `ROADMAP.md` (still figuring out vs executing)
5. End of phase: cooldown — no new features, only debt-paying work

Lessons-learned is captured in `docs/lessons.md` **only when centinela rejects
the same issue twice in a row**. Specific trigger, low overhead — no recurring
retro ceremony.

---

## 2. TDD — red → green → refactor

Every `type:feat` or `type:fix` issue ships a **failing behavior test first**,
in its own commit, before any production code commit.

- **prometeo** emits a `## Behavior contracts` section per issue: the 1-3
  user-observable behaviors that must hold (e.g. *"Field.Control renders
  without `useId` SSR error"*, *"Button with `loading` prop disables clicks"*)
- **forja** writes the failing test (`tests/<issue>.test.{ts,tsx}` or
  `src/**/<name>.test.{ts,tsx}`), commits as
  `test(scope): red for <behavior> (#N)`, runs `vitest --run` to confirm red,
  then writes implementation, commits as `feat(scope): green for <behavior> (#N)`
- **centinela** verifies `git log --oneline` shows the test-commit before the
  feat-commit on the branch, and re-runs the test from the red commit's tree to
  confirm it actually failed

Source-text `?raw` assertions (the current style) stay as **cheap smoke tests**,
but they no longer count as the behavior contract. The Form ↔ Field.Control SSR
bug from Phase 1 would have been caught by a real render test.

Bugs found in production get a **regression test first, fix second** — this is
non-negotiable for centinela.

`type:chore` and `type:docs` issues opt out of TDD.

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
trigger*; `/goal` is a *tunneling sequence*; ErrorBoundary fallbacks are
*social-actor consolations*. We've been doing captology without naming it.

The full framework — grounded in BJ Fogg's *Persuasive Technology* (2003) plus
modern dark-patterns guidance — lives in [`docs/ETHICS.md`](./ETHICS.md). The
load-bearing artifact is the **8-item ethics checklist**. Every UI-affecting PR
passes it before merge:

1. Intent declared (required)
2. No deception, no coercion (required)
3. Asymmetric persistence justified
4. Borrowed credibility honest
5. Emotional cues reciprocal or disclosed
6. Surveillance overt and supportive (required)
7. Vulnerable-group impact considered
8. Unintended-but-predictable outcomes named (required)

Required items must have non-empty answers in the PR body; others may be
"N/A" with justification. Trivial doc/test-only PRs skip the gate.

Mechanical checks via `npm run ux:check` catch the 70% of dark patterns that
have measurable signatures (deceptive defaults, `prefers-reduced-motion`
violations, contrast failures, etc.).

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
