import * as React from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/ui/data-table';
import { generateRows, type FakeRow } from '@/lib/fake-rows';

const ROW_COUNT = 50_000;

const columns: ColumnDef<FakeRow>[] = [
  { accessorKey: 'id', header: 'ID', size: 80 },
  { accessorKey: 'name', header: 'Name', size: 180 },
  { accessorKey: 'email', header: 'Email', size: 260 },
  { accessorKey: 'role', header: 'Role', size: 120 },
  { accessorKey: 'status', header: 'Status', size: 120 },
  {
    accessorKey: 'score',
    header: 'Score',
    size: 100,
    cell: (info) => (info.getValue() as number).toFixed(2),
  },
  { accessorKey: 'joined', header: 'Joined', size: 130 },
];

export default function LargeTable() {
  // useMemo so the dataset isn't regenerated on every parent render. With
  // 50,000 rows this is the difference between a smooth hydration and an
  // initial-render stutter.
  const data = React.useMemo(() => generateRows(ROW_COUNT, 42), []);
  return (
    <div>
      <p className="mb-3 text-sm text-muted-foreground">
        Rendering <strong className="text-foreground">{ROW_COUNT.toLocaleString()}</strong> generated rows
        through TanStack Virtual. Try scrolling, sorting, filtering, toggling
        column visibility — input latency should stay well under 50 ms.
      </p>
      <DataTable<FakeRow, unknown>
        columns={columns}
        data={data}
        height="600px"
        estimateRowSize={36}
      />
    </div>
  );
}
