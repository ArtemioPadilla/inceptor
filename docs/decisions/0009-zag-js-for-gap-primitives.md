# 0009 — Permit `@zag-js/*` machines for primitives Base UI does not ship

## Status

Accepted

Date: 2026-08-10

## Context

ADR 0002 chose Base UI over Radix as Inceptor's sole headless-primitive layer,
explicitly accepting the risk that Base UI was pre-1.0 (`1.0.0-rc.0`).

A 2026-08 comparison across six component ecosystems (Astryx, Material UI,
shadcn/ui, Chakra UI, Ant Design, Ark UI) confirmed that risk is still live:
Base UI has not cut a GA release since ADR 0002 was written — it remains
`1.0.0-rc.0` as of this writing, with only patch-level registry touches since
December 2025. By contrast, Ark UI (the headless layer built on
[zag.js](https://zagjs.com) state machines, maintained by the Chakra UI team)
has shipped stable releases every 2–5 weeks since 2022 and is on major v5.

The same study also did a direct catalog diff: Base UI ships 37 primitives;
Ark UI/zag.js ships 61. The gap includes several primitives Inceptor now needs
per `ROADMAP.md` Epic 21/22 — **Splitter**, **Editable**, **Color Picker**,
and (already deferred) **Tour** — that Base UI has no equivalent for at all.

Two options were considered:

1. **Reopen ADR 0002** and evaluate replacing Base UI with Ark UI wholesale.
2. **Hand-roll** every missing primitive from scratch (raw pointer events,
   focus management, ARIA wiring, keyboard contracts) with no state-machine
   foundation underneath.
3. **Depend on `@zag-js/<component>` directly**, per gap primitive only, and
   wrap it in the same shadcn-style pattern Inceptor already uses for every
   other `src/components/ui/*.tsx` file.

Option 1 was rejected: ~40 interactive components have already been converted
from Radix/shadcn's `asChild` idiom to Base UI's `render` prop. Redoing that
conversion against Ark UI's composition API for components where Base UI is
already at parity (Dialog, Popover, Select, Tabs, Menu, Slider, Switch,
Progress, Toast, Toggle, Accordion, Checkbox, Avatar, Navigation Menu, Scroll
Area) is a large, high-risk migration to fix a gap that only affects a small,
identifiable set of primitives — not the whole library.

Option 2 was rejected because it discards zag.js's actual value: each
`@zag-js/*` machine is modeled against the WAI-ARIA Authoring Practices and
tested end-to-end per component, per the spec — exactly the keyboard/focus/SR
behavior that is hardest to get right and easiest to under-test when
hand-rolled.

## Decision

**Base UI remains Inceptor's primary primitive layer** (ADR 0002 stands,
unmodified) for every primitive it ships.

For primitives Base UI does **not** ship, Inceptor may depend directly on the
underlying `@zag-js/<component>` package — **not** the full `@ark-ui/react`
wrapper, which carries its own styling/composition conventions
(`data-scope`/`data-part`/`data-state`, `asChild`) that would sit awkwardly
next to Base UI's `render`-prop convention in the same codebase.

Rules:

- Before hand-rolling a new interactive primitive, check whether
  `@zag-js/<name>` exists. If it does, use it as the state-machine foundation.
- Wrap the machine in `src/components/ui/<name>.tsx` using the same pattern as
  every other component: `cn()` for styling, named exports matching the
  shadcn API shape consumers already expect, tests alongside, and an entry in
  `/showcase` per the standing quality bar.
- Do **not** import from `@ark-ui/react` directly — only the scoped
  `@zag-js/*` machine packages. This keeps exactly one composition/styling
  convention (Base UI's) across the codebase, preserving ADR 0002's "one
  primitive layer, no mix-and-match confusion" rationale for everything that
  isn't a gap-fill.
- `centinela` extends its forbidden-import scan: `@ark-ui/react` is forbidden
  everywhere in `src/`, same enforcement shape as the existing `@radix-ui`
  check from ADR 0002.
- First candidates, per `ROADMAP.md` Epic 21/22: `@zag-js/splitter`,
  `@zag-js/editable`, `@zag-js/color-picker`. Date/time picker (Epic 21) is
  explicitly **not** on this list — it's built on `react-day-picker` + Base
  UI's own `Popover`/`Field`, following shadcn's Base UI `date-picker`
  composition pattern, because that gap has a smaller, non-zag solution.

## Consequences

**Positive**:

- Closes real primitive gaps (Splitter, Editable, Color Picker, Tour) without
  betting the whole component layer on a second pre-1.0/pre-stable dependency
  tree, and without the cost of a full Base UI → Ark UI migration.
- Inherits zag.js's spec-driven, per-component, end-to-end-tested keyboard/SR
  behavior for exactly the primitives where Inceptor would otherwise have to
  build and test that behavior from scratch.
- Narrow, auditable scope — `centinela`'s forbidden-import check makes drift
  (a new component reaching for `@ark-ui/react` out of convenience) visible
  immediately, the same way the Radix check already does for ADR 0002.

**Negative**:

- A second scoped-package family (`@zag-js/*`) now lives in `package.json`
  alongside `@base-ui-components/react`, each with its own release cadence to
  track.
- `@zag-js/*` machines expose a different low-level API (`useMachine`,
  `connect`) than Base UI's component-per-file model — each gap-fill wrapper
  needs its own translation layer, so gap primitives cost more per-component
  engineering time than a component Base UI already ships.
- If Base UI eventually ships one of these primitives natively, the
  `zag-js`-backed version needs a deliberate migration to stay consistent —
  tracked as follow-up work when it happens, not automatic.

**Neutral**:

- Does not change anything about primitives both libraries already cover —
  Base UI stays the only primitive layer used there.

## Supersedes

None. Extends ADR 0002 without modifying its decision.

## References

- [`docs/decisions/0002-base-ui-over-radix.md`](./0002-base-ui-over-radix.md)
- [zagjs.com](https://zagjs.com)
- [Ark UI](https://ark-ui.com)
- [`ROADMAP.md`](../../ROADMAP.md) Epic 21 (input primitives), Epic 22
  (Splitter/Action Bar), Epic 17 (Tour, deferred)
- npm registry — `@base-ui-components/react` (`1.0.0-rc.0` since 2025-12,
  patch-only since), `@ark-ui/react` (v5.38.x, releasing every 2–5 weeks
  since 2022) — pulled 2026-08-10 as part of the ecosystem-comparison study
