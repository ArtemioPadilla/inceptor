---
title: Hydration directives
description: "client:load vs idle vs visible vs media vs only."
---

Astro ships zero JS by default. You must explicitly opt interactive islands into
client-side hydration. Pick the directive that reflects when the island actually
needs to be interactive.

## The directives

| Directive | When to use | Example in this repo |
|---|---|---|
| `client:load` | Above-the-fold interactivity required on first paint. Reserved for rare critical islands. We have **none** today. | — |
| `client:idle` | Secondary interactivity that should be ready shortly after load, but is not blocking. | `FeedbackFAB` (loaded at idle so it doesn't compete with page content) |
| `client:visible` | Below-the-fold components — hydrate when they scroll into view. Best default for most showcase and on-demand widgets. | Every island in `/showcase` |
| `client:media="(max-width: 768px)"` | Viewport-conditional — only hydrate on matching media. Good for mobile-only menus. | (Not in use yet) |
| `client:only="react"` | SSR cannot render this component (e.g. it reads `window` at import time). Last resort — sends no HTML at all. | (Not in use yet) |

## Usage

```astro
---
import ShowcaseDialog from '../components/islands/ShowcaseDialog';
---
<ShowcaseDialog client:visible />
```

Note: import island files **without** the `.tsx` extension so Astro uses its own
resolution. The `.astro` extension IS required for Astro components.

## Decision guide

Ask these questions in order:

1. Does this island need to be interactive before the user scrolls? → `client:idle`
2. Is it below the fold or triggered by a user action? → `client:visible`
3. Is it only needed on a specific viewport? → `client:media`
4. Does it read `window` or `document` at import time, making SSR impossible? → `client:only`
5. Is it truly required before the page is usable? → `client:load` (rare — justify it)

## The compound-component constraint

If an island contains compound state (Dialog, Tabs, Dropdown), the entire composition
must be one island — one `client:*` directive on one React file. See
[The compound-component gotcha](/docs/building/compound-components/).

Full guide → [`docs/COMPONENTS.md §3`](https://github.com/ArtemioPadilla/inceptor/blob/main/docs/COMPONENTS.md#3-hydration-directives)
