import { describe, expect, it } from 'vitest';
import source from './dialog.tsx?raw';

describe('dialog', () => {
  it('exports Dialog', () => {
    expect(source).toMatch(/export\s+\{[^}]*\bDialog\b/);
  });
  it('exports DialogContent', () => {
    expect(source).toMatch(/export\s+\{[^}]*\bDialogContent\b/);
  });
  it('exports DialogTitle', () => {
    expect(source).toMatch(/export\s+\{[^}]*\bDialogTitle\b/);
  });
  it('imports from @base-ui-components/react/dialog', () => {
    expect(source).toMatch(/from ['"]@base-ui-components\/react\/dialog['"]/);
  });
  it('does not import from radix-ui', () => {
    expect(source).not.toMatch(/from .{1,2}@radix/);
  });
});
