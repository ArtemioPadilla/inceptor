import { describe, expect, it } from 'vitest';
import source from './form.tsx?raw';

describe('form', () => {
  it('exports Form', () => {
    expect(source).toMatch(/export\s+\{[^}]*\bForm\b/);
  });
  it('exports FormField', () => {
    expect(source).toMatch(/export\s+\{[^}]*\bFormField\b/);
  });
  it('exports FormItem', () => {
    expect(source).toMatch(/export\s+\{[^}]*\bFormItem\b/);
  });
  it('exports FormLabel', () => {
    expect(source).toMatch(/export\s+\{[^}]*\bFormLabel\b/);
  });
  it('exports FormControl', () => {
    expect(source).toMatch(/export\s+\{[^}]*\bFormControl\b/);
  });
  it('exports FormMessage', () => {
    expect(source).toMatch(/export\s+\{[^}]*\bFormMessage\b/);
  });
  it('imports from @base-ui-components/react/field', () => {
    expect(source).toMatch(/from ['"]@base-ui-components\/react\/field['"]/);
  });
  it('uses react-hook-form', () => {
    expect(source).toMatch(/from ['"]react-hook-form['"]/);
  });
  it('does not import from radix-ui', () => {
    expect(source).not.toMatch(/from .{1,2}@radix/);
  });
});
