import { describe, expect, it } from 'vitest';
import source from './table.tsx?raw';

describe('table', () => {
  it('exports Table', () => {
    expect(source).toMatch(/export\s+\{[^}]*\bTable\b/);
  });
  it('exports TableBody', () => {
    expect(source).toMatch(/export\s+\{[^}]*\bTableBody\b/);
  });
  it('uses cn from @/lib/utils', () => {
    expect(source).toMatch(/from ['"]@\/lib\/utils['"]/);
  });
  it('does not import from radix-ui', () => {
    expect(source).not.toMatch(/from .{1,2}@radix/);
  });
});
