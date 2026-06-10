---
title: UX quality bar (7 criteria)
description: Measurable thresholds gated in CI.
---

Seven measurable UX criteria. Each will be gated in CI when its tooling lands
(tracked in [ROADMAP.md](https://github.com/ArtemioPadilla/inceptor/blob/main/ROADMAP.md) Epic 12).

## The 7 criteria

| # | Criterion | Tool | Threshold |
|---|---|---|---|
| 1 | a11y violations | axe-core via Playwright | 0 serious, 0 critical |
| 2 | Lighthouse Performance | `@lhci/cli` mobile preset | ≥ 90 |
| 3 | Lighthouse a11y + Best Practices | `@lhci/cli` mobile preset | ≥ 95 each |
| 4 | `prefers-reduced-motion` respected | lint: every `motion/react animate=` is inside `LazyMotion` + `useReducedMotion()` branch (or `tailwindcss-motion`) | 0 unguarded |
| 5 | WCAG AA contrast | build-time check on `:root` / `.dark` var pairs | 0 failures (≥ 4.5:1) |
| 6 | Keyboard nav + visible focus | Playwright tab-walk on `/showcase` | 100% reachable + `:focus-visible` ring |
| 7 | Theme-toggle zero-flash on Slow 3G | Playwright with network throttling | 0 FOUC frames |

## Visual regression vs ux:check

These are **separate gates** with a shared Playwright runner:

- **Visual regression** (`tests/__screenshots__/`) — catches *unintended* change
- **`npm run ux:check`** — catches *intentional* harm (dark patterns, contrast failures, motion violations)

## Status

As of June 2026, criteria 6 (keyboard nav) has a Playwright test in `tests/a11y/keyboard-nav.spec.ts`.
Full `ux:check` wiring (axe-core, Lighthouse CI) is planned for Epic 12.

See [`docs/PRINCIPLES.md §5`](https://github.com/ArtemioPadilla/inceptor/blob/main/docs/PRINCIPLES.md#5-uxui-quality-bar) for the full rationale.
