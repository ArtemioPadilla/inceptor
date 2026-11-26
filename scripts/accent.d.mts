/** Type declarations for accent.mjs — consumed by tsc and astro check. */
export interface AccentColor {
  l: number;
  c: number;
  h: number;
}
export function parseAccent(input: string): AccentColor;
export function accentHex(hue: number): string;
export function rebrandCss(css: string, hue: number): string;
