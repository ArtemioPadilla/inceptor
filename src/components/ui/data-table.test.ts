import { describe, expect, it } from 'vitest';
import source from './data-table.tsx?raw';

describe('DataTable', () => {
  it('exports DataTable', () => {
    expect(source).toMatch(/export\s+function\s+DataTable/);
  });

  it('uses TanStack Table + Virtual', () => {
    expect(source).toMatch(/from\s+['"]@tanstack\/react-table['"]/);
    expect(source).toMatch(/from\s+['"]@tanstack\/react-virtual['"]/);
  });

  it('is generic over TData and TValue', () => {
    expect(source).toMatch(/DataTable<\s*TData[^>]*TValue/);
  });

  it('composes shadcn Table primitives', () => {
    expect(source).toMatch(/from\s+['"]@\/components\/ui\/table['"]/);
  });

  it('supports sort, filter, visibility, resizing, virtualization', () => {
    expect(source).toMatch(/getSortedRowModel|enableSorting/);
    expect(source).toMatch(/globalFilter|getFilteredRowModel/);
    expect(source).toMatch(/columnVisibility|toggleVisibility/);
    expect(source).toMatch(/enableColumnResizing|getSize/);
    expect(source).toMatch(/useVirtualizer/);
  });

  it('does not import from framer-motion', () => {
    expect(source).not.toMatch(/from\s+['"]framer-motion['"]/);
  });

  it('does not import from @radix-ui', () => {
    expect(source).not.toMatch(/from\s+['"]@radix-ui/);
  });
});
