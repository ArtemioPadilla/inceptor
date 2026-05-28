# issue-driven-web-template — Claude Code Context

## Repository purpose

A web starter template built around **Issue-Driven Development (IDD)**. Every
feature ships as: GitHub issue → Claude triages → PR → merge → deploy. The
FeedbackFAB lets real users file issues with diagnostics pre-filled.

## Active integration

Integration complete; `INTEGRATION-PLAN.md` is the historical record of every
phase (0–7) that brought this repo from a bare Astro 4 + Tailwind 3 starter to
the full UI stack now in place.

## Stack (installed)

| Package | Version | Role |
|---|---|---|
| `astro` | `^5.18.1` | islands architecture, ship zero JS by default |
| `@astrojs/react` | `^5.0.5` | React 19 integration |
| `react` / `react-dom` | `^19.2.6` | only for interactive islands |
| `tailwindcss` | `^4.3.0` | via `@tailwindcss/vite` (NOT `@astrojs/tailwind`) |
| `@tailwindcss/vite` | `^4.3.0` | Vite plugin for Tailwind v4 |
| `tailwindcss-motion` | `^1.1.1` | CSS-only motion utilities (`@plugin` directive) |
| `@base-ui-components/react` | `^1.0.0-rc.0` | shadcn primitives (NOT Radix) |
| `class-variance-authority` | `^0.7.1` | variant API for shadcn |
| `clsx` + `tailwind-merge` | `^2.1.1` / `^3.6.0` | `cn()` helper in `src/lib/utils.ts` |
| `lucide-react` | `^1.16.0` | icons |
| `react-hook-form` + `zod` + `@hookform/resolvers` | `^7.76.1` / `^3.25.76` / `^5.4.0` | `<Form>` |
| `@tanstack/react-table` + `@tanstack/react-virtual` | `^8.21.3` / `^3.13.26` | `<DataTable>` |
| `@tanstack/react-query` + `@tanstack/query-persist-client-core` | `^5.100.14` | per-island Query + persistence |
| `idb-keyval` | `^6.2.4` | IndexedDB persister backend |
| `nanostores` + `@nanostores/react` | `^1.3.0` / `^1.1.0` | cross-island state |
| `recharts` | `^3.8.1` | charts (lazy chunk) |
| `motion` | `^12.40.0` | React animations (LazyMotion + domAnimation) |
| `@vite-pwa/astro` (devDep) + `workbox-window` | `^1.2.0` / `^7.4.1` | PWA + SW + offline cache |
| `vitest` | `^2.0.0` | tests |
| `typescript` | `^5.6.0` | strict mode |

> `@radix-ui/*`, `@tremor/react`, `framer-motion`, and `@astrojs/tailwind` are intentionally absent (see warnings below).

## File organization

- `src/components/ui/` — shadcn primitives (owned, copy-pasted)
- `src/components/ui/charts/` — Recharts wrappers themed to shadcn CSS vars
- `src/components/islands/` — React islands (hydrated via `client:*` directives)
- `src/components/common/` — Astro components shared across pages (FeedbackFAB lives here)
- `src/layouts/` — Astro layouts
- `src/lib/` — utilities (`cn()`, `queryClient`, etc.)
- `src/stores/` — Nano Stores for cross-island state
- `src/styles/global.css` — Tailwind v4 import + CSS vars + dark-mode tokens
- `src/pages/` — Astro pages (routes)
- `src/tests/` — Vitest tests for pages, configs, and docs
- `src/types/` — shared TypeScript types

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

## Workflow: native `/goal` + IDD sub-agents

This repo uses Claude Code's **native** `/goal` command (Claude Code v2.1.139+)
with three project-specific sub-agents under `.claude/agents/`. Native `/goal`
sets a completion condition and keeps Claude working across turns until a small
fast model confirms it's met. The sub-agents are the building blocks Claude uses
inside that loop.

### Sub-agents (invoked via the Task tool)

