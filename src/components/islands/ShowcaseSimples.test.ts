import { describe, expect, it } from 'vitest';
import source from './ShowcaseSimples.tsx?raw';

describe('ShowcaseSimples island', () => {
  it('imports Button from @/components/ui/button', () => {
    expect(source).toMatch(/from ['"]@\/components\/ui\/button['"]/);
  });

  it('imports Badge from @/components/ui/badge', () => {
    expect(source).toMatch(/from ['"]@\/components\/ui\/badge['"]/);
  });

  it('imports Card from @/components/ui/card', () => {
    expect(source).toMatch(/from ['"]@\/components\/ui\/card['"]/);
  });

  it('imports Input from @/components/ui/input', () => {
    expect(source).toMatch(/from ['"]@\/components\/ui\/input['"]/);
  });

  it('imports Label from @/components/ui/label', () => {
    expect(source).toMatch(/from ['"]@\/components\/ui\/label['"]/);
  });

  it('imports Table from @/components/ui/table', () => {
    expect(source).toMatch(/from ['"]@\/components\/ui\/table['"]/);
  });

  it('does not import from radix-ui', () => {
    expect(source).not.toMatch(/from .{0,2}@radix/);
  });
});
