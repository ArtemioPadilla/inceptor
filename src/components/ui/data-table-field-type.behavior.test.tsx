// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import * as React from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { DataTable } from './data-table';
import type { FieldType } from '@/lib/field-type';

// Same virtualizer-measurement stubs as the other data-table-*.behavior.test.tsx
// files (jsdom reports 0 offsetHeight/offsetWidth without them).
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
  amount: number;
}

const moneyFieldType: FieldType = { type: 'money', label: 'Amount', currency: 'USD' };
const data: Row[] = [{ id: '1', amount: 1234.5 }];

describe('DataTable fieldType-driven cell rendering (ROADMAP Epic 24)', () => {
  it('renders the shared display renderer output when a column sets meta.fieldType and no explicit cell', () => {
    const columns: ColumnDef<Row, unknown>[] = [
      { accessorKey: 'id', header: 'ID' },
      { accessorKey: 'amount', header: 'Amount', meta: { fieldType: moneyFieldType } },
    ];
    render(<DataTable columns={columns} data={data} />);
    expect(screen.getByText('$1,234.50')).toBeInTheDocument();
  });

  it('still honors an explicit `cell` renderer over meta.fieldType (additive, non-breaking)', () => {
    const columns: ColumnDef<Row, unknown>[] = [
      { accessorKey: 'id', header: 'ID' },
      {
        accessorKey: 'amount',
        header: 'Amount',
        meta: { fieldType: moneyFieldType },
        cell: () => <span>CUSTOM</span>,
      },
    ];
    render(<DataTable columns={columns} data={data} />);
    expect(screen.getByText('CUSTOM')).toBeInTheDocument();
    expect(screen.queryByText('$1,234.50')).not.toBeInTheDocument();
  });
});
