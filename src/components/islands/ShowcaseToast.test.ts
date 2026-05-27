import { describe, expect, it } from 'vitest';
import source from './ShowcaseToast.tsx?raw';

describe('ShowcaseToast island', () => {
  it('imports Toaster and toast from @/components/ui/toast', () => {
    expect(source).toMatch(/from ['"]@\/components\/ui\/toast['"]/);
  });

  it('imports Button from @/components/ui/button', () => {
    expect(source).toMatch(/from ['"]@\/components\/ui\/button['"]/);
  });

  it('does not import from radix-ui', () => {
    expect(source).not.toMatch(/from .{0,2}@radix/);
  });
});
