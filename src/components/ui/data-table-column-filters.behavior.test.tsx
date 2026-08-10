// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
  status: 'active' | 'inactive';
}

const columns: ColumnDef<Row, unknown>[] = [
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'name', header: 'Name' },
  {
    accessorKey: 'status',
    header: 'Status',
    meta: {
      filterOptions: [
        { label: 'Active', value: 'active' },
        { label: 'Inactive', value: 'inactive' },
      ],
    },
  },
];

const data: Row[] = [
  { id: '1', name: 'Alice', status: 'active' },
  { id: '2', name: 'Bob', status: 'inactive' },
  { id: '3', name: 'Carol', status: 'active' },
];

describe('DataTable per-column filters (Epic 23)', () => {
  it('renders no per-column filter row when enableColumnFilters is unset (backward compat)', () => {
    render(<DataTable columns={columns} data={data} />);
    expect(screen.queryByLabelText('Filter Name')).not.toBeInTheDocument();
  });

  it('renders a text filter input per filterable column when enabled', () => {
    render(<DataTable columns={columns} data={data} enableColumnFilters />);
    expect(screen.getByLabelText('Filter ID')).toBeInTheDocument();
    expect(screen.getByLabelText('Filter Name')).toBeInTheDocument();
  });

  it('renders a <select> for columns with meta.filterOptions', () => {
    render(<DataTable columns={columns} data={data} enableColumnFilters />);
    const statusFilter = screen.getByLabelText('Filter Status');
    expect(statusFilter.tagName).toBe('SELECT');
  });

  it('typing in the Name column filter narrows the row count', async () => {
    const user = userEvent.setup();
    render(<DataTable columns={columns} data={data} enableColumnFilters />);
    expect(screen.getByText('3 rows')).toBeInTheDocument();

    await user.type(screen.getByLabelText('Filter Name'), 'ali');

    expect(screen.getByText('1 row')).toBeInTheDocument();
  });

  it('selecting a Status filter option narrows the row count', async () => {
    const user = userEvent.setup();
    render(<DataTable columns={columns} data={data} enableColumnFilters />);
    expect(screen.getByText('3 rows')).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('Filter Status'), 'inactive');

    expect(screen.getByText('1 row')).toBeInTheDocument();
  });
});
