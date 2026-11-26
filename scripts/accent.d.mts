/** Type declarations for accent.mjs — consumed by tsc and astro check. */
export interface AccentColor {
  l: number;
  c: number;
  h: number;
}
export function parseAccent(input: string): AccentColor;
export function accentHex(hue: number): string;
export function rebrandCss(css: string, hue: number): string;
export interface TokenPair {
  light: string;
  dark: string;
}
export type SupportingToken =
  | 'highlight'
  | 'highlight-foreground'
  | 'brand-2'
  | 'brand-2-foreground'
  | 'brand-3'
  | 'brand-3-foreground';
export function supportingTokens(hue: number): Record<SupportingToken, TokenPair>;
