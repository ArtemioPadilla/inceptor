---
title: Patterns
description: How to build common product surfaces from Inceptor's primitives — the layer above components.
---

Components tell you *how to import* a control. **Patterns** tell you *when and
how to build a surface* out of them. This is the layer
[Cloudscape](https://cloudscape.design/patterns/) leans on hardest, and the one
that multiplies a kit's value — see [`docs/CLOUDSCAPE-GAP-ROADMAP.md`](https://github.com/ArtemioPadilla/inceptor/blob/main/docs/CLOUDSCAPE-GAP-ROADMAP.md)
Epic B.

Every pattern below is built from primitives that already ship in the
[gallery](/gallery/) and is demonstrated by a live page under [`/demos/`](/demos/).

## The catalog

| Pattern | Build it from | Live demo |
|---|---|---|
| [Listing](/docs/patterns/listing/) | `useListing` + `DataTable` + `PropertyFilter` + `EmptyState`/`ErrorState` | [`/demos/data/large/`](/demos/data/large/) |
| [Create flow](/docs/patterns/create-flow/) | `Wizard` (multi-step) or `Form` (single-page) + Zod | [`/gallery/wizard/`](/gallery/wizard/) |
| [Details page](/docs/patterns/details-page/) | `DetailsPageSimple` / `DetailsPageWithTabs` + `AppLayout` | [`/gallery/resource-details/`](/gallery/resource-details/) |
| [Delete with confirmation](/docs/patterns/delete-confirm/) | `AlertDialog` + `Flashbar` | [`/gallery/overlays/`](/gallery/overlays/) |
| [Empty / error / loading states](/docs/patterns/states/) | `Skeleton`, `EmptyState`, `ErrorState`, `useListing` | [`/demos/dashboard/`](/demos/dashboard/) |

## The rule of thumb

Reach for a pattern, not a raw component, when a surface recurs: a list of
things, a form that creates a thing, a page that shows a thing, a destructive
action. The patterns encode the decisions (which empty state? confirm how
hard? validate when?) so each new surface is a fill-in-the-blanks, not a
redesign.
