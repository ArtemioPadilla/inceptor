---
title: "0003 — Astro Starlight for the docs site"
description: Architecture Decision Record.
---

> **Numbering note (June 2026 audit §4.5):** two distinct decisions share the
> number 0003 — this one and the superseded Starlight ADR — because the
> Starlight record was written and superseded within the same cycle and the
> number was reused by mistake. Both slugs are kept for URL stability; new
> ADRs continue from 0007.

## Status

Superseded by [0004](./0004-custom-docs-route) — Starlight was never shipped; a
custom `/docs/[...slug].astro` route replaced it.

Date: 2026-05-28

## Context

The scaffold accumulated 8+ top-level markdown files (`README`, `CLAUDE`,
`PRINCIPLES`, `ETHICS`, `COMPONENTS`, `CONTRIBUTING`, `ROADMAP`,
`INTEGRATION-PLAN`, `SETUP`) — with overlapping content (the forbidden-imports
list lived in three places) and no navigation, no search, no mobile chrome.

The DX subagent review (F5 in the review-findings section of `ROADMAP.md`)
flagged this as a real daily-friction tax. The documentation-strategist
subagent in the next review round recommended a deployed docs site as the
fix.

## Decision

Use **Astro Starlight v0.37**, mounted as `/docs/*` in the existing Astro app
via `routePrefix: 'docs'`. Not a separate `apps/docs/` subproject.

- One Astro build, one dev server, one deploy pipeline
- Pagefind search enabled by default (no Algolia until corpus > 200 pages)
- MDX support → the docs site can import live components from `src/components/ui/*`
- Pinned to `0.37.7` (last release compatible with Astro 5; `0.38+` requires Astro 6)

Rejected:

- **VitePress** — Vue ecosystem mismatch
- **Custom shadcn build** — rebuilds what Starlight gives for free (search, IA, dark mode, mobile chrome)
- **Separate `apps/docs/` workspace** — duplicate CI matrix, version-skew between docs and components
- **Sticking with bare markdown** — F5 was a real DX problem

## Consequences

**Positive:**

- Single canonical IA across 7 sections (Start here / Stack / How we work / Ethics / Building / Reference / Decisions / History)
- Search day one via Pagefind (static, free, no infrastructure)
- Live component embeds via MDX — gallery pages can render the actual `src/components/ui/<name>`
- Dark mode, mobile, a11y all inherited from Starlight defaults
- Lighthouse ≥ 95 on the docs site for free

**Negative:**

- Astro version pinned at 5.x until we decide on Astro 6 (Starlight ≥ 0.38)
- One more dependency tree to maintain (~30 transitive packages including Sharp)
- Starlight's design system (its own components) is slightly different from shadcn — `MDX import { Button } from '@/components/ui/button'` works but mixed visual language

**Neutral:**

- The `docs/` directory keeps the source-markdown files; Starlight content lives in `src/content/docs/`. Single-source happens via direct content moves, not symlinks.
- `routePrefix: 'docs'` means the deployed app has both `/` (Hello World) and `/docs/*` (Starlight) on the same origin.

## Supersedes

None.

## References

- [Astro Starlight](https://starlight.astro.build/)
- [Pagefind](https://pagefind.app/)
- F5 in `ROADMAP.md` "Review findings"
