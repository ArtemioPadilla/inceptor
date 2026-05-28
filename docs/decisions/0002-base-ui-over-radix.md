# 0002 — Base UI over Radix UI for shadcn primitives

## Status

Accepted (retroactive)

Date: 2026-05-26

## Context

shadcn/ui's default registry uses Radix UI primitives for interactive components
(Dialog, DropdownMenu, Tabs, etc.). Radix is widely adopted but development has
slowed since the WorkOS acquisition (mid-2024).

Base UI (`@base-ui-components/react`) is the modern alternative — same
accessibility model, actively developed, MIT-licensed, aligned with the React
ecosystem's direction.

This ADR is written retroactively to record the choice made during Phase 1
(GitHub issues #9–#13 / plan issues #4–#8).

## Decision

Use **Base UI** primitives for every interactive shadcn component. Forbid
`@radix-ui/*` imports anywhere in `src/`.

- Interactive components (Dialog, DropdownMenu, Tabs, Toast, Form) written from
  scratch against `@base-ui-components/react/<primitive>`, not installed via
  the default shadcn CLI
- Primitive-free components (Button, Input, Label, Card, Table, Badge) install
  via shadcn CLI; any Radix the CLI tries to pull (e.g. `@radix-ui/react-slot`
  in Button) is replaced with hand-written equivalents
- `centinela` enforces with `grep -r '@radix-ui' src/` returning empty

## Consequences

**Positive**:

- Future-proof against further Radix development slowdown
- Cleaner alignment with React 19 features
- One primitive layer per project — no mix-and-match confusion

**Negative**:

- Cannot copy-paste shadcn examples wholesale — every interactive component
  needs manual conversion
- Base UI is pre-1.0 (`1.0.0-rc.0`) so dep pinning needs occasional bumps until
  GA (tracked in [`ROADMAP.md`](../../ROADMAP.md) Epic 5)
- `asChild` slot prop has no direct Base UI equivalent — Base UI uses
  `render={<Component />}` instead. `forja`'s brief documents the conversion.
- `Field.Control` SSR limitations surfaced during Phase 1 (PR #17) — required a
  `cloneElement`-based `FormControl` rewrite

**Neutral**:

- `class-variance-authority`, `lucide-react`, `clsx`, `tailwind-merge` are still
  used — they're primitive-layer-agnostic

## Supersedes

None.

## References

- [shadcn/ui Astro docs](https://ui.shadcn.com/docs/installation/astro)
- [Base UI](https://base-ui.com)
- [`INTEGRATION-PLAN.md`](../../INTEGRATION-PLAN.md) Phase 1
- PR #16 — `feat: install base component set` (captures conversion patterns)
- PR #17 — `feat: /showcase page` (surfaces and fixes Form/Field.Control SSR
  incompatibility)
