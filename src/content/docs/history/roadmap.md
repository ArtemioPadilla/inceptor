---
title: Roadmap
description: Open epics and planned work.
---

The scaffold is live at **https://artemiop.com/inceptor/** (commit `f9a95b8`, June
2026). All 27 integration issues from [INTEGRATION-PLAN.md](/docs/history/integration-plan/)
are merged.

## Current status (June 2026)

`main` is green: `npm run check` → 0 errors, 470+ tests, 66+ pages built.

Planned work is organized by Epic. Completed items are checked.

## Epic 1 — Visual regression gate

- [x] One-shot Docker refresh wrapper (`scripts/refresh-baselines.sh`)
- [ ] Run the refresh in Linux CI environment — needs Docker
- [ ] Remove `continue-on-error: true` from `.github/workflows/visual.yml` once baselines are stable

## Epic 2 — Performance verification

- [x] `lighthouse-budgets.json` + LHCI assertions
- [x] Lighthouse measured on `/`, `/gallery`, `/docs`, `/demos/dashboard` — Perf 92–100
- [ ] Profile `/demos/data/large` scroll — target 60 fps
- [ ] Measure filter latency on `/demos/data/large` — target < 50 ms
- [ ] Throttle theme toggle to Slow 3G — confirm zero flash

## Epic 3 — ErrorBoundary coverage

- [x] Wrap all 12 Showcase/chart/form islands
- [ ] Wrap `ThemeIndicator` — the one demo island still unwrapped
- [ ] *(stretch)* Auto-wrap every `client:*` island via a Vite/Astro plugin

## Epic 5 — Dependency hygiene

- [x] TypeScript 6, vitest 4, zod 4, lucide 1.17, GitHub Actions bumped to majors
- [x] Astro-6 dependabot `ignore` (peer-capped by `@vite-pwa/astro`)
- [ ] Re-pin `@base-ui-components/react` to stable (blocked: rc.0 is latest)
- [ ] Astro 5 → 6 (blocked: `@vite-pwa/astro` peer-caps at ^5)
- [ ] Resolve Recharts `Cell` deprecation in `donut-chart.tsx`

## Epic 12 — UX & ethics quality bar

- [x] Keyboard-nav focus-visible Playwright check
- [ ] axe-core via Playwright — 0 serious/critical violations
- [ ] Lighthouse CI mobile — ≥ 90 performance, ≥ 95 a11y
- [ ] `prefers-reduced-motion` lint — 0 unguarded `animate=` usages
- [ ] WCAG AA contrast — build-time check on `:root` / `.dark` var pairs

## Epic 14 — June 2026 audit fixes (Waves 1–4)

The [June 2026 audit](https://github.com/ArtemioPadilla/inceptor/blob/main/docs/AUDIT-2026-06.md)
identified 10 top findings. Waves 1–3 shipped same-day (#136–#148).

- [x] Wave 1 — P0 production fixes: robots.txt domain, Pagefind base, 404 page, blog redirect base, chart animations
- [x] Wave 2 — Trust & polish: SiteFooter, canonical/hreflang, color-scheme, skip-to-content, FeedbackFAB anchoring, language switcher, es/ parity, Dashboard loading states, destructive-foreground token
- [x] Wave 3 — Dashboard P0: DataCloneError (IDB persister), chart rendering (bar + donut), DataTable empty-state, homepage stats
- [x] Wave 4 — Docs surfaces: "Edit this page", 19 stub migrations, 3 real blog posts

## Epic 16 — Gallery + Demo surface

- [x] Component gallery with live render in light+dark (`/gallery`)
- [x] Per-component source snippets with copy button (#119)
- [x] Dashboard demo (`/demos/dashboard`)
- [x] 50k-row virtualized table (`/demos/data/large`)
- [ ] `/demos/settings` — settings page pattern demo

## Genuinely deferred (external action required)

- Interactive perf probes — manual Chrome DevTools session
- Refresh visual baselines in Linux Docker
- GitHub API token, `ANTHROPIC_API_KEY`, custom-domain DNS — user secrets
- Real brand artwork — needs a designer
- `@base-ui-components/react` stable release — upstream-gated

Full canonical roadmap → [`ROADMAP.md`](https://github.com/ArtemioPadilla/inceptor/blob/main/ROADMAP.md)
