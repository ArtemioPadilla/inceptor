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
  vi.stubGlobal('URL', {
    ...URL,
    createObjectURL: vi.fn(() => 'blob:mock-url'),
    revokeObjectURL: vi.fn(),
  });
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

interface Row {
  id: string;
}

const columns: ColumnDef<Row, unknown>[] = [{ accessorKey: 'id', header: 'ID' }];
const data: Row[] = [{ id: '1' }];

describe('DataTable onExport wiring (Epic 23)', () => {
  it('renders no export button when onExport is unset (backward compat)', () => {
    render(<DataTable columns={columns} data={data} />);
    expect(screen.queryByRole('button', { name: 'Export' })).not.toBeInTheDocument();
  });

  it('renders a DownloadTrigger that calls onExport when supplied', async () => {
    const onExport = vi.fn(() => Promise.resolve(new Blob(['id\n1'])));
    const user = userEvent.setup();
    render(<DataTable columns={columns} data={data} onExport={onExport} />);

    await user.click(screen.getByRole('button', { name: 'Export' }));
    expect(onExport).toHaveBeenCalledTimes(1);
  });
});
