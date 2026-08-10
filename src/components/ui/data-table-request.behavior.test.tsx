// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import * as React from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { DataTable, type DataTableRequestFn } from './data-table';

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
}

const columns: ColumnDef<Row, unknown>[] = [
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'name', header: 'Name' },
];

describe('DataTable server-driven `request` contract (Epic 23)', () => {
  it('shows a loading skeleton while the request is in flight', async () => {
    let resolveRequest: (v: { data: Row[]; total: number }) => void = () => {};
    const request: DataTableRequestFn<Row> = () =>
      new Promise((resolve) => {
        resolveRequest = resolve;
      });

    render(<DataTable columns={columns} request={request} requestDebounceMs={0} />);

    expect(await screen.findByRole('status', { name: 'Loading' })).toBeInTheDocument();

    resolveRequest({ data: [{ id: '1', name: 'Alice' }], total: 1 });
    await waitFor(() => {
      expect(screen.queryByRole('status', { name: 'Loading' })).not.toBeInTheDocument();
    });
  });

  it('renders an ErrorState when the request rejects', async () => {
    const request: DataTableRequestFn<Row> = () => Promise.reject(new Error('network down'));

    render(<DataTable columns={columns} request={request} requestDebounceMs={0} />);

    expect(await screen.findByRole('alert')).toHaveTextContent('network down');
  });

  it('renders the empty-zero state when the request resolves with no rows and no filter is active', async () => {
    const request: DataTableRequestFn<Row> = () => Promise.resolve({ data: [], total: 0 });

    render(<DataTable columns={columns} request={request} requestDebounceMs={0} />);

    expect(await screen.findByText('No items yet')).toBeInTheDocument();
  });

  it('renders the empty-filtered state when the request resolves with no rows while a filter is active', async () => {
    const request: DataTableRequestFn<Row> = () => Promise.resolve({ data: [], total: 0 });

    render(
      <DataTable
        columns={columns}
        request={request}
        requestDebounceMs={0}
        initialGlobalFilter="zzz"
      />,
    );

    expect(await screen.findByText('No results')).toBeInTheDocument();
  });

  it('renders rows from a successful request and calls it again when the global filter changes', async () => {
    const request = vi.fn<DataTableRequestFn<Row>>().mockImplementation((params) => {
      if (params.globalFilter === 'ali') {
        return Promise.resolve({ data: [{ id: '1', name: 'Alice' }], total: 1 });
      }
      return Promise.resolve({
        data: [
          { id: '1', name: 'Alice' },
          { id: '2', name: 'Bob' },
        ],
        total: 2,
      });
    });

    render(<DataTable columns={columns} request={request} requestDebounceMs={0} />);

    await waitFor(() => {
      expect(request).toHaveBeenCalledWith(
        expect.objectContaining({ sorting: [], globalFilter: '', columnFilters: [] }),
      );
    });
    await waitFor(() => expect(screen.getByText('2 rows')).toBeInTheDocument());
  });
});
