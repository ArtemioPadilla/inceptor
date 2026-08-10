# Data

`gallery.ts` category: `data` — the generic `<DataTable>` built on TanStack
Table + Virtual. **Coverage in this file: DataTable, PropertyFilter, and
fieldType.** PropertyFilter isn't yet linked into `gallery.ts`'s manifest on
its own (it shipped after this category's entry was written — see
`src/components/ui/property-filter.tsx`); it's documented here as the best
category fit (structured data filtering, the natural DataTable companion)
pending that link-up — it does appear, wired via `fieldType`, in the
`field-type` gallery entry below. See also `docs/COMPONENTS.md` §8 for a
longer, narrative walkthrough of DataTable — this entry is the condensed,
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

### Keyboard

Read directly from `src/components/ui/data-table.tsx` (ROADMAP Epic 18 —
keyboard-navigation contract tables, MUI Data Grid's `Key | Description`
format). **`DataTable` does not implement a roving-tabindex / arrow-key
grid-cell navigation model** the way MUI Data Grid does — every interactive
control (sort header, checkbox, pin toggle, expand chevron, filter input) is
a plain, natively-focusable HTML element that participates in normal DOM tab
order. There is no cell-to-cell arrow-key model to document because none
exists; the table below is grouped by interaction context instead.

**Sorting** (per sortable column — the header renders a real `<button>`):

| Key | Description |
|---|---|
| <kbd>Tab</kbd> / <kbd>Shift+Tab</kbd> | Move focus to the next/previous sortable column header button (native tab order). |
| <kbd>Enter</kbd> / <kbd>Space</kbd> | Cycle the focused column's sort: none → ascending → descending → none. |

**Selection** (when `enableSelection`):

| Key | Description |
|---|---|
| <kbd>Tab</kbd> / <kbd>Shift+Tab</kbd> | Move focus between the header "select all" checkbox and each row's checkbox. |
| <kbd>Space</kbd> | Toggle the focused checkbox (select-all or single row). |

**Column management**:

