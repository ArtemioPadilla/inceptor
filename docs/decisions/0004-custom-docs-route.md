# 0004 — Custom `/docs/[...slug].astro` route over Astro Starlight

## Status

Accepted

Date: 2026-06-01

## Context

An earlier Starlight ADR — recorded in the docs content collection as
`decisions/0003-starlight-for-docs`, the now-superseded Starlight decision —
chose Astro Starlight v0.37 mounted at `/docs/*` to fix the F5 documentation-friction
finding (8+ overlapping top-level markdown files, no nav, no search).

That decision did not survive contact with the stack:

- **Starlight 0.37 lacked `routePrefix`.** Mounting Starlight under `/docs/*`
  in the existing app — rather than at the site root — was not actually
  supported in the pinned release.
- **Starlight 0.39+ requires Astro 6.** Astro 6 is incompatible with
  `@vite-pwa/astro`, whose peer range is capped at Astro 5. Upgrading to get
  `routePrefix` would have broken the PWA / offline-cache integration that the
  scaffold already ships.

So Starlight was unshippable: the version that mounts correctly needs Astro 6,
and Astro 6 breaks the PWA. The question became whether to drop the PWA, freeze
the docs, or own the docs route ourselves.

## Decision

Build a **custom `/docs/[...slug].astro` route** in the existing Astro app
instead of adopting Starlight. Documentation lives in the `docs` content
collection (`src/content/docs/`); the route renders it with our own
`DocsLayout`, `DocsSidebar`, and `DocsBreadcrumb`.

- Single source of truth for navigation: `src/content/docs-sidebar.ts`
  (consumed by the sidebar, breadcrumb, and prev/next logic)
- Pagefind wired in for static search (the one Starlight built-in worth keeping)
- 7-section information architecture preserved (Start here / Stack / How we work
  / Ethics & UX / Building / Reference / Decisions / History)
- Shipped as PR #61; 36 pages, sidebar nav

Rejected alternatives:

- **Drop `@vite-pwa/astro` to allow Astro 6 + Starlight 0.39+** — sacrifices a
  shipped feature for docs chrome.
- **Pin Starlight 0.37 and live without `routePrefix`** — can't mount under
  `/docs/*`; would force docs to the site root.
- **Separate `apps/docs/` workspace on its own Astro version** — duplicate CI
  matrix and version skew between docs and the components they embed.

## Consequences

**Positive** — stack stability: stays on Astro 5, keeps `@vite-pwa/astro` and
the PWA/offline cache. We own the docs layout and sidebar end to end; one build,
one dev server, one deploy. Search still works via Pagefind.

**Negative** — we lose Starlight's built-ins (its design system, automatic
prev/next, i18n scaffolding, component library) and must maintain the layout,
sidebar, and breadcrumb ourselves. Sidebar entries are hand-maintained in
`docs-sidebar.ts` rather than file-system-derived.

**Neutral** — the `docs/` directory remains the canonical source for ADRs and
long-form markdown; the served copies live in `src/content/docs/`. The custom
route gives full control over slug shape (`decisions/0004-...`).

## Supersedes

The Starlight docs-site decision recorded in the docs content collection as
`decisions/0003-starlight-for-docs`. Starlight was never shipped; this route
replaces it.

## References

- [`ROADMAP.md`](../../ROADMAP.md) Epic 15 — Docs site (custom `/docs/*` route)
- PR #61 — custom `/docs/*` route, `DocsLayout` + `DocsSidebar`, 36 pages
- PR #65 — Pagefind search
- [`@vite-pwa/astro`](https://vite-pwa-org.netlify.app/frameworks/astro.html) — Astro 5 peer cap
- [Astro Starlight](https://starlight.astro.build/)
