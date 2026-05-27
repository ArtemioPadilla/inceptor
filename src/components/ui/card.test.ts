import { describe, expect, it } from 'vitest';
import source from './card.tsx?raw';

describe('card', () => {
  it('exports Card', () => {
    expect(source).toMatch(/export\s+\{[^}]*\bCard\b/);
  });
  it('exports CardContent', () => {
    expect(source).toMatch(/export\s+\{[^}]*\bCardContent\b/);
  });
  it('uses cn from @/lib/utils', () => {
    expect(source).toMatch(/from ['"]@\/lib\/utils['"]/);
  });
  it('does not import from radix-ui', () => {
    expect(source).not.toMatch(/from .{1,2}@radix/);
  });
});
