import { describe, expect, it } from 'vitest';
import source from './badge.tsx?raw';

describe('badge', () => {
  it('exports Badge', () => {
    expect(source).toMatch(/export\s+\{[^}]*\bBadge\b/);
  });
  it('exports badgeVariants', () => {
    expect(source).toMatch(/export\s+\{[^}]*\bbadgeVariants\b/);
  });
  it('uses cn from @/lib/utils', () => {
    expect(source).toMatch(/from ['"]@\/lib\/utils['"]/);
  });
  it('does not import from radix-ui', () => {
    expect(source).not.toMatch(/from .{1,2}@radix/);
  });
});
