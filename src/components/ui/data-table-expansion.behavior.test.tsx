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
}

const columns: ColumnDef<Row, unknown>[] = [
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'name', header: 'Name' },
];

const data: Row[] = [
  { id: '1', name: 'Alice' },
  { id: '2', name: 'Bob' },
];

describe('DataTable expandable rows (Epic 23)', () => {
  it('renders no expand column when renderSubRow is unset (backward compat)', () => {
    render(<DataTable columns={columns} data={data} />);
    expect(screen.queryAllByLabelText('Expand row').length).toBe(0);
  });

  it('renders an expand chevron per row when renderSubRow is supplied', () => {
    render(
      <DataTable columns={columns} data={data} renderSubRow={(row) => <div>{row.name} detail</div>} />,
    );
    expect(screen.getAllByLabelText('Expand row').length).toBe(data.length);
  });

  it('reveals renderSubRow content on click, and hides it again on a second click', async () => {
    const user = userEvent.setup();
    render(
      <DataTable columns={columns} data={data} renderSubRow={(row) => <div>{row.name} detail</div>} />,
    );
    expect(screen.queryByText('Alice detail')).not.toBeInTheDocument();

    const [firstToggle] = screen.getAllByLabelText('Expand row');
    await user.click(firstToggle!);

    expect(screen.getByText('Alice detail')).toBeInTheDocument();
    expect(screen.getByLabelText('Collapse row')).toBeInTheDocument();

    await user.click(screen.getByLabelText('Collapse row'));
    expect(screen.queryByText('Alice detail')).not.toBeInTheDocument();
  });
});
