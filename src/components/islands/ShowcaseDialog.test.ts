import { describe, expect, it } from 'vitest';
import source from './ShowcaseDialog.tsx?raw';

describe('ShowcaseDialog island', () => {
  it('imports from @/components/ui/dialog', () => {
    expect(source).toMatch(/from ['"]@\/components\/ui\/dialog['"]/);
  });

  it('imports Button from @/components/ui/button', () => {
    expect(source).toMatch(/from ['"]@\/components\/ui\/button['"]/);
  });

  it('does not import from radix-ui', () => {
    expect(source).not.toMatch(/from .{0,2}@radix/);
  });

  it('does not import from framer-motion', () => {
    expect(source).not.toMatch(/from ['"]framer-motion['"]/);
  });
});
