import { describe, expect, it } from 'vitest';
import source from './ShowcaseFieldType.tsx?raw';

// Smoke test (tdd-tier:smoke — this island composes already-behavior-tested
// primitives; see src/lib/field-type.test.ts + the field-type/*.behavior
// tests + data-table-field-type/description-list/property-filter behavior
// tests for the actual fieldType contract coverage). Mirrors the existing
// ShowcaseForm.test.ts convention: assert the demo actually wires each of
// the four surfaces the ROADMAP Epic 24 pitch promises, from one shared
// `fieldDefs` object, instead of re-defining formatting/widgets per surface.

describe('ShowcaseFieldType island (ROADMAP Epic 24)', () => {
  it('defines one shared fieldDefs object', () => {
    expect(source).toMatch(/fieldDefs/);
  });

  it('drives a DataTable column via meta: { fieldType }', () => {
    expect(source).toMatch(/from ['"]@\/components\/ui\/data-table['"]/);
    expect(source).toMatch(/meta:\s*\{\s*fieldType:/);
  });

  it('drives a Form field via FieldFormItem', () => {
    expect(source).toMatch(/from ['"]@\/components\/ui\/field-type\/form-item['"]/);
    expect(source).toMatch(/<FieldFormItem/);
  });

  it('drives a description-list row via DescriptionItem fieldType+value', () => {
    expect(source).toMatch(/from ['"]@\/components\/ui\/description-list['"]/);
    expect(source).toMatch(/<DescriptionItem[^>]*fieldType=/);
  });

  it('drives a PropertyFilter property via FilterProperty.fieldType', () => {
    expect(source).toMatch(/from ['"]@\/components\/ui\/property-filter['"]/);
    expect(source).toMatch(/fieldType:\s*fieldDefs\./);
  });

  it('does not import from radix-ui', () => {
    expect(source).not.toMatch(/from .{0,2}@radix/);
  });
});
