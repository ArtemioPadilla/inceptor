import { describe, expect, it } from 'vitest';
import source from './ShowcaseDropdown.tsx?raw';

describe('ShowcaseDropdown island', () => {
  it('imports from @/components/ui/dropdown-menu', () => {
    expect(source).toMatch(/from ['"]@\/components\/ui\/dropdown-menu['"]/);
  });

  it('imports Button from @/components/ui/button', () => {
    expect(source).toMatch(/from ['"]@\/components\/ui\/button['"]/);
  });

  it('does not import from radix-ui', () => {
    expect(source).not.toMatch(/from .{0,2}@radix/);
  });
});
