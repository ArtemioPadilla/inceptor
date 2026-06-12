import * as React from 'react';
import {
  type ColumnDef,
  type ColumnSizingState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react';

import { Input } from '@/components/ui/input';
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
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { useDataTableUrlState } from '@/components/ui/use-data-table-url-state';

export interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
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
}

// SortIcon renders a plain SVG caret — no framer-motion, no JS animation library.
// Direction is derived from the column's current sort state.
function SortIcon({ direction }: { direction: 'asc' | 'desc' | false }) {
  if (direction === 'asc') return <ChevronUp className="ml-1 h-4 w-4 shrink-0" />;
  if (direction === 'desc') return <ChevronDown className="ml-1 h-4 w-4 shrink-0" />;
  return <ChevronsUpDown className="ml-1 h-4 w-4 shrink-0 text-muted-foreground" />;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  initialColumnVisibility = {},
  initialGlobalFilter = '',
  height = '500px',
  estimateRowSize = 40,
  syncToUrl = false,
}: DataTableProps<TData, TValue>) {
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

  const table = useReactTable({
    data,
    columns,
    // Column resizing via TanStack Table's built-in resize handler
    enableColumnResizing: true,
    columnResizeMode: 'onChange',
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: onSorting,
    onGlobalFilterChange: onGlobalFilter,
    onColumnVisibilityChange: onColumnVisibility,
    onColumnSizingChange: onColumnSizing,
    state: {
      sorting,
      globalFilter,
      columnVisibility,
      columnSizing,
    },
  });

  const rows = table.getRowModel().rows;

  // parentRef is the scrollable container — TanStack Virtual measures its clientHeight
  const parentRef = React.useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateRowSize,
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
              <TableRow key={headerGroup.id} className="sticky top-0 z-10 bg-background">
                {headerGroup.headers.map((header) => {
                  // aria-sort belongs on the <th> element (TableHead), not on an inner div.
                  const sortDir = header.column.getIsSorted();
                  const ariaSortValue: React.AriaAttributes['aria-sort'] = sortDir === 'asc'
                    ? 'ascending'
                    : sortDir === 'desc'
                      ? 'descending'
                      : 'none';
                  return (
                    <TableHead
                      key={header.id}
                      style={{ width: header.getSize() }}
                      className="relative select-none whitespace-nowrap"
                      aria-sort={header.column.getCanSort() ? ariaSortValue : undefined}
                    >
                      {header.isPlaceholder ? null : (
                        // Sortable headers use a real <button> for keyboard accessibility.
                        // The button is full-width and visually unstyled (appearance:none)
                        // so it looks identical to the previous div; focus ring added.
                        header.column.getCanSort() ? (
                          <button
                            type="button"
                            className={cn(
                              'flex w-full items-center cursor-pointer hover:text-foreground',
                              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm',
                            )}
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            <SortIcon direction={sortDir} />
                          </button>
                        ) : (
                          <div className="flex items-center">
                            {flexRender(header.column.columnDef.header, header.getContext())}
                          </div>
                        )
                      )}
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
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  No results.
                </td>
              </tr>
            ) : (
              virtualItems.map((virtualRow) => {
                // Non-null: virtualRow.index is always within rows bounds (virtualizer
                // is constructed with count = rows.length).
                const row = rows[virtualRow.index]!;
                return (
                  <TableRow
                    key={row.id}
                    data-index={virtualRow.index}
                    ref={rowVirtualizer.measureElement}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
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
    </div>
  );
}