| Key | Description |
|---|---|
| <kbd>Tab</kbd> | Move focus to the "Columns" visibility trigger, or (when `enableColumnPinning`) each header's pin/unpin button. |
| <kbd>Enter</kbd> / <kbd>Space</kbd> | Activate the focused pin/unpin button, or open the "Columns" dropdown. |
| <kbd>↓</kbd> / <kbd>↑</kbd> | Inside the open "Columns" menu, move the highlighted item — inherited unmodified from Base UI's `Menu` primitive (see [`compound.md`](./compound.md)'s DropdownMenu section), not custom `DataTable` code. |
| <kbd>Esc</kbd> | Close the open "Columns" menu, return focus to its trigger. |
| — | Column **resize** (the drag handle on each header's right edge) is **not** keyboard-operable — it's wired to `onMouseDown`/`onTouchStart` only and marked `aria-hidden="true"`. Known gap, not an oversight to route around; there is currently no keyboard equivalent for resizing a column. |

**Filtering**:

| Key | Description |
|---|---|
| <kbd>Tab</kbd> | Move focus into the global filter `<input>`, or (when `enableColumnFilters`) each per-column filter `<input>`/`<select>`. |
| *(typing)* | Filters rows live as you type — client-side immediately, or debounced into a `request()` call in server-driven mode. No extra key required to apply the filter. |

**Row expansion** (when `renderSubRow` is supplied):

| Key | Description |
|---|---|
| <kbd>Tab</kbd> | Move focus to a row's expand/collapse chevron button. |
| <kbd>Enter</kbd> / <kbd>Space</kbd> | Toggle that row's detail row open/closed. |

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

---

## fieldType

Source: [`src/lib/field-type.ts`](../../src/lib/field-type.ts) (union +
pure formatting/Zod-schema helpers) and
[`src/components/ui/field-type/`](../../src/components/ui/field-type/)
(the JSX renderers). Gallery entry: `field-type` (slug), island
`ShowcaseFieldType`.

**Purpose**: One field-data-type definition (money, date, select-with-
options, status-badge…) drives FOUR previously-independent surfaces —
`DataTable` cell rendering, `PropertyFilter` filter-widget input, `Form`
field (react-hook-form `Controller` + Zod), and `description-list` row
display. Inspired by Ant Design ProComponents' `ProField` `valueType`
system (ROADMAP Epic 24).

**When to use**: Any data field whose meaning (formatting, validation,
filter widget) needs to stay consistent across 2+ of those four surfaces —
e.g. an "amount" column that also appears in a create/edit form and a
detail panel. For a one-off value that only ever needs a single surface
(a DataTable column with fully custom rendering and no form/filter/detail
equivalent), the raw per-surface APIs (`cell`, `render={...}`, hand-written
children) are still simpler and remain fully supported — fieldType wiring
is additive everywhere it touches.

**API overview**:

```ts
// src/lib/field-type.ts — the union + pure helpers
type FieldType =
  | { type: 'text'; label: string; placeholder?: string; minLength?: number; maxLength?: number }
  | { type: 'number'; label: string; min?: number; max?: number; step?: number }
  | { type: 'money'; label: string; currency: string; locale?: string; min?: number; max?: number }
  | { type: 'percent'; label: string; decimals?: number; min?: number; max?: number }
  | { type: 'date'; label: string; minDate?: Date; maxDate?: Date }
  | { type: 'dateRange'; label: string }
  | { type: 'select'; label: string; options: { label: string; value: string }[] }
  | { type: 'status'; label: string; statuses: { value: string; label: string; tone: StatusTone }[] }
  | { type: 'boolean'; label: string; trueLabel?: string; falseLabel?: string };

function formatFieldValue(fieldType: FieldType, value: unknown): string;
function fieldTypeZodSchema(fieldType: FieldType): z.ZodTypeAny;
```

- Define field defs **once**, typically as a `satisfies Record<string,
  FieldType>` object near the data model, and reuse the same object
  literals across every surface — see `ShowcaseFieldType.tsx` for the
  canonical worked example (`fieldDefs.amount`/`.status`/`.category` each
  feed a DataTable column, a Form field, a description-list row, and — for
  `status`/`category` — a PropertyFilter property).
- **DataTable**: give a `ColumnDef` `meta: { fieldType }` and omit `cell` —
  `data-table.tsx`'s `tableColumns` memo fills in
  `<FieldDisplay fieldType={...} value={getValue()} />` automatically. An
  explicit `cell` always wins (additive, not a replacement).
- **Form**: `<FieldFormItem control={form.control} name="amount"
  fieldType={fieldDefs.amount} />` (`src/components/ui/field-type/form-
  item.tsx`) renders the right widget (Input/NumberField/Checkbox/native
  `<select>`/DatePicker/DateRangePicker) wired to react-hook-form's
  `Controller`, wrapped in the existing `FormItem`/`FormLabel`/
  `FormControl`/`FormMessage` pieces. Build the Zod schema with
  `fieldTypeZodSchema` per field (Spec-DD, `docs/PRINCIPLES.md` §3) — full
  manual `<FormField render={...}>` usage still works everywhere.
- **description-list**: `<DescriptionItem term="Amount" fieldType={...}
  value={selected.amount} />` renders through the same `FieldDisplay` as
  DataTable cells. Omit `fieldType`/`value` and `children` renders exactly
  as before.
- **PropertyFilter**: give a `FilterProperty` a `fieldType` and
  `PropertyFilter` swaps its plain text `<input>` for a `<select>`
  (select/status/boolean), a date picker (date/dateRange), or a number
  input (money/number/percent), via `FieldFilterControl`
  (`src/components/ui/field-type/filter-control.tsx`), and derives
  `operators` from `defaultOperatorsForFieldType` when the property doesn't
  specify its own.
- `status`'s `tone` (`'success' | 'warning' | 'danger' | 'info' |
  'neutral'`) maps to a colored `<Badge>` in `FieldDisplay` — the same
  visual language as `ShowcaseDataTable.tsx`'s hand-rolled `STATUS_STYLES`
  map, just derived from data instead of a per-consumer switch statement.

**Common mistakes**:

- Expecting `PropertyFilter`'s `date`/`dateRange` fieldType filtering to do
  date-aware comparison — `filterByTokens` (the pure predicate
  `PropertyFilter` itself doesn't call automatically) coerces both sides via
  `Number(...)` for `'>'`/`'<'`/`'>='`/`'<='`, which isn't date-aware. Wire
  your own date-aware predicate for those operators if you need correct
  date-range filtering; `ShowcaseFieldType.tsx` deliberately leaves
  `createdAt` out of its `FILTER_PROPERTIES` for this reason.
- Forgetting `fieldTypeZodSchema`'s `'select'`/`'status'` case returns a
  `z.enum(...)` typed as plain `string` (not a literal union) at the
  TypeScript level — the cast to `[string, ...string[]]` needed to build
  the enum from a runtime `options`/`statuses` array loses the literal
  types. Runtime validation is still fully correct (only the configured
  values pass); if you need the narrower TypeScript type, declare it
  separately.
- Using `FieldFormItem` outside the same island as its surrounding `<Form>`
  — the compound-component gotcha (`CLAUDE.md`) applies here exactly as it
  does to every other `<Form>` usage.
