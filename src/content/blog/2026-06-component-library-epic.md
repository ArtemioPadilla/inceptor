---
title: "The component library epic: 44 components, 19 gallery categories"
description: How we built a full shadcn-compatible UI library on Base UI primitives and shipped it in one sprint.
pubDate: 2026-06-02
tags:
  - changelog
  - components
  - ui
author: artemiopadilla
---

Between PRs #92 and #99, the Inceptor scaffold grew from a handful of proof-of-concept
components to a complete, production-quality library: 44 components across 19 gallery
categories, with every interactive primitive hand-wrapped on Base UI (not Radix).

## What shipped

### Primitive components (no runtime dependency)

Button, Input, Textarea, Label, Card, Badge, Alert, Separator, Skeleton, Spinner,
Avatar, Progress, Breadcrumb, Table. These are pure markup + Tailwind classes — no
npm package required to use them. `npx shadcn@latest add` works for these with one
caveat: the generated output is Radix-based, so we check for `@radix-ui` imports
immediately and discard on any hit.

### Interactive primitives (Base UI wrappers)

Dialog, DropdownMenu, Tabs, Toast, Form, Select, Slider, Switch, Checkbox, RadioGroup,
Command Palette, Accordion, Popover, Tooltip. Each wraps `@base-ui-components/react/<primitive>`
and exports the same named API surface as the shadcn/Radix version, so consumers see no
difference.

The `dialog.tsx` canonical example is worth reading — it shows the Base UI `render` prop
pattern (`<DialogTrigger render={<Button />}>`) that replaces `asChild`, and the
`data-[starting-style]` / `data-[ending-style]` animation contract.

### Data display

DataTable (TanStack Table + Virtual, 50k rows), Timeline, Tree View, Tracker,
Rating. The DataTable is the most complex piece — it combines `@tanstack/react-table`
for column definition, `@tanstack/react-virtual` for virtualization, and a custom
`useDataTable` hook for sort/filter/pagination state.

### Charts (Recharts wrappers)

AreaChart, BarChart, LineChart, DonutChart, Sparkline, Gauge. All six wrap Recharts
primitives themed to the shadcn CSS vars. They ship with `isAnimationActive={false}`
by default — Recharts' entry animation conflicts with Astro's island hydration timing
and causes shapes to render invisible until the first re-render.

### Dashboard composition

The `/demos/dashboard` page demonstrates composing KPI metrics (Tremor Raw copy-paste),
bar chart, donut chart, and DataTable into a single cohesive dashboard island —
all in one React file hydrated as one `client:visible` island, avoiding the
compound-component gotcha.

## Key decisions made

**Base UI over Radix** — ADR 0002 settled this. The short version: Base UI is
actively maintained post-WorkOS acquisition of Radix; the API surface is comparable;
the `render` prop model is cleaner than `asChild` for our use case.

**Owned source, not an npm package** — every component lives in `src/components/ui/`.
You own the source. When Base UI or shadcn changes their API, you update on your
schedule, not theirs.

**Gallery with live render** — every component is rendered live in light and dark
mode at `/gallery/<category>/<component>`. The source snippet ships alongside the
render so contributors can copy-paste the usage example directly.

## What we chose not to bundle

Date picker, carousel, rich text editor, advanced charting (visx/nivo) — each of
these is a per-project choice worth its own ADR. They're dependency-gated:
documented in `docs/component-catalog.md` as "needs a dependency", not included
by default.

ADR 0005 documents the full policy.
