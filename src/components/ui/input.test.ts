import { describe, expect, it } from 'vitest';
import source from './input.tsx?raw';

describe('input', () => {
  it('exports Input', () => {
    expect(source).toMatch(/export\s+\{[^}]*\bInput\b/);
  });
  it('uses cn from @/lib/utils', () => {
    expect(source).toMatch(/from ['"]@\/lib\/utils['"]/);
  });
  it('does not import from radix-ui', () => {
    expect(source).not.toMatch(/from .{1,2}@radix/);
  });
});
