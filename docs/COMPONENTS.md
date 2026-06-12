# Component contribution guide

This guide is for contributors who are about to add their first component to this
template. It covers where things live, how to install components, when to use each
hydration directive, how theming works, and what is forbidden.

---

## 1. Quick reference — where things live

| Path | What lives there |
|---|---|
| `src/components/ui/` | shadcn primitive components — Button, Input, Dialog, etc. These are **owned source** you can edit freely. |
| `src/components/islands/` | React islands — one file per interactive composition, hydrated via a `client:*` directive from an `.astro` page. |
| `src/components/common/` | Shared Astro components that appear on every page (e.g. `FeedbackFAB.astro`, `ThemeToggle.astro`). No React; no hydration cost. |
| `src/layouts/` | Astro layout files (`BaseLayout.astro`). One per page type. |
| `src/lib/` | Pure utilities — `utils.ts` (exports `cn()`), future query client, etc. |
| `src/stores/` | Nano Stores for cross-island state (Phase 2+). Not React Context. |
| `src/styles/global.css` | Tailwind v4 import, CSS variable tokens (light + dark), and `@theme inline` mappings. |
| `src/pages/` | Astro routes. Astro treats every file here as a page — **do not put test files in `src/pages/`**. |
| `src/tests/` | Tests that target page-level sources (e.g. `showcase.test.ts`). |
| `components.json` | shadcn CLI configuration — `style: "default"`, alias `@/*`. |

---

## 2. Adding a shadcn component

There are two paths depending on whether the component needs an interactive
primitive (popover, focus trap, portal, etc.).

### Path A — CLI (for primitive-free components)

Use this for: `button`, `input`, `label`, `card`, `table`, `badge`, and any
other component that is pure styling with no interaction primitive.

```bash
npx shadcn@latest add <name> --yes
```

The CLI places the component in `src/components/ui/<name>.tsx` and updates
`components.json`. After running, immediately check for Radix imports:

```bash
grep -r '@radix-ui' src/components/ui/
```

**Any hit means the component pulled in a Radix primitive.** The default shadcn
registry is Radix-based. If you see a Radix import, discard the generated file
and follow Path B instead.

Then add a test alongside the component:

```bash
# src/components/ui/<name>.test.ts
```

Finally, add the component to `/showcase` (see `src/pages/showcase.astro`).

### Path B — Hand-written with Base UI (for interactive primitives)

Use this for: `dialog`, `dropdown-menu`, `tabs`, `toast`, `form`, and any other
component that requires a focus trap, portal, controlled open/close state, or
keyboard navigation primitive.

**Why Base UI instead of Radix?** We chose Base UI (`@base-ui-components/react`)
as our primitive layer. Mixing Radix and Base UI primitives in a single component
is forbidden (see Section 8). Base UI exposes the same accessibility primitives
as Radix but with an actively maintained codebase.

**How to write a Base UI wrapper:**

1. Import the primitive from `@base-ui-components/react/<primitive>`.
2. Map the Base UI sub-components to the shadcn API names consumers expect.
3. Apply `cn()` with the same Tailwind classes that the shadcn registry would use.
4. Export named exports matching the shadcn API.

`src/components/ui/dialog.tsx` is the canonical example. It wraps
`@base-ui-components/react/dialog` and exports `Dialog`, `DialogTrigger`,
`DialogContent`, `DialogHeader`, `DialogFooter`, `DialogTitle`, `DialogDescription`,
`DialogClose`, `DialogOverlay`, and `DialogPortal` — the same surface as the
shadcn/Radix version, so pages don't need to learn a new API.

Key differences from the Radix API:

- Base UI uses a `render` prop instead of `asChild`. To render a `DialogTrigger`
  as a `Button`, write:
  ```tsx
  <DialogTrigger render={<Button variant="outline" />}>Open</DialogTrigger>
  ```
  not `<DialogTrigger asChild><Button /></DialogTrigger>`.

- Base UI uses `data-[starting-style]` / `data-[ending-style]` for CSS-driven
  enter/exit animations instead of the Radix `data-[state=open|closed]` pattern.

Once the component is written:

