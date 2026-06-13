# Layout

## Purpose

This page defines the canonical page regions, spacing rhythm, and responsive
behaviour used across Inceptor. Following these conventions ensures that all
pages and islands share a coherent spatial contract.

## Page regions

```
┌─────────────────────────────────────────────────────────┐
│ TopBar  (sticky, h-14, bg-sidebar, z-50)                │
├────────────┬────────────────────────────────────────────┤
│            │                                            │
│  SideNav   │  Main content                              │
│  (w-64,    │  (flex-1, overflow-y-auto)                 │
│  hidden    │                                            │
│  < md)     │     ┌──────────────────┐                  │
│            │     │  Split / Drawer  │                  │
│            │     │  (optional,      │                  │
│            │     │  w-96, border-l) │                  │
│            │     └──────────────────┘                  │
└────────────┴────────────────────────────────────────────┘
```

| Region | Token / class | Notes |
|---|---|---|
| TopBar | `h-14 bg-sidebar border-b border-sidebar-border` | Contains logo + global actions |
| SideNav | `w-64 bg-sidebar border-r border-sidebar-border` | Collapses to drawer on `< md` |
| Main content | `flex-1 min-w-0 p-6` | Never set a fixed width |
| Split panel | `w-96 border-l border-border bg-card` | Optional; see AppLayoutIsland |

## Spacing rhythm

Inceptor uses a **4 px base grid**. All spacing values must be multiples of 4:

| Scale | Tailwind | px | Use |
|---|---|---|---|
| 1 | `gap-1` / `p-1` | 4 | Internal icon padding |
| 2 | `gap-2` / `p-2` | 8 | Compact padding |
| 3 | `gap-3` / `p-3` | 12 | Tight card padding |
| 4 | `gap-4` / `p-4` | 16 | Default card / section padding |
| 6 | `gap-6` / `p-6` | 24 | Main content inner padding |
| 8 | `gap-8` / `py-8` | 32 | Section vertical rhythm |
| 12 | `py-12` | 48 | Page-level top/bottom margin |

**Never use odd values** (`p-5`, `gap-7`) — they break the grid and cause
sub-pixel misalignment.

## Responsive behaviour

| Breakpoint | Tailwind | Behaviour |
|---|---|---|
| `< md` (< 768 px) | default | SideNav hidden; hamburger opens mobile drawer |
| `md` (768 px) | `md:` | SideNav appears; TopBar narrower logo |
| `lg` (1024 px) | `lg:` | Split panel can open without pushing main |
| `xl` (1280 px) | `xl:` | Max content width capped at `max-w-7xl` |

On mobile, the split panel becomes a full-screen bottom sheet or modal — never
a side-by-side split that would squeeze content below 320 px.

## Practical example

A page using the shell regions:

```astro
---
// src/pages/showcase/app-layout.astro
import BaseLayout from '@/layouts/BaseLayout.astro';
import AppLayoutIsland from '@/components/islands/AppLayoutIsland';
---
<BaseLayout title="App Layout">
  <!-- client:load so navigation/keyboard state initialises immediately -->
  <AppLayoutIsland client:load />
</BaseLayout>
```

Inside the island, the grid is wired up:

```tsx
<div className="flex h-screen overflow-hidden">
  <SideNav className="hidden md:flex w-64 shrink-0" />
  <div className="flex flex-col flex-1 min-w-0">
    <TopBar className="h-14 shrink-0" />
    <main className="flex-1 overflow-y-auto p-6">
      {children}
    </main>
  </div>
</div>
```

## Anti-patterns

| Anti-pattern | Why it's wrong |
|---|---|
| `w-full` on the side nav | Breaks the split on small screens |
| Fixed `px` widths on main content | Overflows on mobile; use `flex-1 min-w-0` |
| Nested scroll containers inside `overflow-y-auto` | Creates double scrollbars |
| Skipping `min-w-0` on a flex child | Long text causes overflow out of container |

## See also

- [`docs/foundation/density.md`](./density.md) — padding/gap per density mode
- [`src/components/islands/AppLayoutIsland.tsx`](../../src/components/islands/AppLayoutIsland.tsx)
- [`src/pages/showcase/app-layout.astro`](../../src/pages/showcase/app-layout.astro)
