import { describe, expect, it } from 'vitest';
import source from './ShowcaseForm.tsx?raw';

describe('ShowcaseForm island', () => {
  it('imports from @/components/ui/form', () => {
    expect(source).toMatch(/from ['"]@\/components\/ui\/form['"]/);
  });

  it('imports Input from @/components/ui/input', () => {
    expect(source).toMatch(/from ['"]@\/components\/ui\/input['"]/);
  });

  it('imports Button from @/components/ui/button', () => {
    expect(source).toMatch(/from ['"]@\/components\/ui\/button['"]/);
  });

  it('uses zod-backed schema from the Spec-DD layer (src/schemas/)', () => {
    // Zod is now consumed via src/schemas/login.ts (single source of truth
    // per PRINCIPLES.md §3). The island imports LoginSchema + LoginValues.
    expect(source).toMatch(/from ['"]@\/schemas\/login['"]/);
    expect(source).toMatch(/LoginSchema/);
  });

  it('uses zodResolver from @hookform/resolvers/zod', () => {
    expect(source).toMatch(/from ['"]@hookform\/resolvers\/zod['"]/);
  });

  it('does not import from radix-ui', () => {
    expect(source).not.toMatch(/from .{0,2}@radix/);
  });
});