```bash
grep -r '@radix-ui' src/components/ui/
# Must return nothing — no Radix imports allowed
```

Add tests and add the component to `/showcase`.

---

## 3. Hydration directives

Astro ships zero JS by default. You must explicitly opt interactive islands into
client-side hydration. Pick the directive that reflects when the island actually
needs to be interactive.

| Directive | When to use | Example in this repo |
|---|---|---|
| `client:load` | Above-the-fold interactivity required on first paint. Reserved for rare critical islands. We have **none** today. | — |
| `client:idle` | Secondary interactivity that should be ready shortly after load, but is not blocking. | `FeedbackFAB` (loaded at idle so it doesn't compete with page content) |
| `client:visible` | Below-the-fold components — hydrate when they scroll into view. Best default for most showcase and on-demand widgets. | Every island in `/showcase` |
| `client:media="(max-width: 768px)"` | Viewport-conditional — only hydrate on matching media. Good for mobile-only menus. | (Not in use yet) |
| `client:only="react"` | SSR cannot render this component (e.g. it reads `window` at import time). Last resort — it sends no HTML to the browser at all. | (Not in use yet) |

Usage in an `.astro` file:

```astro
---
import ShowcaseDialog from '../components/islands/ShowcaseDialog';
---
<ShowcaseDialog client:visible />
```

Note: import island files **without** the `.tsx` extension so Astro uses its
own resolution; the `.astro` extension IS required for Astro components.

---

## 4. The compound-component gotcha

This is the most common mistake when adding interactive components to an Astro
project. Read it once and remember it.

**The rule:** Components that share state internally — `Dialog`, `DropdownMenu`,
`Tabs`, `Toast`, controlled accordion, etc. — **must be wrapped in a single
React file and hydrated as one island.** You cannot spread the parts across
multiple islands or multiple `client:*` usages in the same `.astro` file.

**Why:** Astro's partial hydration creates a separate React root for each
`client:*` directive. State stored inside one React root is invisible to another.
A `Dialog.Root` in island A cannot communicate its open state to `Dialog.Content`
in island B — they are different React trees, even on the same page.

### The wrong pattern

```astro
---
// BAD: do not do this
import { Dialog, DialogTrigger, DialogContent } from '@/components/ui/dialog';
---
<!-- These are in separate React roots — state is broken -->
<Dialog client:visible>
  <DialogTrigger client:visible>Open</DialogTrigger>
  <DialogContent client:visible>...</DialogContent>
</Dialog>
```

### The correct pattern

Create one React file that owns the entire composition:

```tsx
// src/components/islands/ShowcaseDialog.tsx
import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger, DialogContent,
         DialogHeader, DialogTitle, DialogDescription,
         DialogFooter, DialogClose } from '@/components/ui/dialog';

// All Dialog sub-components live in one React tree — one island, one root.
export default function ShowcaseDialog() {
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" />}>
        Open dialog
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Example dialog</DialogTitle>
          <DialogDescription>Content goes here.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button />}>Confirm</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

Then hydrate the whole file as a single island from your `.astro` page:

```astro
---
import ShowcaseDialog from '../components/islands/ShowcaseDialog';
---
<ShowcaseDialog client:visible />
```

**Applies to:** `Dialog`, `DropdownMenu`, `Tabs`, `Toast`, `Form` (when it
includes a controlled field), and any other compound component where children of
a `<Root>` need to share state.

**Does not apply to:** Stateless presentational components like `Button`, `Card`,
`Badge`, `Input` in isolation — these can be used directly in `.astro` files
without hydration if they need no interactivity.

---

## 5. Theming via CSS vars

This repo uses a two-layer theming model.

### Layer 1 — design tokens in `global.css`

All color and radius tokens live in `src/styles/global.css` under
`@layer base`:

```css
@layer base {
  :root {
    --background: oklch(1 0 0);
    --foreground: oklch(0.145 0 0);
    --primary: oklch(0.205 0 0);
    --primary-foreground: oklch(0.985 0 0);
    --border: oklch(0.922 0 0);
    /* ... full list in global.css ... */
    --radius: 0.625rem;
  }

  .dark {
    --background: oklch(0.145 0 0);
    --foreground: oklch(0.985 0 0);
    /* dark overrides ... */
  }
}
```

Tokens use `oklch()` color space for perceptual uniformity. Do not use hex or
rgb values for semantic tokens.

### Layer 2 — Tailwind utility mapping via `@theme inline`

The tokens become Tailwind utilities through the `@theme inline` block:

```css
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-primary: var(--primary);
  --color-border: var(--border);
  /* ... */
}
```

This is what makes `bg-background`, `text-foreground`, `border-border`,
`text-primary`, etc. work as Tailwind classes. The mapping is explicit — only
tokens that appear in `@theme inline` become utilities.

### How to use tokens in components

Prefer semantic tokens over literal palette classes:

```tsx
// Good — adapts to dark mode automatically
<div className="bg-background text-foreground border border-border">
  <span className="text-muted-foreground">subtitle</span>
