import { describe, expect, it } from 'vitest';
import source from './DashboardIsland.tsx?raw';

describe('DashboardIsland', () => {
  it('default exports a component', () => {
    expect(source).toMatch(/export default function DashboardIsland/);
  });

  it('wraps inner content in QueryProvider with isolated idbKey', () => {
    expect(source).toMatch(/QueryProvider/);
    expect(source).toMatch(/idbKey=["']tanstack-query-cache-dashboard["']/);
  });

  it('renders 3 KPIs, 2 charts, 1 table', () => {
    // 3 Metric usages — one per KPI card
    expect((source.match(/<Metric/g) ?? []).length).toBeGreaterThanOrEqual(3);
    // 2 chart components
    expect(source).toMatch(/<BarChart/);
    expect(source).toMatch(/<DonutChart/);
    // 1 DataTable
    expect(source).toMatch(/<DataTable/);
  });

  it('uses opt-in persistence', () => {
    expect(source).toMatch(/meta:\s*\{\s*persist:\s*true\s*\}/);
  });

  it('handles error state via Callout', () => {
    expect(source).toMatch(/<Callout/);
  });

  it('exposes a Retry action via useQueryClient', () => {
    expect(source).toMatch(/useQueryClient/);
    expect(source).toMatch(/Retry/);
  });
});
