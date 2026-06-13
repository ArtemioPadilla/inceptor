# Documentation index

When you can't remember where something lives, look here first. Each row
points you at exactly one file. The deployed docs site (when [Epic 15](../ROADMAP.md)
lands) will use the same structure.

## Foundation

Core visual and interaction principles every Inceptor contributor must know.

| Topic | Read |
|---|---|
| Design tokens (colours, radius, chart palette) | [`docs/foundation/tokens.md`](./foundation/tokens.md) |
| Density modes (compact vs comfortable) | [`docs/foundation/density.md`](./foundation/density.md) |
| Page regions, spacing rhythm, responsive breakpoints | [`docs/foundation/layout.md`](./foundation/layout.md) |
| Light/dark theming, CSS variable layering | [`docs/foundation/theming.md`](./foundation/theming.md) |
| Keyboard, focus, contrast, motion baseline | [`docs/foundation/accessibility.md`](./foundation/accessibility.md) |

## "Where do I find…?"

| I want to…                                                      | Read                                                                                                                       |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Understand the stack at a glance                                | [`CLAUDE.md`](../CLAUDE.md) — Stack section                                                                                |
| See installed package versions                                  | [`CLAUDE.md`](../CLAUDE.md) — Stack table                                                                                  |
| Understand how we position Inceptor (category, wedge, audience) | [`docs/POSITIONING.md`](./POSITIONING.md)                                                                                  |
| See the June 2026 site + codebase audit (bugs, UX, proposals)   | [`docs/AUDIT-2026-06.md`](./AUDIT-2026-06.md)                                                                              |
| See how we reach Cloudscape-grade robustness (gap roadmap)      | [`docs/CLOUDSCAPE-GAP-ROADMAP.md`](./CLOUDSCAPE-GAP-ROADMAP.md)                                                            |
| Understand the workflow / methodology                           | [`docs/PRINCIPLES.md`](./PRINCIPLES.md)                                                                                    |
| Build a surface (listing, create, details, delete, states)      | [`src/content/docs/patterns/`](../src/content/docs/patterns/) — live at `/docs/patterns/`                                  |
| Look up the ethics checklist                                    | [`docs/ETHICS.md`](./ETHICS.md)                                                                                            |
| Add a new component                                             | [`docs/COMPONENTS.md`](./COMPONENTS.md)                                                                                    |
| Compare Inceptor to Cloudscape and see the gap roadmap          | [`docs/CLOUDSCAPE-GAP-ROADMAP.md`](./CLOUDSCAPE-GAP-ROADMAP.md)                                                            |
| Build auth + DB, an AI feature, or host a backend               | [`docs/recipes/`](./recipes/) (Supabase, BYOK, hosting, CI migrations)                                                     |
| Improve the DX (FinSight learnings)                             | [`docs/DX-IMPROVEMENT-PLAN.md`](./DX-IMPROVEMENT-PLAN.md)                                                                  |
| See the Inceptor workflow + sub-agents                          | [`CLAUDE.md`](../CLAUDE.md) — Workflow section                                                                             |
| Pick the next thing to ship                                     | [`ROADMAP.md`](../ROADMAP.md)                                                                                              |
| See what's already shipped                                      | [`INTEGRATION-PLAN.md`](../INTEGRATION-PLAN.md) — historical record                                                        |
| Open a PR                                                       | `npm run ship`                                                                                                             |
| Run the Monday ritual                                           | `npm run monday`                                                                                                           |
| Diagnose a broken environment                                   | `npm run doctor`                                                                                                           |
| Open this index                                                 | `npm run docs`                                                                                                             |
| Run tests                                                       | `npm test` (Vitest) or `npm run test:visual` (Playwright)                                                                  |
| Refresh visual baselines                                        | `npm run test:visual:update` (see [`CONTRIBUTING.md`](../CONTRIBUTING.md))                                                 |
| Write an ADR                                                    | Copy [`docs/decisions/TEMPLATE.md`](./decisions/TEMPLATE.md)                                                               |
| Browse past ADRs                                                | [`docs/decisions/`](./decisions/)                                                                                          |
| Report a bug                                                    | Use the FeedbackFAB on any rendered page, or [open an issue](https://github.com/ArtemioPadilla/inceptor/issues/new/choose) |

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

| Label             | When                                   | Required artifact               |
| ----------------- | -------------------------------------- | ------------------------------- |
| `tdd-tier:strict` | default for `type:feat` and `type:fix` | red commit + `Tdd-Red:` trailer |
| `tdd-tier:smoke`  | one-line variant, CSS-only tweak       | `?raw` source assertion         |
| `tdd-tier:exempt` | typo, comment, dep bump, ADR           | no test needed                  |

### Ethics checklist tiers

| Tier       | Triggers when…                                   | Required items                          |
| ---------- | ------------------------------------------------ | --------------------------------------- |
| **Tier-0** | only `docs/**`, `*.md`, `tests/**` change        | (gate skipped)                          |
| **Tier-1** | UI tweak without new behavior                    | #1, #7, #8                              |
| **Tier-2** | new persuasive surface, telemetry, or affordance | #1, #2, #6, #7, #8 (+ Triad promotions) |

Full checklist: [`docs/ETHICS.md`](./ETHICS.md).
