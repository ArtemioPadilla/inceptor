# 0008 — No per-component test-utils package; the gate stack is the contract

## Status

Accepted

Date: 2026-06-13

## Context

AWS Cloudscape ships `@cloudscape-design/test-utils`, a package of per-component
DOM wrappers (`findButton()`, `findTable().findRowSelectionArea()`, …) so
consumers can write resilient tests against Cloudscape components without
reaching for brittle selectors. The June 2026 Cloudscape gap analysis
(`docs/CLOUDSCAPE-GAP-ROADMAP.md`, Epic F) asked whether Inceptor should build
an equivalent.

## Decision

**No.** Inceptor does not ship a per-component test-utils package. The quality
outcome that test-utils delivers — confidence that components behave and stay
accessible — is already delivered, more directly, by Inceptor's gate stack:

- **Behavior tests** (`*.behavior.test.tsx`, RTL) assert real interaction on
  every non-trivial component, queried by role/label — the same resilient,
  selector-free style test-utils exists to enable.
- **axe a11y gate** (`tests/visual/a11y.spec.ts`) fails the build on any
  serious/critical violation on the live DOM.
- **keyboard-nav gate** asserts focus reachability + visible focus rings.
- **visual regression** (strict, Linux-baselined) catches unintended change.
- **drift gate** (`component-catalog-drift.test.ts`) forces every gallery
  component to stay documented.

A test-utils package is justified when a *large external consumer base* writes
tests against your components and needs a stable testing API to insulate them
from internal markup changes. Inceptor is a single-maintainer template whose
consumers fork the source; they test their *own* forked components with the
behavior-test pattern, not against a versioned wrapper API. A wrapper package
would be ceremony with no team to amortize it and no external contract to
protect.

## Consequences

**Positive**: zero new package surface to version/publish; the gate stack
already blocks regressions; the behavior-test pattern is copy-forward for forks.

**Negative**: a consumer who wants ready-made DOM selectors for Inceptor
components must write their own queries (mitigated: RTL's role/label queries are
the recommended style anyway).

**Revisit if**: the component count roughly doubles *and* a population of
external projects starts testing against the components as a stable dependency.

## Also resolved (Epic F quality bar)

No quality check remains advisory: the visual gate dropped `continue-on-error`
(June 2026), and new components cannot merge without gallery + a11y + visual +
behavior coverage. The bar is mechanical, per `docs/POSITIONING.md`.

## References

- `docs/CLOUDSCAPE-GAP-ROADMAP.md` — Epic F
- `docs/PRINCIPLES.md` §5 (UX quality bar)
- AWS Cloudscape test-utils: https://cloudscape.design/get-started/
