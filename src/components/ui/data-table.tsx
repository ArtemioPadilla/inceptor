import * as React from 'react';
import {
  type Column,
  type ColumnDef,
  type ColumnFiltersState,
  type ColumnPinningState,
  type ColumnSizingState,
  type ExpandedState,
  type Row as TableRowModel,
  type RowSelectionState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  ChevronDown,
  ChevronRight,
  ChevronUp,
  ChevronsUpDown,
  PinIcon,
  PinOffIcon,
} from 'lucide-react';

import { ActionBar } from '@/components/ui/action-bar';
import { Checkbox } from '@/components/ui/checkbox';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { useDataTableUrlState } from '@/components/ui/use-data-table-url-state';
import { useListing } from '@/lib/use-listing';

// Module augmentation: lets column defs opt into a per-column <select> filter
// (instead of the default text input) by supplying `meta.filterOptions`. Kept
// here (not a separate .d.ts) so it's colocated with the one feature that
// reads it — see the per-column filter row below.
declare module '@tanstack/react-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- TData/TValue are part of the augmented interface's generic signature
  interface ColumnMeta<TData, TValue> {
    /** Options for the per-column filter `<select>`; omit for a text input. */
    filterOptions?: { label: string; value: string }[];
  }
}

/** The sort/filter parameters passed to a `request` function each call. */
export interface DataTableRequestParams {
  sorting: SortingState;
  globalFilter: string;
  columnFilters: ColumnFiltersState;
}

/** What a `request` function must resolve with. */
export interface DataTableRequestResult<TData> {
  data: TData[];
  /** Total matching row count (server-side), independent of `data.length`. */
  total: number;
}

/**
 * Server-paginated/sorted/filtered data source contract (ROADMAP Epic 23).
 * Passing this via the `request` prop switches <DataTable> from client-side
 * array filtering/sorting to manual mode: TanStack Table stops re-deriving
 * rows locally and the table instead re-calls `request` (debounced) whenever
 * sort/filter state changes, routing isLoading/error/data through
 * `useListing` (see `src/lib/use-listing.ts`) for the loading/error/empty
 * states. Memoize `request` (useCallback) in the consumer — it's a dependency
 * of the internal fetch effect, so a new reference each render re-fetches.
 */
export type DataTableRequestFn<TData> = (
  params: DataTableRequestParams,
) => Promise<DataTableRequestResult<TData>>;

export interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  /**
   * Row data for client-side mode. Ignored (and optional) when `request` is
   * supplied — the table's internal request state is the data source then.
   */
  data?: TData[];
  /** Initial column visibility — column id to visible boolean. */
  initialColumnVisibility?: VisibilityState;
  /** Initial global filter string. */
  initialGlobalFilter?: string;
  /** Height of the scroll container in CSS units. Defaults to '500px'. */
  height?: string | number;
  /** Estimated row height in px for virtualization. Defaults to 40. */
  estimateRowSize?: number;
  /**
   * Sync filter/sort/visibility/sizing to URLSearchParams so views are
   * shareable and survive page refresh. Pass `{ key: 'myTable' }` to
   * namespace URL params when multiple DataTables share a page.
   * Defaults to false (no URL syncing).
   */
  syncToUrl?: boolean | { key: string };
  /**
   * Opt-in row-selection column: a "select all" checkbox in the header and a
   * per-row checkbox. Off by default so existing tables are unaffected
   * (ROADMAP Epic 23). Uses TanStack Table's built-in row-selection state.
   */
  enableSelection?: boolean;
  /**
   * Bulk-action buttons rendered inside Epic 22's `<ActionBar>` once 1+ rows
   * are selected. Receives the currently-selected row data. Only meaningful
   * when `enableSelection` is true.
   */
  renderBulkActions?: (selectedRows: TData[]) => React.ReactNode;
  /**
   * Opt-in column pinning (ROADMAP Epic 23 / Epic 8's deferred item). Renders
   * a small pin/unpin icon button in each pinnable header cell. Pinned-left
   * columns get `position: sticky` so they stay visible during horizontal
   * scroll. Uses TanStack Table's built-in column-pinning state.
   */
  enableColumnPinning?: boolean;
  /**
   * Opt-in per-column filter row, rendered below the sort-header row. Beyond
   * the existing global text filter — each filterable column gets its own
   * text `<input>`, or a `<select>` when its column def sets
   * `meta.filterOptions`. Wired to TanStack Table's `columnFilters` state.
   * Scoped deliberately simple; `PropertyFilter` covers token-based
   * structured filtering when that's needed instead.
   */
  enableColumnFilters?: boolean;
  /**
   * Opt-in row expansion. When supplied, an expand/collapse chevron column
   * is prepended and clicking it reveals a full-width detail row rendered
   * by this callback. Uses TanStack Table's row-expansion state (a plain
   * `expanded` boolean map, not the tree-data `subRows` API — `renderSubRow`
   * content is arbitrary, not a nested TData[]). The detail row is folded
   * into the same virtualized item list as the data rows so scroll offsets
   * stay accurate while rows are expanded.
   */
  renderSubRow?: (row: TData) => React.ReactNode;
  /**
   * Optional footer/summary row (e.g. computed totals), keyed by column id.
   * Rendered as one `<tfoot>` cell per visible leaf column; columns absent
   * from the map render an empty cell.
   */
  summaryRow?: Record<string, React.ReactNode>;
  /**
   * Extra top offset (px) for the sticky header row, e.g. when the table
   * sits below a fixed page header inside its own scroll container. The
   * header is already `position: sticky` relative to the internal scroll
   * container (co-existing with virtualization); this just shifts `top`.
   * Defaults to 0.
   */
  stickyHeaderOffset?: number;
  /**
   * Opt-in `localStorage` persistence for column visibility, keyed by this
   * string. Reads happen only inside a post-mount `useEffect` (never during
   * SSR/first client render) so there is no hydration mismatch — same
   * guard-after-mount convention as `useClientPreference`
   * (`src/lib/use-client-preference.ts`), just component-owned state instead
   * of an external-store subscription. When both `syncToUrl` and this prop
   * are set, the URL wins (it's already present on first paint).
   */
  persistColumnVisibility?: string;
  /**
   * Server-driven data source (ROADMAP Epic 23's most architecturally
   * significant item). See `DataTableRequestFn`'s doc comment for the full
   * contract. When set, `data` is ignored, sorting/filtering switch to
   * TanStack Table's manual mode, and loading/error/empty states are routed
   * through `useListing` instead of the always-array-based client path —
   * existing client-side-array consumers are completely unaffected.
   */
  request?: DataTableRequestFn<TData>;
  /** Debounce (ms) before calling `request` after sort/filter state changes. Defaults to 300. */
  requestDebounceMs?: number;
}

// SortIcon renders a plain SVG caret — no framer-motion, no JS animation library.
// Direction is derived from the column's current sort state.
function SortIcon({ direction }: { direction: 'asc' | 'desc' | false }) {
  if (direction === 'asc') return <ChevronUp className="ml-1 h-4 w-4 shrink-0" />;
  if (direction === 'desc') return <ChevronDown className="ml-1 h-4 w-4 shrink-0" />;
  return <ChevronsUpDown className="ml-1 h-4 w-4 shrink-0 text-muted-foreground" />;
}

const columnFilterInputClass = cn(
  'h-8 w-full rounded-md border border-input bg-background px-2 text-xs',
  'placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
);

// ColumnFilterInput renders one per-column filter control (Epic 23): a
// text <input> by default, or a <select> when the column def opts in via
// `meta.filterOptions`. Deliberately simple — PropertyFilter is the
// token-based structured-filtering component for cases that need more.
function ColumnFilterInput<TData>({ column }: { column: Column<TData, unknown> }) {
  const label =
    typeof column.columnDef.header === 'string' ? column.columnDef.header : column.id;
  const value = (column.getFilterValue() as string | undefined) ?? '';
  const options = column.columnDef.meta?.filterOptions;

  if (options) {
    return (
      <select
        aria-label={`Filter ${label}`}
        value={value}
        onChange={(e) => column.setFilterValue(e.target.value || undefined)}
        className={columnFilterInputClass}
      >
        <option value="">All</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    );
  }

  return (
    <input
      type="text"
      aria-label={`Filter ${label}`}
      value={value}
      onChange={(e) => column.setFilterValue(e.target.value || undefined)}
      placeholder="Filter…"
      className={columnFilterInputClass}
    />
  );
}

