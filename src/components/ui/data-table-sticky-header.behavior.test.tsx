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
});

afterEach(() => {
  vi.unstubAllGlobals();
});

interface Row {
  id: string;
}

const columns: ColumnDef<Row, unknown>[] = [{ accessorKey: 'id', header: 'ID' }];
const data: Row[] = [{ id: '1' }];

// CSS-only feature (tdd-tier:smoke per docs/PRINCIPLES.md §2.1) — a render
// assertion on the computed inline style is sufficient.
describe('DataTable sticky header offset (Epic 23)', () => {
  it('defaults the sticky header row to top: 0px', () => {
    render(<DataTable columns={columns} data={data} />);
    const headerRow = screen.getAllByRole('row')[0]!;
    expect(headerRow).toHaveClass('sticky');
    expect(headerRow).toHaveStyle({ top: '0px' });
  });

  it('applies a configurable stickyHeaderOffset as the sticky top value', () => {
    render(<DataTable columns={columns} data={data} stickyHeaderOffset={64} />);
    const headerRow = screen.getAllByRole('row')[0]!;
    expect(headerRow).toHaveStyle({ top: '64px' });
  });
});
