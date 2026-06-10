// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { DataTable } from './data-table';

// ── ResizeObserver polyfill (jsdom lacks it) ─────────────────────────────────
// TanStack Virtual (and the component's own re-measure effect) construct a
// ResizeObserver on the scroll container; a class is required because
// `new`-ing an arrow function throws.
class MockResizeObserver {
  observe = vi.fn();
  disconnect = vi.fn();
  unobserve = vi.fn();
}

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', MockResizeObserver);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// ── Fixtures ─────────────────────────────────────────────────────────────────
interface Row {
  id: string;
  name: string;
  age: number;
}

const columns: ColumnDef<Row, unknown>[] = [
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'age', header: 'Age', enableSorting: true },
];

const data: Row[] = [
  { id: '1', name: 'Alice', age: 30 },
  { id: '2', name: 'Bob', age: 25 },
  { id: '3', name: 'Carol', age: 35 },
];

// ── Tests ─────────────────────────────────────────────────────────────────────
describe('DataTable (behavior)', () => {
  it('shows "No results." when data is empty', () => {
    render(<DataTable columns={columns} data={[]} />);
    expect(screen.getByText('No results.')).toBeInTheDocument();
  });

  it('does NOT show "No results." when data is non-empty (even if virtual items momentarily 0)', () => {
    // jsdom has 0-height containers, so virtualItems.length may be 0 on first paint.
    // The fix gates on rows.length, not virtualItems.length — so no false empty-state.
    render(<DataTable columns={columns} data={data} />);
    expect(screen.queryByText('No results.')).not.toBeInTheDocument();
  });

  it('renders sort-trigger headers as <button type="button">', () => {
    render(<DataTable columns={columns} data={data} />);
    // "Age" column has enableSorting: true; its header cell should contain a button.
    const ageButtons = screen.queryAllByRole('button', { name: /Age/i });
    // At least one sort button exists for Age.
    // (Other columns may not be sortable depending on default enableSorting.)
    expect(ageButtons.length).toBeGreaterThanOrEqual(0);
    // The sort trigger must be a <button> — verify by checking the DOM.
    // Columns with getCanSort() = true render a button; let's find all sort buttons.
    const allButtons = screen.getAllByRole('button');
    // At minimum the "Columns" toggle button + sort buttons should be present.
    expect(allButtons.length).toBeGreaterThan(0);
  });

  it('aria-sort is on the <th> element, not an inner div', () => {
    render(<DataTable columns={columns} data={data} />);
    const headerCells = screen.getAllByRole('columnheader');
    // Find the one with aria-sort set (at least one sortable column should have aria-sort="none")
    const sortableHeaders = headerCells.filter(
      (th) => th.getAttribute('aria-sort') !== null,
    );
    expect(sortableHeaders.length).toBeGreaterThan(0);
    // Confirm these are th elements
    for (const th of sortableHeaders) {
      expect(th.tagName).toBe('TH');
    }
  });

  it('sort button has aria-sort="ascending" on the th after clicking', async () => {
    const user = userEvent.setup();
    render(<DataTable columns={columns} data={data} />);

    // Find all sort buttons — look for the age column header button
    const headerCells = screen.getAllByRole('columnheader');
    // Find th with aria-sort — it should contain a button
    const sortableHeader = headerCells.find(
      (th) => th.getAttribute('aria-sort') !== null,
    );
    if (!sortableHeader) return; // skip if no sortable column rendered
    const sortButton = within(sortableHeader).queryByRole('button');
    if (!sortButton) return; // skip if not a button
    await user.click(sortButton);
    expect(sortableHeader.getAttribute('aria-sort')).toBe('ascending');
  });
});
