import * as React from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/ui/data-table';
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

const columns: ColumnDef<Person, string>[] = [
  { accessorKey: 'id', header: 'ID', size: 60, enableResizing: true },
  { accessorKey: 'name', header: 'Name', size: 200, enableResizing: true },
  { accessorKey: 'role', header: 'Role', size: 160, enableResizing: true },
  {
    accessorKey: 'status',
    header: 'Status',
    size: 120,
    enableResizing: true,
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
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Structured token filtering (PropertyFilter) feeds the table; then sort,
        toggle column visibility, and resize widths. Virtualization is active
        even on this small dataset.
      </p>
      <PropertyFilter properties={FILTER_PROPERTIES} tokens={tokens} onChange={setTokens} />
      <DataTable
        columns={columns}
        data={filtered}
        height="360px"
        estimateRowSize={48}
      />
    </div>
    </ErrorBoundary>
  );
}
