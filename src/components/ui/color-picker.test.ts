import { describe, expect, it } from 'vitest';
import source from './color-picker.tsx?raw';

describe('color-picker', () => {
  it('exports ColorPicker', () => {
    expect(source).toMatch(/export\s+\{[^}]*\bColorPicker\b/);
  });

  it('is a Popover-anchored composition on Base UI (via @/components/ui/popover)', () => {
    expect(source).toMatch(/from ['"]@\/components\/ui\/popover['"]/);
  });

  it('uses a native color input alongside a hex text field', () => {
    expect(source).toMatch(/type="color"/);
    expect(source).toMatch(/from ['"]@\/components\/ui\/input['"]/);
  });

  it('validates hex input before committing', () => {
    expect(source).toMatch(/HEX_RE/);
  });

  it('does not import from @radix-ui', () => {
    expect(source).not.toMatch(/from .{1,2}@radix/);
  });
});
