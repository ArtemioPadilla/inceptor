---
title: File structure
description: What lives where in this scaffold.
---

## Source tree

```
src/
├── components/
│   ├── ui/           shadcn primitives — owned, copy-pasted, freely editable
│   │   └── charts/   Recharts wrappers themed to shadcn CSS vars
│   ├── islands/      React islands — one file per interactive composition
│   ├── common/       Shared Astro components (FeedbackFAB, SiteHeader, etc.)
│   └── docs/         Doc-site-specific components (DocsSidebar, DocsSearch)
├── content/
│   ├── blog/         Blog posts (Markdown)
│   └── docs/         Documentation pages (Markdown/MDX)
├── layouts/
│   ├── BaseLayout.astro    Root HTML, head, theme script
│   └── DocsLayout.astro    Docs-page shell with sidebar + prev/next
├── lib/              Pure utilities: cn(), queryClient, href (withBase), flags
├── pages/            Astro routes — every file becomes a page
│   ├── index.astro
│   ├── gallery/
│   ├── demos/
│   ├── docs/[...slug].astro
│   ├── blog/
│   └── es/           Spanish locale demo
├── schemas/          Zod schemas for cross-boundary types
├── stores/           Nano Stores for cross-island state
├── styles/
│   └── global.css    Tailwind v4 import + CSS vars + dark-mode tokens
├── tests/            Vitest tests for pages, configs, and docs
└── types/            Shared TypeScript types
```

## Root files

| File | Purpose |
|---|---|
| `astro.config.mjs` | Astro config — integrations, base, Vite plugins |
| `components.json` | shadcn CLI config — style, alias `@/*` |
| `tsconfig.json` | TypeScript strict mode + `@/*` path alias |
| `vitest.config.ts` | Vitest config |
| `vitest.setup.ts` | Vitest global setup |
| `playwright.config.ts` | Playwright config for visual + a11y tests |
| `.env.example` | Document all env vars (copy to `.env` locally) |
| `CLAUDE.md` | Agent context and critical warnings |
| `INTEGRATION-PLAN.md` | Historical record of the v1.0 rollout |
| `ROADMAP.md` | Open epics and planned work |

## Server archetypes (opt-in)

| Directory | Purpose |
|---|---|
| `server-node/` | Hono + Zod-OpenAPI backend archetype |
| `server-flask/` | Flask backend archetype |

Both share the same OpenAPI contract ([ADR 0006](https://github.com/ArtemioPadilla/inceptor/blob/main/docs/decisions/0006-backend-archetypes.md)).
Neither is required — the scaffold is fully static without them.

## Path aliases

`@/*` → `./src/*` — configured in `tsconfig.json`. Required by the shadcn CLI.
Use it in all imports: `import { cn } from '@/lib/utils'`.

Authoritative source → [`CLAUDE.md — File organization`](https://github.com/ArtemioPadilla/inceptor/blob/main/CLAUDE.md#file-organization)
