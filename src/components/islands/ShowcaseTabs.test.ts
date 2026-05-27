import { describe, expect, it } from 'vitest';
import source from './ShowcaseTabs.tsx?raw';

describe('ShowcaseTabs island', () => {
  it('imports from @/components/ui/tabs', () => {
    expect(source).toMatch(/from ['"]@\/components\/ui\/tabs['"]/);
  });

  it('imports Card from @/components/ui/card', () => {
    expect(source).toMatch(/from ['"]@\/components\/ui\/card['"]/);
  });

  it('does not import from radix-ui', () => {
    expect(source).not.toMatch(/from .{0,2}@radix/);
  });
});