- **prometeo** — reads `INTEGRATION-PLAN.md` and decomposes a phase, milestone,
  or issue into an ordered, dependency-aware execution plan. Does not write code.
- **forja** — implements a single issue: writes code, runs `npx` commands, makes
  atomic commits on a feature branch. Does not validate or open PRs.
- **centinela** — validates forja's work (build, type-check, tests,
  forbidden-import scan) and returns APPROVED or REJECTED.

### Example `/goal` conditions

```text
/goal Ship every Phase 1 issue from INTEGRATION-PLAN.md: PRs open, centinela
      APPROVED, working tree clean. Stop after 30 turns.

/goal Land issue #N from INTEGRATION-PLAN.md. End state: PR open against main,
      centinela APPROVED in this transcript, branch named per the plan.

/goal Open PRs that close every Phase 0 issue from INTEGRATION-PLAN.md. Use
      prometeo to plan, forja per issue, centinela to gate each PR.
```

Run `/goal` with no arguments to check status; `/goal clear` to cancel. See
<https://code.claude.com/docs/en/goal> for the full reference.

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

Components that compose multiple parts and share state — `Dialog`, `Tabs`,
controlled `DropdownMenu`, `Toast` — **cannot span multiple islands**. Astro
hydrates each `client:*` boundary as its own React root, so a `<Dialog>` wrapper
in one island won't see a `<DialogContent>` in a separate island.

### Wrong

```astro
---
import { Dialog, DialogTrigger, DialogContent } from '@/components/ui/dialog';
---
<DialogTrigger client:load>Open</DialogTrigger>
<DialogContent client:load>...</DialogContent>
```

Each `client:*` creates a separate React root; trigger and content cannot share state.

### Right

Wrap the whole composition in **one** React file under `src/components/islands/`:

`src/components/islands/MyDialogIsland.tsx`:

```tsx
import { Dialog, DialogTrigger, DialogContent } from '@/components/ui/dialog';

export default function MyDialogIsland() {
  return (
    <Dialog>
      <DialogTrigger>Open</DialogTrigger>
      <DialogContent>...</DialogContent>
    </Dialog>
  );
}
```

Then hydrate as a single island in the page:

```astro
<MyDialogIsland client:visible />
```

This is what `src/components/islands/ShowcaseDialog.tsx`, `ShowcaseTabs.tsx`,
`ShowcaseDropdown.tsx`, `ShowcaseToast.tsx`, and `ShowcaseForm.tsx` all do today.

## IDD reporting (Phase 7)

React islands are wrapped in `<ErrorBoundary>` (from
`src/components/islands/ErrorBoundary.tsx`) which captures runtime errors and
builds a pre-filled GitHub issue with stack, component path, URL, and user agent.
The `HydrationCanary` island listens for `window 'error'` events and stores
hydration-mismatch URLs in `sessionStorage`; the `FeedbackFAB` reads that key on
click. See `docs/COMPONENTS.md` for opt-in usage.

## Quality bar

- Every PR must pass `npm run build`, `npm run check`, `npm run test`.
- New UI components must appear in the `/showcase` page.
- New dashboards must appear in the `/dashboard` page.
- Accessibility regressions block merge once axe-core is wired in CI.

## References

- Full plan: `INTEGRATION-PLAN.md`
- Setup: `SETUP.md`
- Roadmap: `ROADMAP.md`
- Component guide: `docs/COMPONENTS.md`
- Astro docs: <https://docs.astro.build>
- shadcn/ui + Astro: <https://ui.shadcn.com/docs/installation/astro>
- Tailwind v4 + Astro: <https://tailwindcss.com/docs/installation/framework-guides/astro>
- TanStack Table: <https://tanstack.com/table/latest>
- TanStack Query: <https://tanstack.com/query/latest>
- @vite-pwa/astro: <https://vite-pwa-org.netlify.app/frameworks/astro.html>
- Base UI: <https://base-ui.com>
- Tremor Raw: <https://raw.tremor.so>
- Motion: <https://motion.dev>
