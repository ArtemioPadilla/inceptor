// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
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

// 10 rows — large enough that the default height (500px) / estimateRowSize
// (40px) viewport plus `overscan: 10` would render every row regardless of
// whether the virtualizer's `count` is wired correctly, UNLESS the count is
// decoupled from `flatItems.length` (rows + inserted detail rows). In that
// broken state, expanding a row shifts every subsequent row's flat-index by
// one, and the virtualizer — capped at `rows.length` items — never renders
// the true last flat item, silently dropping the last row from the DOM.
const manyRows: Row[] = Array.from({ length: 10 }, (_, i) => ({
  id: String(i),
  name: `Row ${i}`,
}));

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

  it('keeps every row visible and in order after expanding an early row (virtualizer count must track flatItems, not rows)', async () => {
    const user = userEvent.setup();
    render(
      <DataTable
        columns={columns}
        data={manyRows}
        renderSubRow={(row) => <div>{row.name} detail</div>}
      />,
    );

    const toggles = screen.getAllByLabelText('Expand row');
    expect(toggles.length).toBe(manyRows.length);

    // Expand an EARLY row (index 1 of 10) — not the first, not the last —
    // so a regression that decouples the virtualizer's `count` from
    // `flatItems.length` shifts every following row's flat-index by one and
    // silently drops the true last row from the rendered virtual window.
    await user.click(toggles[1]!);
    expect(screen.getByText('Row 1 detail')).toBeInTheDocument();

    const renderedOrder = screen.getAllByText(/^Row \d+$/).map((el) => el.textContent);
    expect(renderedOrder).toEqual(manyRows.map((row) => row.name));
  });

  it('supports expand + collapse in sequence across multiple rows without losing any row from the list', async () => {
    const user = userEvent.setup();
    render(
      <DataTable
        columns={columns}
        data={manyRows}
        renderSubRow={(row) => <div>{row.name} detail</div>}
      />,
    );

    // Resolve a row's toggle button by row name instead of a raw index into
    // getAllByLabelText — that list shrinks/reorders as rows toggle between
    // "Expand row" and "Collapse row", so index alone doesn't identify a
    // specific row across successive clicks.
    const toggleFor = (name: string) => {
      const cell = screen.getByText(name, { exact: true });
      const row = cell.closest('tr');
      if (!row) throw new Error(`could not find <tr> for "${name}"`);
      return within(row).getByLabelText(/^(Expand|Collapse) row$/);
    };

    await user.click(toggleFor('Row 1'));
    expect(screen.getByText('Row 1 detail')).toBeInTheDocument();

    await user.click(toggleFor('Row 4'));
    expect(screen.getByText('Row 4 detail')).toBeInTheDocument();

    // Collapse the first one while the second is still expanded.
    await user.click(toggleFor('Row 1'));
    expect(screen.queryByText('Row 1 detail')).not.toBeInTheDocument();
    expect(screen.getByText('Row 4 detail')).toBeInTheDocument();

    // Collapse the remaining one — back to a fully-collapsed table.
    await user.click(toggleFor('Row 4'));
    expect(screen.queryByText('Row 4 detail')).not.toBeInTheDocument();

    const renderedOrder = screen.getAllByText(/^Row \d+$/).map((el) => el.textContent);
    expect(renderedOrder).toEqual(manyRows.map((row) => row.name));
  });
});
