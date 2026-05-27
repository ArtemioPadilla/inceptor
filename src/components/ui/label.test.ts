import { describe, expect, it } from 'vitest';
import source from './label.tsx?raw';

describe('label', () => {
  it('exports Label', () => {
    expect(source).toMatch(/export\s+\{[^}]*\bLabel\b/);
  });
  it('uses cn from @/lib/utils', () => {
    expect(source).toMatch(/from ['"]@\/lib\/utils['"]/);
  });
  it('does not import from radix-ui', () => {
    expect(source).not.toMatch(/from .{1,2}@radix/);
  });
});
