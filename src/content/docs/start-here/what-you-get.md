---
title: What you get
description: Feature inventory shipped with the scaffold.
---

## Pages

| Route | Purpose |
|---|---|
| `/` | Hello-World landing — replace with your own |
| `/showcase` | Component gallery (light + dark, side by side) |
| `/dashboard` | KPI + charts + table composed demo |
| `/data` | TanStack Query persistent fetch (GitHub Issues) |
| `/data/large` | 50,000-row virtualized table demo |
| `/docs` | These docs (Starlight) |

## Runtime stack

- **Astro 5** — islands architecture, ships zero JS by default
- **React 19** — for interactive islands only
- **Tailwind CSS v4** via `@tailwindcss/vite`
- **shadcn/ui** primitives on **Base UI** (not Radix)
- **TanStack** Table + Virtual + Query (with idb-keyval persistence)
- **Tremor Raw** copy-paste KPI primitives
- **Recharts** wrappers themed to shadcn CSS vars
- **Motion** (post-Framer merge) via `LazyMotion` + `domAnimation`
- **tailwindcss-motion** for CSS-only utility animations
- **`@vite-pwa/astro`** — service worker, manifest, install + update prompts
- **Nano Stores** for cross-island state

## Built-in workflow

- **Inceptor sub-agents** — `prometeo`, `forja`, `centinela` in `.claude/agents/`
- **FeedbackFAB** — floating button that captures errors and pre-fills GitHub issues
- **ErrorBoundary + HydrationCanary** — runtime errors become pre-filled issue reports
- **Visual regression** — Playwright snapshots in CI
- **Three GitHub Issue Forms** — `add_component`, `add_dashboard`, `add_data_table`

## Disciplines

- **Shape Up** cadence (pitches, appetite, cycles, cooldown)
- **TDD** red→green with `Tdd-Red:` commit trailers
- **Spec-DD** via Zod schemas in `src/schemas/`
- **8-item ethics checklist** with tiered enforcement
- **7-criterion UX quality bar** (a11y, Lighthouse, contrast, motion, keyboard nav, no-flash)
