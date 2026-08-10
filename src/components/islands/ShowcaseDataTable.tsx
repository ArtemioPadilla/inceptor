import * as React from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import {
  PropertyFilter,
  filterByTokens,
  type FilterToken,
  type FilterProperty,
} from '@/components/ui/property-filter';
import ErrorBoundary from './ErrorBoundary';

// Sample data for the showcase — illustrates generic column type-safety.
// TData = Person, TValue inferred from the accessorKey.
interface Person {
  id: number;
  name: string;
  role: string;
  status: 'active' | 'inactive' | 'pending';
  joined: string;
}

const PEOPLE: Person[] = [
  { id: 1, name: 'Alice Nguyen', role: 'Engineering', status: 'active', joined: '2022-03-15' },
  { id: 2, name: 'Bob Kim', role: 'Design', status: 'active', joined: '2021-07-01' },
  { id: 3, name: 'Carol Smith', role: 'Product', status: 'inactive', joined: '2020-11-20' },
  { id: 4, name: 'David Lee', role: 'Engineering', status: 'pending', joined: '2024-01-08' },
  { id: 5, name: 'Eva Martinez', role: 'Marketing', status: 'active', joined: '2023-05-30' },
  { id: 6, name: 'Frank Osei', role: 'Engineering', status: 'active', joined: '2022-09-14' },
  { id: 7, name: 'Grace Patel', role: 'Design', status: 'inactive', joined: '2021-02-28' },
  { id: 8, name: 'Hiro Tanaka', role: 'Product', status: 'active', joined: '2023-12-01' },
];

const STATUS_STYLES: Record<Person['status'], string> = {
  active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  inactive: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
};

// Escape a value for a CSV cell — wraps in quotes and doubles embedded quotes
// whenever the value itself contains a comma, quote, or newline.
function csvCell(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

const columns: ColumnDef<Person, string>[] = [
  { accessorKey: 'id', header: 'ID', size: 60, enableResizing: true },
  { accessorKey: 'name', header: 'Name', size: 200, enableResizing: true },
  { accessorKey: 'role', header: 'Role', size: 160, enableResizing: true },
  {
    accessorKey: 'status',
    header: 'Status',
    size: 120,
    enableResizing: true,
    meta: {
      // Per-column filter row (Epic 23): renders a <select> instead of a
      // text input for this column.
      filterOptions: [
        { label: 'Active', value: 'active' },
        { label: 'Inactive', value: 'inactive' },
        { label: 'Pending', value: 'pending' },
      ],
    },
    cell: ({ getValue }) => {
      const value = getValue() as Person['status'];
      return (
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[value]}`}
        >
          {value}
        </span>
      );
    },
  },
  { accessorKey: 'joined', header: 'Joined', size: 130, enableResizing: true },
];

// ShowcaseDataTable is a single island wrapping the full DataTable composition.
// This avoids the compound-component gotcha (DataTable manages its own filter
// and sort state internally — it cannot span multiple islands).
const FILTER_PROPERTIES: FilterProperty[] = [
  { key: 'name', label: 'Name', operators: [':', '='] },
  { key: 'role', label: 'Role', operators: ['=', '!='] },
  { key: 'status', label: 'Status', operators: ['=', '!='] },
  { key: 'id', label: 'ID', operators: ['>', '<', '>=', '<='] },
];

export default function ShowcaseDataTable() {
  const [tokens, setTokens] = React.useState<FilterToken[]>([]);
  const filtered = React.useMemo(() => filterByTokens(PEOPLE, tokens), [tokens]);

  return (
    <ErrorBoundary name="ShowcaseDataTable">
    <div className="space-y-3 pb-16">
      <p className="text-sm text-muted-foreground">
        Structured token filtering (PropertyFilter) feeds the table; then
        sort, pin, per-column filter, expand a row for detail, select rows
        for bulk actions, resize widths, and export. Virtualization is active
        even on this small dataset.
      </p>
      <PropertyFilter properties={FILTER_PROPERTIES} tokens={tokens} onChange={setTokens} />
      <DataTable
        columns={columns}
        data={filtered}
        height="360px"
        estimateRowSize={48}
        enableSelection
        renderBulkActions={(selected) => (
          <Button size="sm" variant="destructive" onClick={() => alert(`Would delete ${selected.length} row(s)`)}>
            Delete
          </Button>
        )}
        enableColumnPinning
        enableColumnFilters
        renderSubRow={(row) => (
          <dl className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-4">
            <div>
              <dt className="text-muted-foreground">Full name</dt>
              <dd className="font-medium text-foreground">{row.name}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Role</dt>
              <dd className="font-medium text-foreground">{row.role}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Status</dt>
              <dd className="font-medium text-foreground">{row.status}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Joined</dt>
              <dd className="font-medium text-foreground">{row.joined}</dd>
            </div>
          </dl>
        )}
        summaryRow={{ id: `${filtered.length} of ${PEOPLE.length}`, status: 'Totals →' }}
        persistColumnVisibility="showcase-datatable-columns"
        onExport={() => {
          const header = ['id', 'name', 'role', 'status', 'joined'].join(',');
          const rows = filtered.map((p) =>
            [p.id, p.name, p.role, p.status, p.joined].map((v) => csvCell(String(v))).join(','),
          );
          const csv = [header, ...rows].join('\n');
          return Promise.resolve(new Blob([csv], { type: 'text/csv' }));
        }}
        exportFilename="people.csv"
      />
    </div>
    </ErrorBoundary>
  );
}
