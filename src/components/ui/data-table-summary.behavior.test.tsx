// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import * as React from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { DataTable } from './data-table';

class MockResizeObserver {
  observe = vi.fn();
  disconnect = vi.fn();
  unobserve = vi.fn();
}

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', MockResizeObserver);
  vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(500);
  vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(800);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

interface Row {
  id: string;
  name: string;
  amount: number;
}

const columns: ColumnDef<Row, unknown>[] = [
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'amount', header: 'Amount' },
];

const data: Row[] = [
  { id: '1', name: 'Alice', amount: 10 },
  { id: '2', name: 'Bob', amount: 20 },
];

describe('DataTable summary/footer row (Epic 23)', () => {
  it('renders no footer when summaryRow is unset (backward compat)', () => {
    render(<DataTable columns={columns} data={data} />);
    expect(screen.queryByText('Total: 30')).not.toBeInTheDocument();
  });

  it('renders a footer row from summaryRow, keyed by column id', () => {
    render(
      <DataTable
        columns={columns}
        data={data}
        summaryRow={{ amount: 'Total: 30', name: 'Sum:' }}
      />,
    );
    expect(screen.getByText('Total: 30')).toBeInTheDocument();
    expect(screen.getByText('Sum:')).toBeInTheDocument();
  });
});
