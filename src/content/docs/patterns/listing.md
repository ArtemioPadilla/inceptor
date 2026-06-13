---
title: Listing pattern
description: Filterable, sortable collections with honest empty and error states.
---

The most common product surface: a list of resources you can filter, sort,
and page through. Inceptor ships every piece; this is how they compose.

## Build it from

- **`useListing`** (`src/lib/use-listing.ts`) — normalizes raw data + filters
  into one of five states: `loading`, `error`, `emptyZero` (no data at all),
  `emptyFiltered` (data exists but the filter hid it), and `ready`. The
  zero-vs-filtered distinction is the whole point — they need different copy.
- **`PropertyFilter`** (`src/components/ui/property-filter.tsx`) — structured
  token filtering; feed its `filterByTokens` output to the table.
- **`DataTable`** (`src/components/ui/data-table.tsx`) — sort, column
  visibility, virtualization (50k rows), URL-state sync.
- **`EmptyState`** / **`ErrorState`** — the terminal states.

## The shape

```tsx
const { state, rows } = useListing(data, { filterPredicate });
if (state === 'loading') return <TableSkeleton />;
if (state === 'error') return <ErrorState … action={<Retry />} />;
if (state === 'emptyZero') return <EmptyState title="No resources yet" action={<Create />} />;
// emptyFiltered renders the filter + an inline "no matches" row, NOT a full empty state —
// the user must see their filter to clear it.
return (
  <>
    <PropertyFilter properties={…} tokens={tokens} onChange={setTokens} />
    <DataTable columns={columns} data={rows} />
  </>
);
```

## Decisions this encodes

- **Loading ≠ empty.** Never show "No results" while a request is in flight.
- **Zero-data and filtered-to-empty are different surfaces.** Zero offers a
  *create* affordance; filtered keeps the filter visible so it can be cleared.
- **Filter state belongs in the URL** (`DataTable syncToUrl`) so a filtered
  view is shareable and survives reload.

Live: [`/demos/data/large/`](/demos/data/large/) (50k rows, URL-synced filter+sort).
