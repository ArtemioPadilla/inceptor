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

  it('uses zod for schema validation', () => {
    expect(source).toMatch(/from ['"]zod['"]/);
  });

  it('uses zodResolver from @hookform/resolvers/zod', () => {
    expect(source).toMatch(/from ['"]@hookform\/resolvers\/zod['"]/);
  });

  it('does not import from radix-ui', () => {
    expect(source).not.toMatch(/from .{0,2}@radix/);
  });
});
