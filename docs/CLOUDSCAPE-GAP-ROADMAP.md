# Cloudscape gap roadmap

A benchmark of Inceptor against [Cloudscape](https://cloudscape.design/)
(AWS's enterprise design system) surfaced one structural gap: Inceptor has
excellent **primitives** (a ~44-component kit) but few **compositions** —
the larger, opinionated patterns an enterprise product is assembled from
(an application shell, a resource-details page, a multi-step wizard) — and
no formal **foundation** guidance layer tying the primitives together.

This roadmap closes that gap in horizons. It is the source of truth for the
Cloudscape-parity work; individual issues link back here.

## Horizon 1 — foundation + the three core compositions

The first block establishes the guidance layer and the three highest-value
compositions, so a team can stand up an enterprise-style product surface by
reusing patterns instead of hand-rolling them.

| #   | Item                                                                           | Issue                                                         | Status         |
| --- | ------------------------------------------------------------------------------ | ------------------------------------------------------------- | -------------- |
| 1   | **Foundation docs** — tokens, density, layout, theming, accessibility baseline | [#197](https://github.com/ArtemioPadilla/inceptor/issues/197) | ⏳ In progress |
| 2   | **Service shell** — reusable app layout: nav, tools, content, split panel      | [#198](https://github.com/ArtemioPadilla/inceptor/issues/198) | ⬜ Planned     |
| 3   | **Resource details** — simple + tabbed detail-page blueprints                  | [#199](https://github.com/ArtemioPadilla/inceptor/issues/199) | ⬜ Planned     |
| 4   | **Wizard** — multi-step create/edit flow blueprint                             | [#200](https://github.com/ArtemioPadilla/inceptor/issues/200) | ⬜ Planned     |

Tracking issue: [#201](https://github.com/ArtemioPadilla/inceptor/issues/201).

### Dependency-aware order

1. **#197 Foundation** — defines the base rules (tokens, density, layout,
   theming, a11y) the UI patterns consume.
2. **#198 Service shell** — establishes the primary layout the demos and
   patterns sit inside.
3. **#199 Resource details** — builds on foundation + shell.
4. **#200 Wizard** — a cross-cutting pattern with validation and multi-step
   UX.

### Suggested first slice

Ship **#197 (foundation docs)** first — it's docs-only, unblocks the
vocabulary the other three reference, and carries no regression risk. Then
take the compositions in order, each as its own PR with a component, a
demo, a gallery entry, unit tests, and Playwright validation.

## Foundation layer

The foundation guidance lives in [`docs/foundation/`](./foundation/):

- [`tokens.md`](./foundation/tokens.md) — semantic tokens and anti-patterns.
- [`density.md`](./foundation/density.md) — comfortable vs compact.
- [`layout.md`](./foundation/layout.md) — page regions and responsive rules.
- [`theming.md`](./foundation/theming.md) — the light/dark model.
- [`accessibility.md`](./foundation/accessibility.md) — the enforceable a11y
  baseline.

## Out of scope (for Horizon 1)

- A Figma/token-export pipeline.
- A full design-system rewrite or a parallel theming system.
- Backend data integration for the pattern demos (they use placeholder
  data).
- Exhaustive Cloudscape component parity — Horizon 1 targets the
  highest-leverage compositions, not one-to-one coverage.

## Later horizons (not yet scheduled)

Candidates surfaced by the benchmark, to be prioritized after Horizon 1:

- Form-heavy patterns (multi-section forms with a shared validation
  summary).
- Table toolbar + collection-preferences pattern (column selection,
  density toggle, pagination conventions).
- Flashbar / global notification pattern.
- Help-panel / contextual-info drawer conventions.

These are intentionally unscheduled; Horizon 1 ships and proves the
composition approach first.
