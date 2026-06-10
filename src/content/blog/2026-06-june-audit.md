---
title: "The June 2026 audit: auditing ourselves with our own loop"
description: What a full site audit found, what we fixed same-day, and what it says about the template's own methodology.
pubDate: 2026-06-09
tags:
  - changelog
  - audit
  - process
author: artemiopadilla
---

On June 9, 2026, we ran a full audit of the deployed site at
`https://artemiop.com/inceptor/` — design, UX, UI, functionality, accessibility,
SEO, performance, tests, and CI — using the same Claude Code orchestration loop
the scaffold is built around. The audit found 10 top findings. We fixed 8 of them
the same day across three waves of PRs (#136–#148).

The meta-finding: the loop works. Running it against itself was the most rigorous
test we'd given it.

## What the audit found

The site looks polished at first glance — strong editorial typography, coherent
emerald identity, live-rendered gallery. But underneath:

**Three P0 production bugs:**

1. `DataCloneError` thrown on every page that mounts a `QueryProvider` — the IDB
   persister tried to structured-clone a `Promise` inside dehydrated pending queries.
   Every dashboard visitor saw a red error badge on the FeedbackFAB — the template
   reporting its own bug with its own error-reporting surface.

2. Dashboard charts rendered empty — bars had axes but no bars, donut had a legend
   but no segments. A `dataKey` mismatch between the series spec and the Recharts
   props.

3. Docs search silently dead — `DocsSearch.astro` hardcoded `/_pagefind/` (root-absolute)
   but the bundle lives at `/inceptor/_pagefind/`. Invisible to all `?raw` tests.

**One P1 that had been in production since launch:**

The `robots.txt` pointed crawlers at `https://inceptor.example/sitemap-index.xml` —
a placeholder domain that somehow survived six months of CI.

**And broader surface gaps:**

- No custom 404 — GitHub Pages served its default
- No footer on any page
- Homepage stats were hardcoded (and wrong: "60 pages / 439 tests" vs actual 68/476)
- The docs had 19 stub pages ("being migrated" stubs) occupying real sidebar slots
- The blog had one placeholder post

## What we fixed, and when

### Wave 1 — P0 production fixes (#136)

Same day. Robots.txt real domain, Pagefind `BASE_URL` fix, custom 404, blog redirect
base-awareness, chart `isAnimationActive={false}` for all 6 chart types.

The IDB persister fix: added `q.state.status === 'success'` to the
`shouldDehydrateQuery` filter. Pending queries no longer sail into IndexedDB.

### Wave 2 — Trust & polish (#137–#139, #141, #143–#144)

`SiteFooter` with nav recap, GitHub link, MIT license, language switcher.
Canonical/hreflang in `BaseLayout`. `color-scheme` meta. Skip-to-content link.
FeedbackFAB dialog anchored bottom-right (was top-left — a disorienting diagonal
jump). Language switcher in `SiteHeader`. Homepage stats computed at build time
via `import.meta.glob`. Dashboard loading states replaced bare `"…"` strings
with `Skeleton` components.

### Wave 3 — Dashboard P0 (#146–#147)

Chart rendering fixed by correcting the `dataKey` mapping and adding a
`bothEmpty` guard for the zero-open-issues case. DataTable empty-state now gates
on data length, not virtual item count.

### Wave 4 — Docs surfaces (#140, #142, #145)

"Edit this page" link in `DocsLayout`. All 19 stub pages migrated to real
content. Three real blog posts (the ones you might be reading right now).

## What the audit didn't catch

The report is honest about its own limits. Not verified:

- Real mobile viewports (the automation session couldn't shrink the window)
- Backend test suites (never run in CI — documented gap in `ci.yml`)
- The remaining P2 findings (double build per CI run, `aria-sort` on `<div>`
  instead of `<th>`, chart SVGs without `role="img"`)

These go into the backlog, not into the same-day fixes. The methodology: fix P0
same-day, P1 same-week, P2 backlogged with a test that gates the regression.

## The meta-lesson

The audit was run by the same loop that built the site. The agents (prometeo,
forja, centinela) planned and executed the fixes using the same branch-PR-merge
pattern documented in the scaffold's own docs. The interesting thing: the loop
found genuine P0 bugs that had survived six months of CI — not because CI was
broken, but because the tests were asserting source text (`?raw` imports) rather
than behavior. The IDB persister bug and the chart rendering bug were invisible to
source-text tests.

The follow-up: behavior contracts (RTL, render tests) are now the default for
`type:feat` issues at `tdd-tier:strict`. Source-text assertions stay as smoke
tests, not as the only gate.

Audit document → [`docs/AUDIT-2026-06.md`](https://github.com/ArtemioPadilla/inceptor/blob/main/docs/AUDIT-2026-06.md)
