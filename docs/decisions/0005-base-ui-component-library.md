# 0005 — Base UI as the standard component library

## Status

Accepted

Date: 2026-06-01

## Context

ADR [0002](./0002-base-ui-over-radix.md) settled the *primitive layer*: Base UI
over Radix for the interactive shadcn components. It did not settle the broader
question that surfaced as the catalog grew past the original handful of
components: how far does the bundled library go, and what gets pulled in as a
dependency versus written from scratch?

By June 2026 the scaffold had grown to roughly 44 components across 13 gallery
categories — validated against the full shadcn/ui catalog (47 components) at
100% coverage, plus extras (Tree view, Timeline, Bar list, Sparkline, Gauge).
Without a stated policy, contributors had no rule for when adding a component is
free versus when it incurs an external dependency that everyone inherits.

The question: what is the standing policy for the component library — its
primitive basis, its build style, and its dependency posture?

## Decision

Standardize the component library on **Base UI primitives wrapped shadcn-style**.

- **Base UI primitives, shadcn-wrapped** — every interactive component is a
  hand-written wrapper around `@base-ui-components/react/<primitive>`, themed to
  the shadcn CSS variables (emerald accent), living in `src/components/ui/`.
- **Markup/CSS for dependency-free components** — anything that needs no
  primitive (Button, Card, Badge, Breadcrumb, Alert, Skeleton, dividers, etc.)
  ships as plain markup + Tailwind, no runtime dependency.
- **External deps only per-project** — components that genuinely require an
  external library (Date picker → `react-day-picker`, Carousel →
  `embla-carousel-react`, Rich text → `tiptap`/`lexical`, advanced charts →
  `visx`/`nivo`) are **not** bundled. They are added per project, and each is
  worth its own ADR when it ships in the template.

The full inventory — what ships, what's dependency-gated, what's intentionally
out of scope — is maintained in [`docs/component-catalog.md`](../component-catalog.md)
and rendered live at `/gallery`.

Rejected alternatives:

- **Bundle the long tail (date picker, carousel, rich text) by default** —
  violates the zero-cost / minimal-dep stance; forces every project to carry
  deps it may not use.
- **Pull components from a third-party library wholesale (MUI/Chakra/Ant)** —
  conflicts with the owned, copy-paste shadcn model and the Base UI primitive
  choice from ADR 0002.

## Consequences

**Positive** — predictable rule for contributors: Base UI + markup is free and
unlimited; external deps are a deliberate, ADR-worthy per-project choice. The
bundled surface stays dependency-light while covering 100% of the shadcn catalog.
Single canonical inventory in `component-catalog.md`.

**Negative** — hand-wrapping every Base UI primitive (vs. installing a finished
library) is ongoing work, and dependency-gated components are a per-project lift
rather than a built-in. Base UI is still pre-1.0 (`1.0.0-rc.0`), so the wrappers
inherit the version-pinning caveat from ADR 0002.

**Neutral** — the catalog distinguishes three build kinds (Base UI primitive,
markup/CSS, needs-a-dependency); this is documentation, not a code boundary.

## Supersedes

None — extends ADR [0002](./0002-base-ui-over-radix.md) from the primitive layer
to the whole library.

## References

- [`docs/component-catalog.md`](../component-catalog.md) — full inventory and coverage scorecard
- ADR [0002](./0002-base-ui-over-radix.md) — Base UI over Radix for primitives
- [`ROADMAP.md`](../../ROADMAP.md) Epic 16 — Gallery + Demo surface
- [Base UI](https://base-ui.com) · [shadcn/ui](https://ui.shadcn.com)
