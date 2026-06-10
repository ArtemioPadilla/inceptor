---
title: Stack overview
description: Installed versions and architectural choices.
---

The scaffold ships a curated, opinionated stack. Every dependency was chosen by
an explicit ADR or emerged from a documented trade-off.

## Installed packages

| Package | Version | Role |
|---|---|---|
| `astro` | `^5.18.1` | Islands architecture — ships zero JS by default |
| `@astrojs/react` | `^5.0.5` | React 19 integration for interactive islands |
| `react` / `react-dom` | `^19.2.6` | Only for interactive islands |
| `tailwindcss` | `^4.3.0` | Via `@tailwindcss/vite` (NOT `@astrojs/tailwind`) |
| `@tailwindcss/vite` | `^4.3.0` | Vite plugin for Tailwind v4 |
| `tailwindcss-motion` | `^1.1.1` | CSS-only motion utilities (`@plugin` directive) |
| `@base-ui-components/react` | `^1.0.0-rc.0` | Shadcn primitives (NOT Radix) |
| `class-variance-authority` | `^0.7.1` | Variant API for shadcn |
| `clsx` + `tailwind-merge` | `^2.1.1` / `^3.6.0` | `cn()` helper in `src/lib/utils.ts` |
| `lucide-react` | `^1.16.0` | Icons |
| `react-hook-form` + `zod` + `@hookform/resolvers` | `^7.76.1` / `^3.25.76` / `^5.4.0` | `<Form>` |
| `@tanstack/react-table` + `@tanstack/react-virtual` | `^8.21.3` / `^3.13.26` | `<DataTable>` |
| `@tanstack/react-query` + `@tanstack/query-persist-client-core` | `^5.100.14` | Per-island Query + persistence |
| `idb-keyval` | `^6.2.4` | IndexedDB persister backend |
| `nanostores` + `@nanostores/react` | `^1.3.0` / `^1.1.0` | Cross-island state |
| `recharts` | `^3.8.1` | Charts (lazy chunk) |
| `motion` | `^12.40.0` | React animations (LazyMotion + domAnimation) |
| `@vite-pwa/astro` + `workbox-window` | `^1.2.0` / `^7.4.1` | PWA + SW + offline cache |
| `vitest` | `^2.0.0` | Tests |
| `typescript` | `^5.6.0` | Strict mode |

## What is intentionally absent

| Package | Why excluded |
|---|---|
| `@radix-ui/*` | Replaced by Base UI — see [ADR 0002](/docs/decisions/0002-base-ui-over-radix/) |
| `@tremor/react` | Use Tremor Raw (copy-paste) — tree-shakes naturally, you own the source |
| `framer-motion` | Merged into `motion` package (Dec 2024) — always import from `motion/react` |
| `@astrojs/tailwind` | Tailwind v4 uses `@tailwindcss/vite` directly — `@astrojs/tailwind` doesn't exist for v4 |

## Key architectural choices

**Islands architecture** — Astro ships zero JS by default. React only hydrates
where `client:*` directives appear. See [Hydration directives](/docs/building/hydration/).

**Cross-island state via Nano Stores** — React Context can't span separate island
roots. `nanostores` + `@nanostores/react` is the bridge. Never `React.createContext`
for cross-island values.

**Base UI over Radix** — Interactive primitives use `@base-ui-components/react`.
Mixing Radix and Base UI in the same component is forbidden. See [ADR 0002](/docs/decisions/0002-base-ui-over-radix/).

**Zod for cross-boundary types** — every network/storage/form type is a Zod schema.
TypeScript interfaces for cross-boundary types are forbidden. See [Spec-DD](/docs/how-we-work/spec-dd/).

Authoritative source → [`CLAUDE.md — Stack`](https://github.com/ArtemioPadilla/inceptor/blob/main/CLAUDE.md#stack-installed)