export function DataTable<TData, TValue>({
  columns,
  data = [],
  initialColumnVisibility = {},
  initialGlobalFilter = '',
  height = '500px',
  estimateRowSize = 40,
  syncToUrl = false,
  enableSelection = false,
  renderBulkActions,
  enableColumnPinning = false,
  enableColumnFilters = false,
  renderSubRow,
  summaryRow,
  stickyHeaderOffset = 0,
  persistColumnVisibility,
  request,
  requestDebounceMs = 300,
}: DataTableProps<TData, TValue>) {
  // Server-driven mode (Epic 23): request replaces the `data` prop as the
  // source of truth, and TanStack Table switches to manual sorting/filtering.
  const isServerDriven = typeof request === 'function';
  // Derive the URL-sync config from the syncToUrl prop.
  const urlEnabled = Boolean(syncToUrl);
  const urlKey = typeof syncToUrl === 'object' ? syncToUrl.key : undefined;

  // useDataTableUrlState reads from URLSearchParams on mount and writes back
  // on change (debounced, via replaceState). When syncToUrl is false it's a
  // no-op that returns the empty state so all other logic below is unchanged.
  const [urlState, writeUrl] = useDataTableUrlState(urlEnabled, urlKey);

  // Seed each piece of table state from the URL (if enabled) or from the prop.
  // urlState defaults to empty strings/arrays/objects when URL sync is off, so
  // the prop values take precedence via the fallback expressions below.
  const [globalFilter, setGlobalFilter] = React.useState(
    urlEnabled && urlState.globalFilter ? urlState.globalFilter : initialGlobalFilter,
  );
  const [sorting, setSorting] = React.useState<SortingState>(
    urlEnabled && urlState.sorting.length > 0 ? urlState.sorting : [],
  );
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>(
    urlEnabled && Object.keys(urlState.columnVisibility).length > 0
      ? urlState.columnVisibility
      : initialColumnVisibility,
  );
  const [columnSizing, setColumnSizing] = React.useState<ColumnSizingState>(
    urlEnabled ? urlState.columnSizing : {},
  );

  // Mirror URL state changes (driven by popstate / back-forward) back into the
  // local React state so the table re-renders with the restored values.
  React.useEffect(() => {
    if (!urlEnabled) return;
    setGlobalFilter(urlState.globalFilter);
    setSorting(urlState.sorting);
    setColumnVisibility(urlState.columnVisibility);
    setColumnSizing(urlState.columnSizing);
  }, [urlEnabled, urlState]);

  // Wrapped state-setter helpers that also write to the URL when sync is on.
  const onGlobalFilter = (v: string) => {
    setGlobalFilter(v);
    if (urlEnabled) writeUrl({ globalFilter: v });
  };

  const onSorting = React.useCallback(
    (updater: React.SetStateAction<SortingState>) => {
      setSorting((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater;
        if (urlEnabled) writeUrl({ sorting: next });
        return next;
      });
    },
    [urlEnabled, writeUrl],
  );

  const onColumnVisibility = React.useCallback(
    (updater: React.SetStateAction<VisibilityState>) => {
      setColumnVisibility((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater;
        if (urlEnabled) writeUrl({ columnVisibility: next });
        return next;
      });
    },
    [urlEnabled, writeUrl],
  );

  const onColumnSizing = React.useCallback(
    (updater: React.SetStateAction<ColumnSizingState>) => {
      setColumnSizing((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater;
        if (urlEnabled) writeUrl({ columnSizing: next });
        return next;
      });
    },
    [urlEnabled, writeUrl],
  );

  // Column-visibility persistence (Epic 23). Runs only in a post-mount
  // effect — never during render/SSR — so there's no hydration mismatch;
  // the first paint always uses initialColumnVisibility/URL state, matching
  // what the server rendered. The URL (when synced) already reflects the
  // restored value on first paint, so it takes precedence over localStorage.
  React.useEffect(() => {
    if (!persistColumnVisibility) return;
    if (urlEnabled && Object.keys(urlState.columnVisibility).length > 0) return;
    try {
      const raw = localStorage.getItem(persistColumnVisibility);
      if (!raw) return;
      const stored = JSON.parse(raw) as VisibilityState;
      setColumnVisibility(stored);
    } catch {
      // localStorage unavailable (private mode) or malformed JSON — ignore,
      // the table just falls back to initialColumnVisibility.
    }
    // Intentionally mount-only: this is a one-time restore, not a live sync.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [persistColumnVisibility]);

  React.useEffect(() => {
    if (!persistColumnVisibility) return;
    try {
      localStorage.setItem(persistColumnVisibility, JSON.stringify(columnVisibility));
    } catch {
      // localStorage unavailable (private mode, quota) — persistence is
      // best-effort, never a hard requirement for the table to function.
    }
  }, [persistColumnVisibility, columnVisibility]);

  // Row-selection state (Epic 23). Kept as plain useState — it's local UI
  // state, not synced to the URL (selections shouldn't survive a shared link).
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});

  // Prepend a checkbox column (enableSelection) and/or an expand-chevron
  // column (renderSubRow). Memoized so the column array identity is stable
  // across renders that don't change the inputs (avoids TanStack Table
  // re-deriving column state every render).
  const tableColumns = React.useMemo<ColumnDef<TData, TValue>[]>(() => {
    const extraColumns: ColumnDef<TData, TValue>[] = [];

    if (enableSelection) {
      extraColumns.push({
        id: '__select',
        size: 36,
        enableSorting: false,
        enableHiding: false,
        enableResizing: false,
        enableColumnFilter: false,
        header: ({ table: t }) => (
          <Checkbox
            checked={t.getIsAllRowsSelected()}
            indeterminate={!t.getIsAllRowsSelected() && t.getIsSomeRowsSelected()}
            onCheckedChange={(value) => t.toggleAllRowsSelected(Boolean(value))}
            aria-label="Select all rows"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(Boolean(value))}
            aria-label={`Select row ${row.id}`}
          />
        ),
      });
    }

    if (renderSubRow) {
      extraColumns.push({
        id: '__expand',
        size: 32,
        enableSorting: false,
        enableHiding: false,
        enableResizing: false,
        enableColumnFilter: false,
        header: () => null,
        cell: ({ row }) => (
          <button
            type="button"
            onClick={() => row.toggleExpanded()}
            aria-label={row.getIsExpanded() ? 'Collapse row' : 'Expand row'}
            aria-expanded={row.getIsExpanded()}
            className={cn(
              'inline-flex items-center justify-center rounded-sm p-0.5 text-muted-foreground',
              'hover:bg-accent hover:text-accent-foreground',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            )}
          >
            <ChevronRight
              className={cn('h-4 w-4 transition-transform', row.getIsExpanded() && 'rotate-90')}
            />
          </button>
        ),
      });
    }

    return extraColumns.length > 0 ? [...extraColumns, ...columns] : columns;
  }, [columns, enableSelection, renderSubRow]);

  // Column-pinning state (Epic 23 / Epic 8's deferred item).
  const [columnPinning, setColumnPinning] = React.useState<ColumnPinningState>({});

  // Per-column filter state (Epic 23). Independent of `globalFilter` — both
  // can be active simultaneously; TanStack Table ANDs them together via
  // getFilteredRowModel.
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);

  // Row-expansion state (Epic 23). A plain `{ [rowId]: boolean }` map — we
  // don't use TanStack's tree-data `getExpandedRowModel`/`subRows` since
  // `renderSubRow` content is arbitrary JSX, not nested TData rows.
  const [expanded, setExpanded] = React.useState<ExpandedState>({});

  // Server-driven request state (Epic 23). Only ever written to when
  // isServerDriven — client-array mode never touches this.
  const [requestState, setRequestState] = React.useState<{
    data: TData[];
    total: number;
    isLoading: boolean;
    error: Error | null;
  }>({ data: [], total: 0, isLoading: isServerDriven, error: null });
  // Bumped by the ErrorState's Retry action to force a re-fetch without
  // requiring sort/filter state to actually change.
  const [retryNonce, setRetryNonce] = React.useState(0);

  React.useEffect(() => {
    if (!isServerDriven || !request) return;
    let cancelled = false;
    setRequestState((prev) => ({ ...prev, isLoading: true, error: null }));
    const timer = setTimeout(() => {
      request({ sorting, globalFilter, columnFilters })
        .then((result) => {
          if (cancelled) return;
          setRequestState({ data: result.data, total: result.total, isLoading: false, error: null });
        })
        .catch((err: unknown) => {
          if (cancelled) return;
          const normalized = err instanceof Error ? err : new Error(String(err));
          setRequestState({ data: [], total: 0, isLoading: false, error: normalized });
        });
    }, requestDebounceMs);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [isServerDriven, request, sorting, globalFilter, columnFilters, requestDebounceMs, retryNonce]);

  // The five-state loading/error/empty-zero/empty-filtered/ready model (see
  // docs/COMPONENTS.md §13). Always computed (useListing is a pure function,
  // not a hook that requires unconditional calls) but only *used* to drive
  // rendering when isServerDriven — client-array mode keeps its existing,
  // unconditional "No results." text so no current consumer's behavior
  // changes. `allItemsForListing` fakes a non-empty array when the request
  // returned zero rows while a filter was active, so useListing reports
  // 'empty-filtered' instead of 'empty-zero' — its contract distinguishes
  // "zero items in the source" from "filtered to zero" via array length,
  // and a server response alone can't tell us the true unfiltered count.
  const hasActiveRequestFilter = globalFilter.length > 0 || columnFilters.length > 0;
  const allItemsForListing: TData[] =
    requestState.data.length > 0
      ? requestState.data
      : hasActiveRequestFilter
        ? ([{}] as TData[])
        : [];
  const listing = useListing<TData>({
    isLoading: isServerDriven ? requestState.isLoading : false,
    error: isServerDriven ? requestState.error : null,
    allItems: isServerDriven ? allItemsForListing : data,
    filteredItems: isServerDriven ? requestState.data : data,
  });

  const tableData = isServerDriven ? requestState.data : data;

  const table = useReactTable({
    data: tableData,
    columns: tableColumns,
    // Column resizing via TanStack Table's built-in resize handler
    enableColumnResizing: true,
    columnResizeMode: 'onChange',
    enableRowSelection: enableSelection,
    enableColumnPinning,
    enableExpanding: Boolean(renderSubRow),
    // Server-driven mode: the request already sorted/filtered `data`, so
    // TanStack Table must not re-derive rows locally — it just reflects the
    // sorting/columnFilters/globalFilter state back into the header UI.
    manualSorting: isServerDriven,
    manualFiltering: isServerDriven,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: onSorting,
    onGlobalFilterChange: onGlobalFilter,
    onColumnVisibilityChange: onColumnVisibility,
    onColumnSizingChange: onColumnSizing,
    onRowSelectionChange: setRowSelection,
    onColumnPinningChange: setColumnPinning,
    onColumnFiltersChange: setColumnFilters,
    onExpandedChange: setExpanded,
    state: {
      sorting,
      globalFilter,
      columnVisibility,
      columnSizing,
      rowSelection,
      columnPinning,
      expanded,
      columnFilters,
    },
  });

  // Selected row data for the ActionBar + renderBulkActions callback.
  const selectedRows = React.useMemo(
    () => table.getSelectedRowModel().rows.map((r) => r.original),
    // rowSelection is the actual dependency that changes selection — the
    // getSelectedRowModel() call itself is derived from table state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [table, rowSelection],
  );

  const rows = table.getRowModel().rows;

  // Flatten data rows + any expanded "detail" rows into one list so the
  // virtualizer treats each as an independent, individually-measured item —
  // this keeps scroll offsets accurate while rows are expanded/collapsed
  // instead of the virtualizer silently under-counting expanded content's
  // height (see the DataTableProps.renderSubRow doc comment).
  type FlatItem =
    | { kind: 'row'; row: TableRowModel<TData> }
    | { kind: 'detail'; row: TableRowModel<TData> };

  const flatItems = React.useMemo<FlatItem[]>(() => {
    if (!renderSubRow) return rows.map((row) => ({ kind: 'row' as const, row }));
    const items: FlatItem[] = [];
    for (const row of rows) {
      items.push({ kind: 'row', row });
      if (row.getIsExpanded()) items.push({ kind: 'detail', row });
    }
    return items;
    // `expanded` isn't read directly here, but row.getIsExpanded() reflects
    // it via the `table` instance recreated each render — include it so this
    // memo recomputes exactly when expansion state (or the row set) changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, renderSubRow, expanded]);

  // parentRef is the scrollable container — TanStack Virtual measures its clientHeight
  const parentRef = React.useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: flatItems.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (index) =>
      flatItems[index]?.kind === 'detail' ? estimateRowSize * 3 : estimateRowSize,
    overscan: 10,
  });

  // Force a re-measure after mount so the virtualizer knows the real container
  // height. Without this, jsdom/browsers may report 0 clientHeight at mount and
  // render 0 virtual items until the user scrolls.
  React.useEffect(() => {
    rowVirtualizer.measure();
  }, [rowVirtualizer]);

  // Attach a ResizeObserver so the virtualizer re-measures whenever the
  // scroll-container's dimensions change (e.g. responsive layout shifts).
  React.useEffect(() => {
    const el = parentRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => rowVirtualizer.measure());
    ro.observe(el);
    return () => ro.disconnect();
  }, [rowVirtualizer]);

  const virtualItems = rowVirtualizer.getVirtualItems();
  const totalSize = rowVirtualizer.getTotalSize();

  // Padding rows are spacers that keep the virtualized window in the right position
  // Non-null assertions are safe: the length > 0 guard above guarantees both indexes exist.
  const paddingTop = virtualItems.length > 0 ? virtualItems[0]!.start : 0;
  const paddingBottom =
    virtualItems.length > 0 ? totalSize - virtualItems[virtualItems.length - 1]!.end : 0;

  // True empty-state: data has been filtered to zero rows.
  // We must NOT show this while virtualItems are momentarily 0 during initial
  // measurement — so we gate on the actual model row count, not the virtual window.
  const isDataEmpty = rows.length === 0;

  return (
    <div className="space-y-3">
      {/* Toolbar: global filter + column visibility toggle */}
      <div className="flex items-center gap-3 flex-wrap">
        <Input
          placeholder="Filter all columns…"
          value={globalFilter}
          onChange={(e) => onGlobalFilter(e.target.value)}
          className="max-w-sm"
          aria-label="Global filter"
        />
        <DropdownMenu>
          <DropdownMenuTrigger
            className={cn(
              'ml-auto inline-flex items-center gap-1.5 rounded-md border border-input bg-background',
              'px-3 py-2 text-sm shadow-sm hover:bg-accent hover:text-accent-foreground',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            )}
          >
            Columns
            <ChevronDown className="h-4 w-4 opacity-60" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[10rem]">
            <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {table
              .getAllColumns()
              .filter((col) => col.getCanHide())
              .map((col) => (
                <DropdownMenuCheckboxItem
                  key={col.id}
                  checked={col.getIsVisible()}
                  onCheckedChange={(value) => col.toggleVisibility(Boolean(value))}
                >
                  {/* Use header string when available, fall back to column id */}
                  {typeof col.columnDef.header === 'string'
                    ? col.columnDef.header
                    : col.id}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/*
       * Server-driven mode (Epic 23) routes loading/error/empty states
       * through useListing's five-state model instead of the client-array
       * path's always-rendered table + unconditional "No results." text —
       * client-array consumers are unaffected (isServerDriven is false).
       */}
      {isServerDriven && listing.status === 'loading' ? (
        <div className="space-y-2 rounded-md border border-border p-3" role="status" aria-label="Loading">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      ) : isServerDriven && listing.status === 'error' ? (
        <ErrorState
          title="Failed to load"
          hint={listing.error.message}
          action={
            <button
              type="button"
              onClick={() => setRetryNonce((n) => n + 1)}
              className={cn(
                'inline-flex items-center justify-center rounded-md border border-input bg-background',
                'px-3 py-2 text-sm shadow-sm hover:bg-accent hover:text-accent-foreground',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              )}
            >
              Retry
            </button>
          }
        />
      ) : isServerDriven && listing.status === 'empty-zero' ? (
        <EmptyState title="No items yet" description="Items you add will appear here." />
      ) : isServerDriven && listing.status === 'empty-filtered' ? (
        <EmptyState title="No results" description="Try a different search term." />
      ) : (
        <>
      {/* Scroll container measured by the virtualizer */}
      <div
        ref={parentRef}
        style={{
          height: typeof height === 'number' ? `${height}px` : height,
          overflow: 'auto',
        }}
        className="rounded-md border border-border"
      >
        {/*
         * We bypass the <Table> wrapper's `overflow-auto` div here because the
         * scroll is managed by parentRef above. Rendering the table directly
         * inside lets the virtualizer measure the true offset of each row.
         */}
        <table className="w-full caption-bottom text-sm">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="sticky z-10 bg-background"
                style={{ top: stickyHeaderOffset }}
              >
                {headerGroup.headers.map((header) => {
                  // aria-sort belongs on the <th> element (TableHead), not on an inner div.
                  const sortDir = header.column.getIsSorted();
                  const ariaSortValue: React.AriaAttributes['aria-sort'] = sortDir === 'asc'
                    ? 'ascending'
                    : sortDir === 'desc'
                      ? 'descending'
                      : 'none';
                  // Column-pinning (Epic 23): sticky-position pinned-left/right
                  // columns so they stay visible during horizontal scroll.
                  const pinnedSide = header.column.getIsPinned();
                  const pinStyle: React.CSSProperties = pinnedSide
                    ? {
                        position: 'sticky',
                        left: pinnedSide === 'left' ? header.column.getStart('left') : undefined,
                        right: pinnedSide === 'right' ? header.column.getAfter('right') : undefined,
                        zIndex: 20,
                        background: 'var(--background)',
                      }
                    : {};
                  const headerLabel =
                    typeof header.column.columnDef.header === 'string'
                      ? header.column.columnDef.header
                      : header.column.id;
                  return (
                    <TableHead
                      key={header.id}
                      style={{ width: header.getSize(), ...pinStyle }}
                      className="relative select-none whitespace-nowrap"
                      aria-sort={header.column.getCanSort() ? ariaSortValue : undefined}
                      data-pinned={pinnedSide || undefined}
                    >
                      <div className="flex items-center justify-between gap-1">
                        {header.isPlaceholder ? null : (
                          // Sortable headers use a real <button> for keyboard accessibility.
                          // The button is visually unstyled (appearance:none) so it looks
                          // identical to a plain div; focus ring added.
                          header.column.getCanSort() ? (
                            <button
                              type="button"
                              className={cn(
                                'flex min-w-0 items-center cursor-pointer hover:text-foreground',
                                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm',
                              )}
                              onClick={header.column.getToggleSortingHandler()}
                            >
                              {flexRender(header.column.columnDef.header, header.getContext())}
                              <SortIcon direction={sortDir} />
                            </button>
                          ) : (
                            <div className="flex min-w-0 items-center">
                              {flexRender(header.column.columnDef.header, header.getContext())}
                            </div>
                          )
                        )}
                        {enableColumnPinning && header.column.getCanPin() && (
                          <button
                            type="button"
                            onClick={() =>
                              header.column.pin(pinnedSide ? false : 'left')
                            }
                            aria-label={
                              pinnedSide
                                ? `Unpin ${headerLabel} column`
                                : `Pin ${headerLabel} column left`
                            }
                            className={cn(
                              'inline-flex shrink-0 items-center justify-center rounded-sm p-0.5',
                              'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                              pinnedSide && 'text-primary',
                            )}
                          >
                            {pinnedSide ? (
                              <PinOffIcon className="h-3 w-3" />
                            ) : (
                              <PinIcon className="h-3 w-3" />
                            )}
                          </button>
                        )}
                      </div>
                      {/* Column resize handle — drag to resize column width */}
                      {header.column.getCanResize() && (
                        <div
                          onMouseDown={header.getResizeHandler()}
                          onTouchStart={header.getResizeHandler()}
                          className={cn(
                            'absolute right-0 top-0 h-full w-1 cursor-col-resize touch-none select-none',
                            'bg-border opacity-0 hover:opacity-100',
                            header.column.getIsResizing() && 'bg-primary opacity-100',
                          )}
                          aria-hidden="true"
                        />
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
            {/* Per-column filter row (Epic 23) — one input/select per
             * filterable leaf column, independent of the global filter. */}
            {enableColumnFilters && (
              <TableRow>
                {(table.getHeaderGroups().at(-1)?.headers ?? []).map((header) => (
                  <TableHead key={`${header.id}-filter`} className="py-1.5">
                    {header.column.getCanFilter() && (
                      <ColumnFilterInput column={header.column} />
                    )}
                  </TableHead>
                ))}
              </TableRow>
            )}
          </TableHeader>
          <TableBody>
            {/* Top spacer — pushes the visible virtual window down */}
            {paddingTop > 0 && (
              <tr aria-hidden="true">
                <td style={{ height: paddingTop }} />
              </tr>
            )}
            {isDataEmpty ? (
              <tr>
                <td
                  colSpan={tableColumns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  No results.
                </td>
              </tr>
            ) : (
              virtualItems.map((virtualRow) => {
                // Non-null: virtualRow.index is always within flatItems bounds
                // (virtualizer is constructed with count = flatItems.length).
                const item = flatItems[virtualRow.index]!;

                if (item.kind === 'detail') {
                  return (
                    <tr
                      key={`${item.row.id}-detail`}
                      data-index={virtualRow.index}
                      ref={rowVirtualizer.measureElement}
                    >
                      <td colSpan={tableColumns.length} className="bg-muted/30 p-3">
                        {renderSubRow?.(item.row.original)}
                      </td>
                    </tr>
                  );
                }

                const row = item.row;
                return (
                  <TableRow
                    key={row.id}
                    data-index={virtualRow.index}
                    ref={rowVirtualizer.measureElement}
                  >
                    {row.getVisibleCells().map((cell) => {
                      const pinnedSide = cell.column.getIsPinned();
                      const cellPinStyle: React.CSSProperties = pinnedSide
                        ? {
                            position: 'sticky',
                            left: pinnedSide === 'left' ? cell.column.getStart('left') : undefined,
                            right: pinnedSide === 'right' ? cell.column.getAfter('right') : undefined,
                            zIndex: 10,
                            background: 'var(--background)',
                          }
                        : {};
                      return (
                        <TableCell key={cell.id} style={cellPinStyle} data-pinned={pinnedSide || undefined}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })
            )}
            {/* Bottom spacer — reserves space for rows below the viewport */}
            {paddingBottom > 0 && (
              <tr aria-hidden="true">
                <td style={{ height: paddingBottom }} />
              </tr>
            )}
          </TableBody>
          {/* Optional summary/footer row (Epic 23) — e.g. computed totals. */}
          {summaryRow && (
            <TableFooter>
              <TableRow>
                {table.getVisibleLeafColumns().map((col) => (
                  <TableCell key={col.id} className="font-medium">
                    {summaryRow[col.id] ?? null}
                  </TableCell>
                ))}
              </TableRow>
            </TableFooter>
          )}
        </table>
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
        <span>
          {table.getFilteredRowModel().rows.length} row
          {table.getFilteredRowModel().rows.length === 1 ? '' : 's'}
        </span>
        <span>
          Showing {virtualItems.length} of {rows.length} in viewport
        </span>
      </div>
        </>
      )}

      {/* Bulk-action toolbar (Epic 22's ActionBar) — only rendered when rows
       * are selectable and 1+ are currently selected. */}
      {enableSelection && (
        <ActionBar
          selectedCount={selectedRows.length}
          onClearSelection={() => setRowSelection({})}
        >
          {renderBulkActions?.(selectedRows)}
        </ActionBar>
      )}
    </div>
  );
}
