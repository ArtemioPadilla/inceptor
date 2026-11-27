/** Type declarations for brand-kit.mjs — consumed by tsc and astro check. */
export interface ParsedSvg {
  x: number;
  y: number;
  w: number;
  h: number;
  inner: string;
}
export function parseSvg(svg: string): ParsedSvg;
export function recolor(svg: string, map: Record<string, string>): string;
export function oneInk(svg: string, options?: { ink?: string; drop?: string[] }): string;
export function geometryDiff(svgA: string, svgB: string, size?: number): Promise<number>;
export interface Wordmark {
  /** Advance width in em. */
  width: number;
  /** Capital height in em. */
  capHeight: number;
  svg(left: number, baseline: number, capSize: number, fill: string): string;
  widthAt(capSize: number): number;
}
export function wordmark(
  fontPath: string,
  text: string,
  options?: { weight?: number; tracking?: number },
): Wordmark;
export function zip(entries: { name: string; data: Buffer }[]): Buffer;
export interface BrandKitConfig {
  name: string;
  lang?: string;
  wordmark: { text: string; font: string; weight?: number; tracking?: number };
  symbol: string;
  symbolOneInk?: string;
  appIcon?: string;
  ink?: string;
  paper?: string;
  negative?: Record<string, string>;
  oneInk?: { drop?: string[]; allowance?: number };
  palette: { name: string; hex: string; use?: string }[];
  type?: { use: string; family: string; licence?: string }[];
  notes: string[];
  symbolSvg: string;
  symbolOneInkSvg?: string;
}
export function loadConfig(root: string): BrandKitConfig;
export function buildKit(
  config: BrandKitConfig,
  options: { root: string; out: string; pdf?: boolean },
): Promise<string[]>;
