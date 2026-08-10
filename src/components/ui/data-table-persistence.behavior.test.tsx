// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { DataTable } from './data-table';

class MockResizeObserver {
  observe = vi.fn();
  disconnect = vi.fn();
  unobserve = vi.fn();
}

// Node 22+'s built-in (flag-gated) `localStorage` global shadows jsdom's own
// Storage implementation in this test environment and lacks working
// getItem/setItem/clear — stub a simple in-memory Storage instead of relying
// on the real global (same rationale as the ResizeObserver stub above).
function createLocalStorageMock() {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => (key in store ? store[key]! : null)),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
}

let localStorageMock = createLocalStorageMock();

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', MockResizeObserver);
  localStorageMock = createLocalStorageMock();
  vi.stubGlobal('localStorage', localStorageMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

interface Row {
  id: string;
  name: string;
}

const columns: ColumnDef<Row, unknown>[] = [
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'name', header: 'Name' },
];

const data: Row[] = [{ id: '1', name: 'Alice' }];

describe('DataTable column-visibility persistence (Epic 23)', () => {
  it('does not touch localStorage when persistColumnVisibility is unset (backward compat)', async () => {
    render(<DataTable columns={columns} data={data} />);
    // Give any stray effect a tick to run, then confirm no write happened.
    await new Promise((r) => setTimeout(r, 0));
    expect(localStorageMock.setItem).not.toHaveBeenCalled();
  });

  it('restores hidden columns from localStorage on mount', async () => {
    localStorageMock.setItem('my-table-cols', JSON.stringify({ name: false }));
    render(<DataTable columns={columns} data={data} persistColumnVisibility="my-table-cols" />);

    await waitFor(() => {
      expect(screen.queryByRole('columnheader', { name: 'Name' })).not.toBeInTheDocument();
    });
    expect(screen.getByRole('columnheader', { name: 'ID' })).toBeInTheDocument();
  });

  it('persists a visibility toggle to localStorage', async () => {
    const user = userEvent.setup();
    render(<DataTable columns={columns} data={data} persistColumnVisibility="my-table-cols" />);

    await user.click(screen.getByRole('button', { name: 'Columns' }));
    const nameCheckbox = await screen.findByRole('menuitemcheckbox', { name: 'Name' });
    await user.click(nameCheckbox);

    await waitFor(() => {
      const stored = JSON.parse(localStorageMock.getItem('my-table-cols') ?? '{}');
      expect(stored.name).toBe(false);
    });
  });
});
