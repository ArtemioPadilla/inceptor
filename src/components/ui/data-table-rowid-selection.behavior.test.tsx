// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

describe('DataTable row selection is keyed by row identity, not array index', () => {
  it('does not silently carry a checked row over to a different row after a server-driven refetch replaces the data', async () => {
    const user = userEvent.setup();
    // First call (default/empty filter) returns Alice+Bob. Once the user
    // types "zach" into the global filter, the server-driven request
    // resolves with a totally different single row at index 0 — the exact
    // scenario a debounced filter/sort change produces in production.
    const request = vi.fn<DataTableRequestFn<Row>>().mockImplementation((params) => {
      if (params.globalFilter === 'zach') {
        return Promise.resolve({ data: [{ id: '99', name: 'Zach' }], total: 1 });
      }
      return Promise.resolve({
        data: [
          { id: '1', name: 'Alice' },
          { id: '2', name: 'Bob' },
        ],
        total: 2,
      });
    });

    const renderBulkActions = vi.fn((rows: Row[]) => (
      <button type="button">Selected: {rows.map((r) => r.name).join(',')}</button>
    ));

    render(
      <DataTable
        columns={columns}
        request={request}
        requestDebounceMs={0}
        enableSelection
        renderBulkActions={renderBulkActions}
      />,
    );

    await waitFor(() => expect(screen.getByText('2 rows')).toBeInTheDocument());

    // Select the first data row (Alice, at array index 0).
    const checkboxes = screen.getAllByRole('checkbox');
    await user.click(checkboxes[1]!);
    expect(screen.getByRole('button', { name: 'Selected: Alice' })).toBeInTheDocument();

    // Trigger a refetch (debounced filter change) that replaces the entire
    // result set with a row the user never selected.
    await user.type(screen.getByLabelText('Global filter'), 'zach');
    await waitFor(() => expect(screen.getByText('1 row')).toBeInTheDocument());

    // The stale index-0 selection must NOT silently re-attach to Zach's row —
    // renderBulkActions must never be called with Zach as a "selected" row,
    // and since no getRowId was supplied the honest fix is to drop the
    // selection entirely rather than guess.
    expect(screen.queryByText(/Selected: Zach/)).not.toBeInTheDocument();
    expect(screen.queryByRole('status', { name: 'Bulk actions' })).not.toBeInTheDocument();
    for (const call of renderBulkActions.mock.calls) {
      const selected = call[0];
      expect(selected.some((r) => r.name === 'Zach')).toBe(false);
    }
  });
});
