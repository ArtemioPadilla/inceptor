# issue-driven-web-template — Claude Code Context

## Repository purpose

A web starter template built around **Issue-Driven Development (IDD)**. Every
feature ships as: GitHub issue → Claude triages → PR → merge → deploy. The
FeedbackFAB lets real users file issues with diagnostics pre-filled.

## Active integration

Currently executing **`INTEGRATION-PLAN.md`**: migrating from the bare
Astro 4 + Tailwind 3 starter to a full UI stack (shadcn/ui on Base UI primitives
+ TanStack + Tremor Raw + Motion + vite-pwa). Read `INTEGRATION-PLAN.md` before
starting any work on this repo.

## Stack (target)

- **Astro 5+** — islands architecture, ship zero JS by default
- **Tailwind CSS v4** via `@tailwindcss/vite` (NOT `@astrojs/tailwind` —
  deprecated for v4)
- **React 19** via `@astrojs/react` — only for interactive islands
- **shadcn/ui** with **Base UI** primitives (not Radix; see warnings below)
- **TanStack Table v8 + TanStack Virtual** — data grids
- **TanStack Query** + `@tanstack/query-persist-client-core` + `idb-keyval` —
  offline cache
- **Tremor Raw** (copy-paste, NOT `@tremor/react`) — KPI cards and dashboards
- **Recharts** — charts, themed to shadcn CSS vars
- **Motion** (`npm i motion`, post-Framer-Motion-merge) with the `LazyMotion`
  pattern; import only from `motion/react`
- **`tailwindcss-motion`** — utility-class animations, zero JS runtime
- **`@vite-pwa/astro`** — PWA + offline service worker
- **Nano Stores** — cross-island state (NOT React Context)

## File organization

- `src/components/ui/` — shadcn primitives (owned, copy-pasted)
- `src/components/islands/` — React islands (hydrated via `client:*` directives)
- `src/components/common/` — Astro components shared across pages (FeedbackFAB
  lives here)
- `src/layouts/` — Astro layouts
- `src/lib/` — utilities (`cn()`, `queryClient`, etc.)
- `src/stores/` — Nano Stores for shared state
- `src/styles/global.css` — Tailwind v4 import + CSS vars + dark-mode tokens
- `src/pages/` — Astro pages (routes)

## Path aliases

`@/*` → `./src/*` — configured in `tsconfig.json`; required by the shadcn CLI.

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | local dev server (port 4321) |
| `npm run build` | production build |
| `npm run preview` | preview the production build |
| `npm run check` | Astro typecheck + diagnostics |
| `npm run type-check` | `tsc --noEmit` |
| `npm run test` | Vitest |
| `npx shadcn@latest add <component>` | add a shadcn/ui component |
| `npx astro add <integration>` | add an Astro integration |

## IDD conventions

- **Branch naming**: `phase-N/issue-NNN-short-slug`
  (e.g. `phase-0/issue-001-upgrade-astro-5`)
- **Commit messages**: Conventional Commits + issue ref
  (`feat(ui): add Button component (#6)`)
- **PR title**: same as the issue title; PR body must include `Closes #N`
- **Issue labels**: `phase-0` through `phase-7`, plus one of `type:chore`,
  `type:feat`, `type:docs`
- **Milestones**: `v0.2 - Stack modernization` through `v1.0 - IDD-aware stack`

## Workflow: the `/goal` command

This repo ships a `/goal` slash command (`.claude/commands/goal.md`) that
orchestrates the integration plan. Usage:

```text
/goal Fase 0             → execute every issue in Phase 0
/goal v0.3               → execute every issue in milestone v0.3
/goal #5                 → execute a specific issue
/goal "add dark mode"    → interpret free-form, match against INTEGRATION-PLAN.md
```

The `/goal` command delegates to three sub-agents in `.claude/agents/`:

- **prometeo** — reads the goal, plans the work, identifies dependencies
- **forja** — executes the plan (writes code, runs commands, commits)
- **centinela** — validates (build, tests, a11y, approves PR)

## Critical warnings — read before touching code

1. ❌ **NEVER install `@astrojs/tailwind` for v4** — it doesn't exist. Tailwind
   v4 goes through `@tailwindcss/vite` directly.
2. ❌ **NEVER use React Context for state shared between islands** — Astro's
   partial hydration breaks Context across islands. Use Nano Stores.
3. ❌ **NEVER wrap the whole app in one `client:load` island** — that defeats
   Astro. Use `client:idle` / `client:visible` for non-critical islands.
4. ❌ **NEVER mix Radix and Base UI primitives in the same component** — pick
   one per component. Prefer Base UI for new code; Radix has slowed since the
   WorkOS acquisition.
5. ❌ **NEVER copy Tremor from `@tremor/react`** — use Tremor Raw (copy-paste).
   Tree-shakes naturally and you own the source.
6. ❌ **NEVER import from `framer-motion`** — Framer Motion merged with
   Motion One into the `motion` package (Dec 2024). Always import from
   `motion/react`.

## shadcn/ui + Astro: the compound-component gotcha

Components that compose multiple parts and share state (`Accordion`, `Tabs`,
controlled `Dialog`, etc.) **cannot span multiple islands**. Wrap the entire
composition in one React file under `src/components/islands/` (e.g.
`SettingsTabs.tsx`) and hydrate it as a single island. This is a documented
constraint of Astro's partial hydration model — do not fight it.

## Quality bar

- Every PR must pass `npm run build`, `npm run check`, `npm run test`.
- New UI components must appear in the `/showcase` page.
- New dashboards must appear in the `/dashboard` page.
- Accessibility regressions block merge once axe-core is wired in CI.

## References

- Full plan: `INTEGRATION-PLAN.md`
- Setup: `SETUP.md`
- Roadmap: `ROADMAP.md`
- Astro docs: <https://docs.astro.build>
- shadcn/ui + Astro: <https://ui.shadcn.com/docs/installation/astro>
- Tailwind v4 + Astro: <https://tailwindcss.com/docs/installation/framework-guides/astro>
- TanStack Table: <https://tanstack.com/table/latest>
- TanStack Query: <https://tanstack.com/query/latest>
- @vite-pwa/astro: <https://vite-pwa-org.netlify.app/frameworks/astro.html>
- Base UI: <https://base-ui.com>
- Tremor Raw: <https://raw.tremor.so>
- Motion: <https://motion.dev>
