import { describe, expect, it } from 'vitest';
import source from './button.tsx?raw';

describe('button', () => {
  it('exports Button', () => {
    expect(source).toMatch(/export\s+\{[^}]*\bButton\b/);
  });
  it('exports buttonVariants', () => {
    expect(source).toMatch(/export\s+\{[^}]*\bbuttonVariants\b/);
  });
  it('uses cn from @/lib/utils', () => {
    expect(source).toMatch(/from ['"]@\/lib\/utils['"]/);
  });
  it('does not import from radix-ui', () => {
    expect(source).not.toMatch(/from .{1,2}@radix/);
  });
});
