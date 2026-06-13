---
title: Empty, error & loading states
description: The three non-happy states every data surface owes its users.
---

Every surface that loads data has three states besides "ready", and skipping
any of them is the most common UX bug. Inceptor ships a primitive for each.

## The states

- **Loading** → **`Skeleton`** (`src/components/ui/skeleton.tsx`). Reserve
  layout so content doesn't jump. Never render "No results" while loading.
- **Error** → **`ErrorState`** (`src/components/ui/error-state.tsx`). Icon +
  what went wrong + a recovery action (Retry). For rate limits, say so and
  show retry-after.
- **Empty** → **`EmptyState`**. Distinguish **zero-data** ("nothing here yet" +
  a create affordance) from **filtered-to-empty** ("no matches" + keep the
  filter visible). `useListing` computes which one you're in.

## Decisions this encodes

- **Four states minimum**: loading, error, empty, ready. Wire all four before
  shipping a data surface — the [listing pattern](/docs/patterns/listing/)
  bakes them in.
- **Errors are actionable**, not dead ends.
- **Celebrate the good empty** — "inbox zero 🎉" beats a blank panel.

Live: the dashboard exercises all four — [`/demos/dashboard/`](/demos/dashboard/).
