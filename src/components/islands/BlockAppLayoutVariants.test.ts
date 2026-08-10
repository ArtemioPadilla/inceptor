import { describe, expect, it } from 'vitest';
import source from './BlockAppLayoutVariants.tsx?raw';

describe('BlockAppLayoutVariants', () => {
  it('exports BlockAppLayoutIconCollapse and BlockAppLayoutDual', () => {
    expect(source).toMatch(/export function BlockAppLayoutIconCollapse/);
    expect(source).toMatch(/export function BlockAppLayoutDual/);
  });

  it('wires the icon-collapse and dual sidebarVariant props', () => {
    expect(source).toMatch(/sidebarVariant="icon-collapse"/);
    expect(source).toMatch(/sidebarVariant="dual"/);
    expect(source).toMatch(/secondaryNavItems/);
  });

  it('does not import from @radix-ui or framer-motion', () => {
    expect(source).not.toMatch(/from ['"]@radix-ui/);
    expect(source).not.toMatch(/from ['"]framer-motion['"]/);
  });
});
