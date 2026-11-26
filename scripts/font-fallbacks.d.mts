/** Type declarations for font-fallbacks.mjs — consumed by tsc and astro check. */
export interface FontMetrics {
  unitsPerEm: number;
  ascent: number;
  descent: number;
  lineGap: number;
  xWidthAvg: number;
}
export interface LocalFont {
  local: string;
  suffix: string;
  xWidthAvg: number;
  unitsPerEm: number;
}
export const LOCAL_FONTS: Record<'sans' | 'serif', LocalFont[]>;
export function readMetrics(buffer: Uint8Array): FontMetrics;
export function fallbackFaces(
  buffer: Uint8Array,
  options: { family: string; kind: 'sans' | 'serif' },
): string;
