# Data

`gallery.ts` category: `data` — the generic `<DataTable>` built on TanStack
Table + Virtual. **Coverage in this file: DataTable and PropertyFilter.**
PropertyFilter isn't yet linked into `gallery.ts`'s manifest (it shipped
after this category's entry was written — see
`src/components/ui/property-filter.tsx`); it's documented here as the best
category fit (structured data filtering, the natural DataTable companion)
pending that link-up. See also `docs/COMPONENTS.md` §8 for a longer,
narrative walkthrough of DataTable — this entry is the condensed,
agent-facing API reference version.

---

## DataTable

Source: [`src/components/ui/data-table.tsx`](../../src/components/ui/data-table.tsx)

**Purpose**: A generic `<DataTable<TData, TValue>>` composing **TanStack
Table v8** (sort, global filter, column visibility, column resizing) on top
of **TanStack Virtual** (row virtualization) and the shadcn `<Table>`
primitives — handles millions of rows without full DOM materialization.

**When to use**: Any tabular dataset large enough to benefit from
virtualization, or any table needing sort/filter/column-visibility/resize
without hand-rolling TanStack Table wiring yourself. For a handful of static
rows with no interaction, the plain `<Table>` primitive alone is simpler and
avoids the virtualizer's height-measurement overhead.

**API overview**:

```tsx
interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  initialColumnVisibility?: VisibilityState;
  initialGlobalFilter?: string;
  height?: string | number;        // default '500px'
  estimateRowSize?: number;        // default 40 (px)
  syncToUrl?: boolean | { key: string }; // default false
}
```

- Pass your row type as `TData` and `columns: ColumnDef<TData, TValue>[]` —
  TypeScript enforces `accessorKey` is a real key of `TData`.
- `syncToUrl`: when truthy, filter/sort/visibility/column-sizing state is
  mirrored to `URLSearchParams` (debounced write, `history.replaceState`) so
  views are shareable and survive refresh/back-forward. Pass
  `{ key: 'myTable' }` to namespace params when multiple `DataTable`s share
  one page — otherwise their URL keys collide.
- `estimateRowSize`: set close to your **actual** rendered row height for
  large datasets (50k+ rows) — the virtualizer self-corrects via
  `measureElement`, but a bad initial estimate causes visible scroll-position
  jumps on first scroll.
- Sorting cycles none → asc → desc per column header click; column
  visibility is a "Columns" dropdown (built from `DropdownMenuCheckboxItem`
  — see [`compound.md`](./compound.md)); column resize is a drag handle on
  each header's right edge.

**Common mistakes**:

- Spreading the global-filter `<Input>` and the `<table>` across separate
  islands — `DataTable` is a **single stateful compound component**; wrap
  the whole thing (including any filter controls that live outside it) in
  one island file, per `docs/COMPONENTS.md` §8's explicit warning.
- Setting `height` to a value smaller than a single row's rendered height —
  the virtualizer can end up rendering zero visible rows if the scroll
  container can't fit even one.
- Reusing `syncToUrl: true` on two `DataTable`s on the same page **without**
  distinct `{ key }` namespaces — their URL state silently overwrites each
  other.
- Passing a `data` array that gets a brand-new array/object identity on
  every parent render (e.g. `data={rows.map(...)}` inline) — defeats
  TanStack Table's internal memoization and can cause visible flicker on
  every keystroke in the global filter. Memoize `data`/`columns` in the
  caller.

---

## PropertyFilter

Source: [`src/components/ui/property-filter.tsx`](../../src/components/ui/property-filter.tsx)

**Purpose**: Token-based **structured** filtering — the user composes
`{ property, operator, value }` tokens shown as removable chips, instead of
one fuzzy free-text box. Ships with a pure, independently-testable predicate
function, `filterByTokens`, separate from the builder UI.

**When to use**: Filtering a dataset (typically feeding a `DataTable`) where
users need to combine multiple precise conditions (`status = open`,
`priority >= 3`) rather than one imprecise search string. For a single
fuzzy text filter, `DataTable`'s own built-in global filter `<Input>` is
already sufficient — don't reach for `PropertyFilter` by default.

**API overview**:

```tsx
type Operator = '=' | '!=' | ':' | '>' | '<' | '>=' | '<=';

interface FilterProperty {
  key: string;
  label: string;
  operators?: Operator[]; // defaults to ['=', ':']
}
interface FilterToken {
  property: string;
  operator: Operator;
  value: string;
}

interface PropertyFilterProps {
  properties: FilterProperty[];
  tokens: FilterToken[];
  onChange: (tokens: FilterToken[]) => void;
  className?: string;
  placeholder?: string;
}

// Pure predicate — apply the current tokens to a row array yourself:
function filterByTokens<T extends object>(rows: T[], tokens: FilterToken[]): T[];
```

- Fully controlled — the parent owns `tokens`; `onChange` receives the
  **full next array** (add/remove both go through the same callback), not a
  single-token delta.
- `filterByTokens` applies tokens with **AND semantics** — a row must match
  *every* token, not any. There's no built-in OR/grouping.
- Numeric operators (`>`, `<`, `>=`, `<=`) coerce both the row value and the
  token value via `Number(...)`; if either side isn't numeric,
  `filterByTokens` treats that token as non-matching for that row (never
  throws).
- String operators (`=`, `!=`, `:`) are case-insensitive substring
  (`:` = "contains") or exact (`=`/`!=`) comparisons on the lowercased
  string form of the row value.

**Common mistakes**:

- Calling `filterByTokens` on a row shape that doesn't have `t.property` as
  a literal key — it indexes with
  `(row as Record<string, unknown>)[t.property]`, so a mismatched
  `FilterProperty.key` silently filters against `undefined` (which then
  fails every non-empty-value comparison) rather than throwing a helpful
  error.
- Forgetting `onChange` replaces the whole array — a naive
  `onChange={(t) => setTokens([...tokens, t])}` misreads the callback
  signature; `PropertyFilter` already computes and passes the full next
  array (`onChange([...tokens, newToken])` internally on add,
  `onChange(tokens.filter(...))` on remove) — don't append to the array a
  second time in your handler.
- Not re-running `filterByTokens` (or your own equivalent) when `tokens`
  changes — `PropertyFilter` only manages the token UI; it does **not**
  filter your data for you. Wire `tokens` into `filterByTokens(rows, tokens)`
  yourself, typically feeding the result into `<DataTable data={...} />`.
