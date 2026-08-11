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
];

describe('DataTable per-column filter row respects column pinning', () => {
  it('applies the same sticky position/offset/z-index to the filter cell as the sibling pinned header cell', async () => {
    const user = userEvent.setup();
    render(
      <DataTable columns={columns} data={data} enableColumnPinning enableColumnFilters />,
    );

    await user.click(screen.getByLabelText('Pin Name column left'));

    const headerCell = screen.getByRole('columnheader', { name: /Name/i });
    const filterCell = screen.getByLabelText('Filter Name').closest('th');
    expect(filterCell).not.toBeNull();

    // The filter row's <TableHead> must detach-proof itself the same way the
    // sort-header row's <TableHead> already does for the same pinned column.
    expect(headerCell.style.position).toBe('sticky');
    expect(filterCell?.style.position).toBe(headerCell.style.position);
    expect(filterCell?.style.left).toBe(headerCell.style.left);
    expect(filterCell?.style.zIndex).toBe(headerCell.style.zIndex);
  });
});
