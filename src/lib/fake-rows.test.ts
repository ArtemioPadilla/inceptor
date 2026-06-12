import { describe, expect, it } from 'vitest';
import { generateRows } from './fake-rows';

describe('generateRows', () => {
  it('returns exactly N rows', () => {
    expect(generateRows(10).length).toBe(10);
    expect(generateRows(50_000).length).toBe(50_000);
  });

  it('is deterministic for a given seed', () => {
    const a = generateRows(100, 7);
    const b = generateRows(100, 7);
    expect(a).toEqual(b);
  });

  it('differs across seeds', () => {
    const a = generateRows(100, 1);
    const b = generateRows(100, 2);
    expect(a).not.toEqual(b);
  });

  it('produces well-formed rows', () => {
    // Non-null: generateRows(1) always returns exactly one element (n=1).
    const [row] = generateRows(1) as [ReturnType<typeof generateRows>[number]];
    expect(row.id).toBe(1);
    expect(row.name).toMatch(/^[A-Z][a-z]+ [A-Z][a-z]+$/);
    expect(row.email).toMatch(/@example\.com$/);
    expect(['active', 'invited', 'paused', 'archived']).toContain(row.status);
    expect(row.score).toBeGreaterThanOrEqual(0);
    expect(row.score).toBeLessThanOrEqual(100);
    expect(row.joined).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
