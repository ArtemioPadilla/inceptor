import { describe, expect, it } from 'vitest';
import source from './LargeTable.tsx?raw';

describe('LargeTable', () => {
  it('default exports a component', () => {
    expect(source).toMatch(/export default function LargeTable/);
  });
  it('renders 50,000 rows', () => {
    expect(source).toMatch(/50[_,]?000|50000|ROW_COUNT\s*=\s*50_000/);
  });
  it('memoizes the dataset', () => {
    expect(source).toMatch(/React\.useMemo|useMemo\(/);
  });
  it('uses the shared DataTable + FakeRow generator', () => {
    expect(source).toMatch(/from\s+['"]@\/components\/ui\/data-table['"]/);
    expect(source).toMatch(/from\s+['"]@\/lib\/fake-rows['"]/);
  });
});
