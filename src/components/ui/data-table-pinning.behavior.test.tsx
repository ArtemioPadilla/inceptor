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

describe('DataTable column pinning (Epic 23)', () => {
  it('renders no pin controls when enableColumnPinning is unset (backward compat)', () => {
    render(<DataTable columns={columns} data={data} />);
    expect(screen.queryAllByLabelText(/pin column/i).length).toBe(0);
  });

  it('renders a pin toggle button per header cell when enableColumnPinning is true', () => {
    render(<DataTable columns={columns} data={data} enableColumnPinning />);
    // One pin button per data column (3).
    expect(screen.getAllByLabelText(/pin .* column/i).length).toBe(columns.length);
  });

  it('pins a column left on click and marks the header cell data-pinned="left"', async () => {
    const user = userEvent.setup();
    render(<DataTable columns={columns} data={data} enableColumnPinning />);
    const nameHeader = screen.getByRole('columnheader', { name: /Name/i });
    expect(nameHeader).not.toHaveAttribute('data-pinned');

    const pinButton = screen.getByLabelText('Pin Name column left');
    await user.click(pinButton);

    expect(nameHeader).toHaveAttribute('data-pinned', 'left');
  });

  it('unpins a pinned column on a second click', async () => {
    const user = userEvent.setup();
    render(<DataTable columns={columns} data={data} enableColumnPinning />);
    const nameHeader = screen.getByRole('columnheader', { name: /Name/i });

    await user.click(screen.getByLabelText('Pin Name column left'));
    expect(nameHeader).toHaveAttribute('data-pinned', 'left');

    await user.click(screen.getByLabelText('Unpin Name column'));
    expect(nameHeader).not.toHaveAttribute('data-pinned');
  });
});
