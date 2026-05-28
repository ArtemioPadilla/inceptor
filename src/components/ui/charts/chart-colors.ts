/**
 * Tailwind/shadcn chart color tokens. Returned as CSS var references so
 * the actual color is resolved by the browser at paint time — flips
 * automatically when .dark is applied to <html>.
 */
export const CHART_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
] as const;

export type ChartColor = (typeof CHART_COLORS)[number];

/** Picks the i-th color, cycling when index exceeds the palette length. */
export function chartColor(i: number): ChartColor {
  return CHART_COLORS[i % CHART_COLORS.length];
}