</div>

// Avoid — locked to a specific color, dark mode won't flip it
<div className="bg-gray-50 text-gray-900 border border-gray-200">
```

Use literal palette classes only when you genuinely mean "always this specific
color regardless of theme" — rare in UI shell code, sometimes needed in data
visualization.

### Legacy accent tokens

The `@theme` block (without `inline`) preserves four legacy tokens from Phase 0:

```css
@theme {
  --color-primary-400: #34d399;
  --color-primary-500: #10b981;
  --color-primary-600: #059669;
  --color-primary-700: #047857;
}
```

These are callable as `bg-primary-500`, `text-primary-600`, etc. They predate
the shadcn token set and are used for the FeedbackFAB's emerald accent. Keep
them for existing usages; new components should prefer `--primary` and
`--primary-foreground`.

### Adding a new token

1. Add the raw value under `:root { }` and its dark override under `.dark { }` in `global.css`.
2. Map it in `@theme inline { }` so Tailwind generates the utility.
3. Use the utility class in components.

---

## 6. Dark-mode tokens

### How dark mode works

Dark mode is **class-based**, not media-query-based. The selector in `global.css`
is:

```css
@variant dark (&:where(.dark, .dark *));
```

This means: apply dark styles to any element that is a descendant of a `.dark`
element (including the element itself). Adding `class="dark"` to `<html>` makes
the whole page dark. Adding it to any inner `<div>` makes that subtree dark — as
used in `/showcase`'s "Dark" preview column.

### Zero-flash initialization

`BaseLayout.astro` includes an inline script in `<head>` that runs synchronously
before the browser renders any content:

```html
<script is:inline>
  (function () {
    try {
      const stored = localStorage.getItem('theme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const isDark = stored === 'dark' || (stored === null && prefersDark);
      if (isDark) document.documentElement.classList.add('dark');
    } catch (_) {
      // localStorage / matchMedia unavailable — leave default (light)
    }
  })();
</script>
```

`is:inline` prevents Astro from hoisting this to a module script, which would
defer its execution. The script must run synchronously so the `.dark` class is
present before the first paint. Without it, users with dark preference would see
a white flash on every page load.

### Persisting the toggle

`ThemeToggle.astro` writes to `localStorage.theme` on click:

```js
btn.addEventListener('click', () => {
  const isDark = document.documentElement.classList.toggle('dark');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
});
```

The value `'dark'` or `'light'` is read back by the inline head script on the
next page load.

### Forcing dark on a subtree

To preview a component in dark mode independently of the page theme — for
example, in a side-by-side showcase — wrap it in a `<div class="dark">`:

```astro
<div class="dark rounded-lg border border-border bg-background p-6">
  <ShowcaseDialog client:visible />
</div>
```

Because the `@variant dark` selector matches `.dark *`, all descendant tokens
resolve to their dark values. The page-level theme is not affected.

---

## 7. Tests

Every new component file ships with a `*.test.{ts,tsx}` next to it. This repo
uses Vitest with `?raw` imports for source-inspection tests — they verify exports
and forbidden imports without needing a DOM.

### Pattern

```ts
// src/components/ui/my-component.test.ts
import { describe, expect, it } from 'vitest';
import source from './my-component.tsx?raw';

describe('MyComponent', () => {
  it('exports MyComponent', () => {
    // Named export must appear in the export block
    expect(source).toMatch(/export\s+\{[^}]*\bMyComponent\b/);
  });

  it('uses cn from @/lib/utils', () => {
    expect(source).toMatch(/from ['"]@\/lib\/utils['"]/);
  });

  it('does not import from @radix-ui', () => {
    expect(source).not.toMatch(/from .{1,2}@radix/);
  });
});
```

### Where to put tests

- Component tests: next to the component file (`src/components/ui/foo.test.ts`).
- Island tests: next to the island file (`src/components/islands/FooIsland.test.ts`).
- Page-level tests: in `src/tests/` — **not** in `src/pages/` (Astro treats
  every file in `src/pages/` as a route).

The vitest config (`vitest.config.ts`) includes `src/**/*.test.{ts,tsx}`, so all
locations above are picked up automatically.

---

## 8. Data tables

`src/components/ui/data-table.tsx` exports a generic `<DataTable<TData, TValue>>`
component that composes **TanStack Table v8** (sorting, filtering, column
visibility, column resizing) on top of **TanStack Virtual** (row virtualization)
and the shadcn `<Table>` primitives.

### Props surface

```tsx
interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];   // TanStack column definitions
  data: TData[];                          // Row data
  initialColumnVisibility?: VisibilityState; // Column id → visible
  initialGlobalFilter?: string;           // Pre-fill the filter input
  height?: string | number;              // Scroll container height (default '500px')
  estimateRowSize?: number;              // px per row for virtualizer (default 40)
}
```

### Generic column type-safety

Pass your data type as the first generic parameter and the accessor's value type
as the second:

```tsx
import { type ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/ui/data-table';

interface Issue {
  id: number;
  title: string;
  state: 'open' | 'closed';
  createdAt: string;
}

const columns: ColumnDef<Issue, string>[] = [
  { accessorKey: 'id',        header: 'ID',      size: 60  },
  { accessorKey: 'title',     header: 'Title',   size: 300 },
  { accessorKey: 'state',     header: 'State',   size: 100 },
  { accessorKey: 'createdAt', header: 'Created', size: 140 },
];

export default function IssuesTable({ data }: { data: Issue[] }) {
  return <DataTable columns={columns} data={data} height="600px" />;
}
```

TypeScript will enforce that `accessorKey` is a key of `Issue` and that
cell value accessors return the correct type.

### Virtualization defaults and tuning

TanStack Virtual renders only the rows visible in the scroll container (plus
10 rows of overscan on each side). The rest are replaced by invisible spacer
`<tr>` elements that maintain the correct scroll height.

| Prop | Default | When to change |
|---|---|---|
| `height` | `'500px'` | Match the viewport area you have available |
| `estimateRowSize` | `40` | Set to your actual row height — reduces layout jitter on first scroll |

For 50,000+ rows, set `estimateRowSize` to a value close to the real rendered
height. The virtualizer will self-correct via `measureElement`, but a good
initial estimate prevents scroll position jumps.

### Island wrapping requirement

`DataTable` is a stateful compound component — it owns sort, filter, and
visibility state internally. When using it in an Astro page, wrap it in a
single React file under `src/components/islands/` and hydrate that file
as one island. Do **not** spread the filter input and the table across
separate `client:*` usages.

```tsx
// src/components/islands/IssuesDataTable.tsx
import { DataTable } from '@/components/ui/data-table';
import { columns } from './columns';
import type { Issue } from '@/lib/types';

// This entire composition is one island — one React root, one hydration boundary.
export default function IssuesDataTable({ data }: { data: Issue[] }) {
  return <DataTable columns={columns} data={data} />;
}
```

```astro
---
// src/pages/issues.astro
import IssuesDataTable from '../components/islands/IssuesDataTable';
---
<IssuesDataTable data={issues} client:visible />
```

### Features at a glance

| Feature | How it works |
|---|---|
| **Sort** | Click any column header. Cycles: none → asc → desc. Sort direction shown with caret icon. |
| **Global filter** | Text input above the table. Filters all columns simultaneously via `getFilteredRowModel`. |
| **Column visibility** | "Columns" dropdown in the top-right. Uses `DropdownMenuCheckboxItem`. |
| **Column resizing** | Drag the handle at the right edge of any header. `enableColumnResizing: true` + `columnResizeMode: 'onChange'`. |
| **Row virtualization** | `useVirtualizer` renders only in-viewport rows + 10 overscan rows. Handles millions of rows without DOM overhead. |

---

## 9. Animation (LazyMotion)

This repo uses the `motion` package (the December 2024 merge of Framer Motion
and Motion One). **Never import from `framer-motion`** — see CLAUDE.md rule #6.

### The LazyMotion pattern

Wrap interactive islands that need physics-based or sequenced animation in a
`<LazyMotion features={domAnimation}>` boundary. `domAnimation` is a ~15 kb
gzip feature bundle covering the most common use cases: enter/exit transitions,
`AnimatePresence`, layout animations, and spring physics.

```tsx
// src/components/islands/MyIsland.tsx
import { LazyMotion, domAnimation, m, AnimatePresence } from 'motion/react';

export default function MyIsland() {
  return (
    <LazyMotion features={domAnimation} strict>
      {/* Use m.* — NOT motion.* — inside LazyMotion */}
      <m.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        Content
      </m.div>
    </LazyMotion>
  );
}
```

### Key rules

| Rule | Why |
|---|---|
| Use `m.*` not `motion.*` inside `<LazyMotion>` | `motion.*` loads the full feature set eagerly, negating the lazy-bundle split. The `strict` prop on `<LazyMotion>` throws at dev-time if you accidentally use `motion.*`. |
| Import only from `motion/react` | `framer-motion` is the pre-merge package and is no longer maintained. |
| Only inside React islands | Marketing/blog `.astro` surfaces must stay zero-JS. Motion has no Astro-native renderer; keep it inside `src/components/islands/`. |
| Hydrate with `client:visible`, not `client:load` | Motion islands are typically below the fold. Defer hydration until scroll. |

### When NOT to use LazyMotion

For simple CSS-class-based animations (fade-in on scroll, hover scale, etc.)
prefer `tailwindcss-motion` utilities — zero JS runtime. Reserve `motion/react`
for interactions that genuinely require JavaScript: spring physics,
`AnimatePresence` exit animations, or gesture tracking (`useDragControls`, etc.).

---

## 10. Forbidden imports

These are hard rules. The CI forbidden-import scan (when added) and code review
will reject any PR that violates them.

| Import | Why forbidden | Correct alternative |
|---|---|---|
| `@radix-ui/*` | We are on Base UI. Mixing Radix and Base UI in a single component breaks accessibility and state management. Never @radix-ui imports anywhere in `src/`. | `@base-ui-components/react/<primitive>` |
| `framer-motion` | Framer Motion merged with Motion One into the `motion` package in December 2024. The old package is no longer maintained. | `motion/react` — see Section 9 for the LazyMotion pattern. |
| `@tremor/react` | Tremor Raw is copy-paste only — you own the source in `src/components/ui/`. The `@tremor/react` npm package is a bundled distribution you cannot customize or tree-shake properly. | Copy-paste from [raw.tremor.so](https://raw.tremor.so) into `src/components/ui/` |
| `@astrojs/tailwind` | This integration is deprecated for Tailwind v4. It does not exist. | `@tailwindcss/vite` registered as a Vite plugin in `astro.config.mjs` |
| `React.createContext` for **cross-island** state | Astro's partial hydration creates a separate React root per island. Context does not cross island boundaries. | Nano Stores (`nanostores` + `@nanostores/react`) — arriving in Phase 2. |

**Note on React Context:** Context inside a single island file (i.e., a
compound component under `src/components/islands/`) is fine and expected — for
example, a Form island can use Context internally to pass validation state between
its fields. The prohibition is specifically on Context used to share state
*between* separately hydrated islands.

---

## 11. Data-fetching states: the dashboard exemplar

`src/components/islands/DashboardIsland.tsx` is the canonical reference for how
to handle all three non-happy-path states in a data-fetching island.

### The three states

| State | Condition | What to render |
|---|---|---|
| **Loading** | `isLoading === true` | `<Skeleton>` placeholders — `<KpiSkeleton>`, `<ChartSkeleton>`, `<TableSkeleton>` — that match the layout of the real content so there is no layout shift on hydration. |
| **Error** | `error !== null` | A structured error card with a **Retry** button. For GitHub rate-limit errors (HTTP 403 / 429) render a dedicated `<RateLimitErrorCard>` that explains the 60 req/h unauthenticated cap, shows "resets in ~N min" when the `X-RateLimit-Reset` header was captured, and links to the backend proxy option (`PUBLIC_API_BASE`, docs/building/backend). |
| **Empty** | Successful load, zero items | A positive / celebratory message — never the same copy as the loading placeholder. For the open-issues KPI when count is 0: a "🎉 inbox zero" sublabel rendered in emerald. For charts with no data: "No issues yet — all clear!" |

### Structured errors

To propagate HTTP metadata (status code, rate-limit reset epoch) from the
`queryFn` to the error display component, the island throws a typed error class
instead of a bare `Error`:

```ts
class GitHubApiError extends Error {
  readonly status: number;
  readonly rateLimitReset: number | undefined; // Unix epoch seconds

  constructor(status: number, rateLimitReset: number | undefined) {
    super(`GitHub API ${status}`);
    this.status = status;
    this.rateLimitReset = rateLimitReset;
  }
}
```

The `queryFn` parses `X-RateLimit-Reset` from the response headers and attaches
it to the error before throwing. The error UI then computes "resets in ~N min"
at **render time** (not at throw time) so the countdown reflects elapsed time.

```ts
// Inside queryFn:
const resetHeader = res.headers.get('X-RateLimit-Reset');
const rateLimitReset = resetHeader ? parseInt(resetHeader, 10) : undefined;
throw new GitHubApiError(res.status, rateLimitReset);

// In the UI component:
const minsUntilReset = error.rateLimitReset !== undefined
  ? Math.max(1, Math.ceil((error.rateLimitReset * 1000 - Date.now()) / 60_000))
  : null;
```

### File pointers

- Island: `src/components/islands/DashboardIsland.tsx`
- Page: `src/pages/demos/dashboard.astro`
- Tests: `src/tests/wave4-dashboard-states.test.ts`

### Applying the pattern elsewhere

Any island that fetches remote data should follow the same three-state model:

1. **Loading** — skeleton that mirrors the final layout.
2. **Error** — structured card with a retry action. Distinguish error subtypes
   (rate-limit, auth, network, server) so the user receives actionable guidance.
3. **Empty** — celebratory or neutral copy that is clearly distinct from loading.
   Never show the loading placeholder copy in the empty state.

---

## 12. Island lifecycle discipline

Every React island that registers side-effects in `useEffect` must clean them up
in the cleanup function. Stale listeners are the most common memory leak and are
especially dangerous if Astro View Transitions are added later.

### createDisposer

Use `createDisposer()` from `src/lib/disposer.ts` to group all teardowns.

```tsx
import React from 'react';
import { createDisposer } from '@/lib/disposer';

export default function MyIsland() {
  React.useEffect(() => {
    const d = createDisposer();

    // addEventListener wrapper — removeEventListener is queued automatically
    d.on(window, 'resize', handleResize);

    // setInterval wrapper — clearInterval is queued automatically
    d.interval(5000, () => poll());

    // Arbitrary teardown (e.g. for APIs with their own cleanup methods)
    const observer = new IntersectionObserver(cb);
    observer.observe(el);
    d.add(() => observer.disconnect());

    return d.dispose; // single cleanup
  }, []);

  return <div>...</div>;
}
```

The canonical exemplar is `src/components/islands/HydrationCanary.tsx`.

### Hydration-safe client preferences

Browser-only values — theme, locale, `prefers-reduced-motion` — cannot be read
during SSR. Reading them on first render causes a hydration mismatch. Use
`useClientPreference` from `src/lib/use-client-preference.ts`.

```tsx
import { useClientPreference, staticSubscribe } from '@/lib/use-client-preference';

// Stable across SSR + first paint; updates post-hydration without mismatch.
const theme = useClientPreference(
  () => (localStorage.getItem('theme') ?? 'light') as Theme,
  'light',         // server default — renders on server AND first client paint
  (onChange) => {
    window.addEventListener('storage', onChange);
    return () => window.removeEventListener('storage', onChange);
  },
);
```

Use `staticSubscribe` (re-exported from the module) when the value only changes
on page reload and no event listener is needed.

---

## 13. List state normalization with useListing

Every island that fetches a list of items goes through the same five states.
Use `useListing` from `src/lib/use-listing.ts` to make the transition explicit
and testable.

### The five states

| Status | Condition | What to render |
|---|---|---|
| `loading` | `isLoading === true` | `<Skeleton>` placeholders |
| `error` | fetch failed | `<ErrorState>` with retry action |
| `empty-zero` | fetch succeeded, zero items in the source | `<EmptyState>` — celebratory / "all clear" |
| `empty-filtered` | items exist, active filter matches nothing | `<EmptyState>` — actionable / "try a different search" |
| `ready` | filtered items to display | render the list |

### Why two empty states?

`empty-zero` and `empty-filtered` require different copy and actions:
- Zero-data: "No issues yet — be the first to file one." (Positive; primary CTA)
- Filtered: "No results for 'authentication'. Try clearing the filter." (Actionable; secondary CTA)

Conflating them with a single state leads to confusing copy like "No issues yet"
when the user has just typed a search term.

### Usage

```tsx
import { useListing } from '@/lib/use-listing';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';

const listing = useListing({
  isLoading: query.isLoading,
  error: query.error ?? null,
  allItems: query.data ?? [],
  filteredItems: (query.data ?? []).filter(applySearch),
});

if (listing.status === 'loading') return <Skeleton />;
if (listing.status === 'error')
  return (
    <ErrorState
      title="Failed to load"
      hint={listing.error.message}
      action={<Button onClick={refetch}>Retry</Button>}
    />
  );
if (listing.status === 'empty-zero')
  return <EmptyState title="No items yet" description="Items you add will appear here." />;
if (listing.status === 'empty-filtered')
  return <EmptyState title="No results" description="Try a different search term." />;
return <List items={listing.items} />;
```

### EmptyState vs ErrorState

| Component | When to use | Semantic root |
|---|---|---|
| `EmptyState` | Zero data or filtered-to-empty | `<div>` (no alert semantics — it's not an error) |
| `ErrorState` | Fetch failure or unexpected error | `<div role="alert">` (announced to screen readers immediately) |

Both live in `src/components/ui/` and accept `icon`, `title`, a hint/description
slot, and an `action` slot.

---

## 14. FeedbackFAB and the AI triage trust gate

The FeedbackFAB files GitHub issues from anonymous visitors, and those
issues feed the Claude triage workflow. The two surfaces are deliberately
decoupled by a **human-in-the-loop gate** (ADR 0007): the triage workflow
only auto-runs for issues opened by OWNER/MEMBER/COLLABORATOR authors —
anonymous FAB-filed issues wait until a maintainer applies the
`ai-approved` label. Issue content is always treated as untrusted data by
the triage prompt; never weaken either layer when touching
`.github/workflows/claude.yml` or the FAB.

## Checklist for new components

Use this before opening a PR:

- [ ] Component lives in `src/components/ui/` (primitive) or `src/components/islands/` (interactive composition).
- [ ] No `@radix-ui/*` imports anywhere in the file.
- [ ] No `framer-motion`, `@tremor/react`, or `@astrojs/tailwind` imports.
- [ ] Compound components are wrapped in one island file, not spread across an `.astro` page.
- [ ] CSS classes use semantic tokens (`bg-background`, `text-foreground`) not literal palette values (`bg-gray-950`).
- [ ] A `*.test.ts` file ships alongside the component, covering at minimum: export exists, no forbidden imports.
- [ ] Component appears in `/showcase` (`src/pages/showcase.astro`).
- [ ] `npm run build`, `npm run check`, `npm run test` all pass.
