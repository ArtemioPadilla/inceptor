# Inceptor

> An Astro 5 + React 19 starter where every feature ships through a GitHub issue: **issue → Claude Code → PR → merge → deploy.** Batteries-included UI, zero JS by default.

**[Live demo → artemiop.com/inceptor](https://artemiop.com/inceptor/)**

[![Build](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com/ArtemioPadilla/inceptor/actions)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue)](./LICENSE)
[![Components](https://img.shields.io/badge/components-~44-emerald)](./docs/component-catalog.md)
[![Deps beyond stack](https://img.shields.io/badge/deps%20beyond%20stack-0-success)](./docs/component-catalog.md)

Inceptor is a production-grade web template built around **Issue-Driven Development**. It ships an islands-architecture Astro site with a full UI kit, a custom docs site, a component gallery, live demos, a blog, and PWA/offline support — and a `FeedbackFAB` that lets real users file pre-filled GitHub issues straight from the running app.

## What you get

### Stack

| Package | Role |
|---|---|
| **Astro 5** | Islands architecture, ships zero JS by default |
| **React 19** (`@astrojs/react`) | Only for interactive islands |
| **Tailwind v4** (`@tailwindcss/vite`) | Styling — no `@astrojs/tailwind` |
| **Base UI** (`@base-ui-components/react`) | shadcn-compatible primitives (not Radix) |
| **TanStack Table + Query + Virtual** | DataTable, per-island data, virtualization |
| **Tremor Raw** (copy-paste) | KPIs, trackers, charts — you own the source |
| **Motion** (`motion/react`) | Lazy React animations |
| **PWA** (`@vite-pwa/astro` + Workbox) | Service worker + offline cache |

Everything else (Recharts, Nano Stores, react-hook-form + Zod, lucide, vitest) lives in [`CLAUDE.md`](./CLAUDE.md). No dependencies beyond this curated stack — dependency-free components add zero extra weight.

### ~44 components across 13 gallery categories

Primitives, form controls, advanced inputs, navigation, compound components (Dialog/Tabs/Toast/Form), overlays, disclosure, feedback, DataTable, KPIs, charts, and data-viz extras. Full inventory in [`docs/component-catalog.md`](./docs/component-catalog.md).

### Optional self-hosted backend

Two interchangeable archetypes — **`server-node/`** (Hono, reuses the frontend's Zod schemas) and **`server-flask/`** (Flask + Pydantic) — expose the same `/api/*` contract: contact/newsletter handlers, a token-backed GitHub proxy (lifts the 60 req/h cap), feedback→issue creation, and OpenAPI/Swagger. Entirely opt-in via `PUBLIC_API_BASE`; unset, the site stays fully static. See **[the backend guide](https://artemiop.com/inceptor/docs/building/backend/)** and [ADR 0006](./docs/decisions/0006-self-hosted-backend-archetypes.md).

### Explore it live

- **[Gallery](https://artemiop.com/inceptor/gallery/)** — every component rendered live
- **[Demos](https://artemiop.com/inceptor/demos/)** — dashboard + data-table in context, plus the [backend API contract](https://artemiop.com/inceptor/demos/api/)
- **[Docs](https://artemiop.com/inceptor/docs/)** — custom docs site with search
- **[Blog](https://artemiop.com/inceptor/blog/)** — content-collection example

## Quick start

```bash
git clone https://github.com/ArtemioPadilla/inceptor.git
cd inceptor
npm install
npm run dev          # http://localhost:4321
```

Useful scripts: `npm run build`, `npm run preview`, `npm run check` (typecheck + tests + build), `npm run test`.

## Deploy

Inceptor ships static HTML + a service worker, so any static host works. The default is **GitHub Pages** (repo Settings → Pages → Source: "GitHub Actions"); pushes to `main` deploy automatically. Cloudflare Pages, Netlify, and Vercel guides are in **[`docs/deploy/`](./docs/deploy/)**.

## How development works

Every feature starts as a GitHub issue. In a Claude Code session, Claude triages it and drives three project sub-agents — `prometeo` plans, `forja` implements, `centinela` validates — landing a PR against `main` that auto-deploys on merge. The in-app `FeedbackFAB` closes the loop: real users file issues with stack trace, URL, and diagnostics pre-filled.

```
User finds bug → FeedbackFAB → GitHub Issue → Claude Code → PR → Merge → Deploy
```

## Documentation

- [Component catalog](./docs/component-catalog.md) — full inventory + coverage scorecard
- [Roadmap](./ROADMAP.md) — post-integration follow-ups grouped into epics
- [Claude Code context](./CLAUDE.md) — repo conventions, stack details, IDD workflow
- [Contribution & component guide](./docs/COMPONENTS.md) — how to add a component
- [docs/](./docs/) — principles, ethics, ADRs, component guide, deploy targets

## License

[MIT](./LICENSE)
