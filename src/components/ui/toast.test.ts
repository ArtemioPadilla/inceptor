import { describe, expect, it } from 'vitest';
import source from './toast.tsx?raw';

describe('toast', () => {
  it('exports Toaster', () => {
    expect(source).toMatch(/export function Toaster/);
  });
  it('exports toast (imperative function)', () => {
    expect(source).toMatch(/export function toast/);
  });
  it('exports toastManager', () => {
    expect(source).toMatch(/export const toastManager/);
  });
  it('imports from @base-ui-components/react/toast', () => {
    expect(source).toMatch(/from ['"]@base-ui-components\/react\/toast['"]/);
  });
  it('does not import from radix-ui', () => {
    expect(source).not.toMatch(/from .{1,2}@radix/);
  });
});
