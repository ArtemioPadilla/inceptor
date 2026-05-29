# Documentation index

When you can't remember where something lives, look here first. Each row
points you at exactly one file. The deployed docs site (when [Epic 15](../ROADMAP.md)
lands) will use the same structure.

## "Where do I find…?"

| I want to… | Read |
|---|---|
| Understand the stack at a glance | [`CLAUDE.md`](../CLAUDE.md) — Stack section |
| See installed package versions | [`CLAUDE.md`](../CLAUDE.md) — Stack table |
| Understand the workflow / methodology | [`docs/PRINCIPLES.md`](./PRINCIPLES.md) |
| Look up the ethics checklist | [`docs/ETHICS.md`](./ETHICS.md) |
| Add a new component | [`docs/COMPONENTS.md`](./COMPONENTS.md) |
| See the Inceptor workflow + sub-agents | [`CLAUDE.md`](../CLAUDE.md) — Workflow section |
| Pick the next thing to ship | [`ROADMAP.md`](../ROADMAP.md) |
| See what's already shipped | [`INTEGRATION-PLAN.md`](../INTEGRATION-PLAN.md) — historical record |
| Open a PR | `npm run ship` |
| Run the Monday ritual | `npm run monday` |
| Diagnose a broken environment | `npm run doctor` |
| Open this index | `npm run docs` |
| Run tests | `npm test` (Vitest) or `npm run test:visual` (Playwright) |
| Refresh visual baselines | `npm run test:visual:update` (see [`CONTRIBUTING.md`](../CONTRIBUTING.md)) |
| Write an ADR | Copy [`docs/decisions/TEMPLATE.md`](./decisions/TEMPLATE.md) |
| Browse past ADRs | [`docs/decisions/`](./decisions/) |
| Report a bug | Use the FeedbackFAB on any rendered page, or [open an issue](https://github.com/ArtemioPadilla/inceptor/issues/new/choose) |

## Quick refs

### Forbidden imports

Single source of truth: `docs/PRINCIPLES.md` §7 (will move to a JSON file in
Epic 15). Never use:

- `@astrojs/tailwind` (Tailwind v4 uses `@tailwindcss/vite`)
- `@radix-ui/*` (use `@base-ui-components/react`)
- `framer-motion` (use `motion/react`)
- `@tremor/react` (use the copy-pasted Tremor Raw components)
- `React.createContext` for state shared between islands (use Nano Stores)

### Branch naming

`phase-N/issue-NNN-short-slug` for plan-driven work, `chore/<thing>` for
maintenance, `docs/<thing>` for doc-only changes, `fix/<thing>` for hotfixes.

### Commit format

Conventional Commits + issue ref: `feat(ui): add Button component (#6)`. Use
the `Tdd-Red: <sha>` trailer on green commits (see PRINCIPLES.md §2.2).

### TDD tiers

| Label | When | Required artifact |
|---|---|---|
| `tdd-tier:strict` | default for `type:feat` and `type:fix` | red commit + `Tdd-Red:` trailer |
| `tdd-tier:smoke` | one-line variant, CSS-only tweak | `?raw` source assertion |
| `tdd-tier:exempt` | typo, comment, dep bump, ADR | no test needed |

### Ethics checklist tiers

| Tier | Triggers when… | Required items |
|---|---|---|
| **Tier-0** | only `docs/**`, `*.md`, `tests/**` change | (gate skipped) |
| **Tier-1** | UI tweak without new behavior | #1, #7, #8 |
| **Tier-2** | new persuasive surface, telemetry, or affordance | #1, #2, #6, #7, #8 (+ Triad promotions) |

Full checklist: [`docs/ETHICS.md`](./ETHICS.md).
