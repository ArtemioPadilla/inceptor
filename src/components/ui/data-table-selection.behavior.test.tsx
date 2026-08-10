// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { DataTable } from './data-table';

// ResizeObserver polyfill — see data-table.behavior.test.tsx for rationale.
class MockResizeObserver {
  observe = vi.fn();
  disconnect = vi.fn();
  unobserve = vi.fn();
}

// TanStack Virtual measures the scroll container via `offsetHeight`; jsdom's
// layout-free implementation always reports 0, which yields zero virtual
// items (no rows render) unless we stub a real size — same rationale as
// splitter.behavior.test.tsx's getBoundingClientRect stub, just a different
// measurement API for this library.
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
  age: number;
}

const columns: ColumnDef<Row, unknown>[] = [
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'age', header: 'Age' },
];

const data: Row[] = [
  { id: '1', name: 'Alice', age: 30 },
  { id: '2', name: 'Bob', age: 25 },
  { id: '3', name: 'Carol', age: 35 },
];

describe('DataTable row selection + ActionBar (Epic 23)', () => {
  it('does not render selection checkboxes when enableSelection is unset (backward compat)', () => {
    render(<DataTable columns={columns} data={data} />);
    expect(screen.queryAllByRole('checkbox').length).toBe(0);
  });

  it('renders a select-all header checkbox and one per-row checkbox when enableSelection is true', () => {
    render(<DataTable columns={columns} data={data} enableSelection />);
    // 1 header "select all" + 3 row checkboxes
    expect(screen.getAllByRole('checkbox').length).toBe(4);
  });

  it('shows the ActionBar with the selected count once a row is checked', async () => {
    const user = userEvent.setup();
    render(<DataTable columns={columns} data={data} enableSelection />);
    expect(screen.queryByRole('status', { name: 'Bulk actions' })).not.toBeInTheDocument();

    const checkboxes = screen.getAllByRole('checkbox');
    // checkboxes[0] is the select-all header checkbox; row checkboxes follow.
    await user.click(checkboxes[1]!);

    expect(screen.getByRole('status', { name: 'Bulk actions' })).toHaveTextContent(
      '1 item selected',
    );
  });

  it('renders renderBulkActions with the selected row data', async () => {
    const user = userEvent.setup();
    const renderBulkActions = vi.fn((rows: Row[]) => (
      <button type="button">Delete {rows.length}</button>
    ));
    render(
      <DataTable
        columns={columns}
        data={data}
        enableSelection
        renderBulkActions={renderBulkActions}
      />,
    );
    const checkboxes = screen.getAllByRole('checkbox');
    await user.click(checkboxes[1]!);
    await user.click(checkboxes[2]!);

    expect(screen.getByRole('button', { name: 'Delete 2' })).toBeInTheDocument();
    expect(renderBulkActions).toHaveBeenCalledWith(
      expect.arrayContaining([data[0], data[1]]),
    );
  });

  it('clicking the ActionBar dismiss button clears the selection', async () => {
    const user = userEvent.setup();
    render(<DataTable columns={columns} data={data} enableSelection />);
    const checkboxes = screen.getAllByRole('checkbox');
    await user.click(checkboxes[1]!);
    expect(screen.getByRole('status', { name: 'Bulk actions' })).toBeInTheDocument();

    await user.click(screen.getByLabelText('Clear selection'));
    expect(screen.queryByRole('status', { name: 'Bulk actions' })).not.toBeInTheDocument();
    // Checkbox should be unchecked again too.
    expect(screen.getAllByRole('checkbox')[1]).not.toBeChecked();
  });
});
