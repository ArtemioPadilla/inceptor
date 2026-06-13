---
title: Details page pattern
description: Read-only resource views — flat and tabbed.
---

How to show a single resource. Two variants ship as islands.

## Flat details

**`DetailsPageSimple`** — a header (name + key actions) over a key-value grid.
Use for resources with one logical group of attributes.

## Tabbed details

**`DetailsPageWithTabs`** — the same header over `Tabs`, one tab per facet
(Overview / Activity / Settings…). Use when a resource has distinct, sizeable
groups of information that shouldn't all load at once.

Both compose inside **`AppLayout`** (`src/components/islands/AppLayoutIsland.tsx`)
as the content region, optionally with a `SplitPanel` for contextual detail.

## Decisions this encodes

- **Header carries the resource identity + its primary actions** (edit,
  delete) — consistently placed so users build muscle memory.
- **Tabs over scrolling** once a page has 3+ distinct facets.
- **Read-only by default**; edit is an explicit affordance (see the
  [create flow](/docs/patterns/create-flow/) for the edit surface).

Live: [`/gallery/resource-details/`](/gallery/resource-details/).
