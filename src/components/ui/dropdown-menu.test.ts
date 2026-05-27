import { describe, expect, it } from 'vitest';
import source from './dropdown-menu.tsx?raw';

describe('dropdown-menu', () => {
  it('exports DropdownMenu', () => {
    expect(source).toMatch(/export\s+\{[^}]*\bDropdownMenu\b/);
  });
  it('exports DropdownMenuContent', () => {
    expect(source).toMatch(/export\s+\{[^}]*\bDropdownMenuContent\b/);
  });
  it('exports DropdownMenuItem', () => {
    expect(source).toMatch(/export\s+\{[^}]*\bDropdownMenuItem\b/);
  });
  it('imports from @base-ui-components/react/menu', () => {
    expect(source).toMatch(/from ['"]@base-ui-components\/react\/menu['"]/);
  });
  it('does not import from radix-ui', () => {
    expect(source).not.toMatch(/from .{1,2}@radix/);
  });
});
