/**
 * defineTheme(accentColor) — Epic 25 (ROADMAP "Generative theming").
 *
 * Derives a full accessible light+dark palette from a single brand/accent
 * color, mirroring Chakra's semantic tokens, Astryx's `defineTheme()`, MUI's
 * CSS-variables mode, and Ant Design's Seed→Map→Alias pipeline — all four
 * derive light+dark from one definition instead of hand-tuning ~20 CSS vars.
 *
 * This is a pure function (no DOM, no build step) so it can plausibly be
 * called from a future `create-inceptor-app` setup script to re-brand a new
 * project's `src/styles/global.css` from one accent color, per the
 * "re-brand when instantiating" workflow CLAUDE.md already documents.
 *
 * Design choice: we deliberately reuse the exact lightness/chroma magnitudes
 * already shipped (and comment-annotated "deep enough for white text to
 * clear WCAG AA 4.5:1") for the emerald palette in global.css, and only
 * rotate hue to the caller's accent. Trusting an arbitrary caller-supplied
 * lightness/chroma instead could silently produce an inaccessible palette;
 * rotating a vetted formula's hue cannot.
 */

/** A color expressed in the OKLCH color space (perceptually uniform). */
export interface OklchColor {
  l: number;
  c: number;
  h: number;
}

/** One mode's (light or dark) worth of semantic theme tokens. */
export interface PaletteTokens {
  background: string;
  foreground: string;
  primary: string;
  primaryForeground: string;
  accent: string;
  accentForeground: string;
  border: string;
  /** Highlighter fill (the block behind a phrase, a pin) and the ink it carries. */
  highlight: string;
  highlightForeground: string;
  /** Mid-light supporting fill, with dark ink. */
  brand2: string;
  brand2Foreground: string;
  /** Deep supporting fill, with white text. */
  brand3: string;
  brand3Foreground: string;
}

/** A full generated theme: light + dark palettes sharing one accent hue. */
export interface GeneratedTheme {
  light: PaletteTokens;
  dark: PaletteTokens;
}

function round(n: number, digits: number): number {
  const f = 10 ** digits;
  return Math.round(n * f) / f;
}

function toOklchString({ l, c, h }: OklchColor): string {
  return `oklch(${round(l, 4)} ${round(c, 4)} ${round(h, 2)})`;
}

/** Parses `#rgb` or `#rrggbb` into sRGB channels in the 0..1 range. */
function hexToSrgb(hex: string): [number, number, number] | null {
  const m = hex.trim().match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (!m) return null;
  let h = m[1]!;
  if (h.length === 3) {
    h = h
      .split('')
      .map((ch) => ch + ch)
      .join('');
  }
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  return [r, g, b];
}

function srgbToLinear(channel: number): number {
  return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
}

/** sRGB (0..1 channels) → OKLCH, via linear sRGB → LMS → OKLab (Björn Ottosson's matrices). */
function srgbToOklch([r, g, b]: [number, number, number]): OklchColor {
  const lr = srgbToLinear(r);
  const lg = srgbToLinear(g);
  const lb = srgbToLinear(b);

  const l = 0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb;
  const m = 0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb;
  const s = 0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb;

  const l_ = Math.cbrt(l);
  const m_ = Math.cbrt(m);
  const s_ = Math.cbrt(s);

  const L = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_;
  const a = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_;
  const b2 = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_;

  const C = Math.sqrt(a * a + b2 * b2);
  let H = (Math.atan2(b2, a) * 180) / Math.PI;
  if (H < 0) H += 360;

  return { l: L, c: C, h: H };
}

/** Parses a literal `oklch(L C H)` string (fractions of the space-separated triple). */
function parseOklchString(value: string): OklchColor | null {
  const m = value
    .trim()
    .match(/^oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*[\d.%]+)?\s*\)$/i);
  if (!m) return null;
  return { l: parseFloat(m[1]!), c: parseFloat(m[2]!), h: parseFloat(m[3]!) };
}

/**
 * Parses a caller-supplied accent color — either a hex string (`#10b981`,
 * `#0a0`) or a literal `oklch(L C H)` string — into OKLCH components.
 * Throws on anything else so a typo fails loudly instead of silently
 * producing a gray/hue-0 theme.
 */
export function parseAccentColor(input: string): OklchColor {
  const trimmed = input.trim();

  const oklch = parseOklchString(trimmed);
  if (oklch) return oklch;

  const rgb = hexToSrgb(trimmed);
  if (rgb) return srgbToOklch(rgb);

  throw new Error(
    `defineTheme: could not parse accent color "${input}" — expected an oklch(L C H) or #hex string.`,
  );
}

/** Neutral (chroma-0) OKLCH value — used for background/foreground/border, which stay gray. */
function neutral(l: number): OklchColor {
  return { l, c: 0, h: 0 };
}

/** Dark ink and paper: the two text colours a brand fill can carry. */
const INK = 'oklch(0.165 0.004 286)';
const PAPER = 'oklch(0.99 0 0)';

function hueDistance(a: number, b: number): number {
  return Math.min(Math.abs(a - b), 360 - Math.abs(a - b));
}

function wrapHue(h: number): number {
  return ((h % 360) + 360) % 360;
}

/**
 * Highlight and supporting fills (#337), the same formula as
 * `supportingTokens()` in scripts/accent.mjs (parity test in
 * src/tests/brand-tokens.test.ts). The highlight is a highlighter amber
 * unless the accent is itself near amber, then its complement.
 */
function supporting(hue: number, mode: 'light' | 'dark') {
  const highlightHue = hueDistance(hue, 90) >= 40 ? 90 : hue + 180;
  return {
    highlight: toOklchString({ l: 0.86, c: 0.16, h: wrapHue(highlightHue) }),
    highlightForeground: INK,
    brand2: toOklchString({ l: 0.72, c: 0.1, h: wrapHue(hue + 210) }),
    brand2Foreground: INK,
    brand3: toOklchString(
      mode === 'light'
        ? { l: 0.38, c: 0.13, h: wrapHue(hue - 30) }
        : { l: 0.43, c: 0.14, h: wrapHue(hue - 30) },
    ),
    brand3Foreground: PAPER,
  };
}

function buildPalette(hue: number): GeneratedTheme {
  const light: PaletteTokens = {
    background: toOklchString(neutral(1)),
    foreground: toOklchString(neutral(0.145)),
    primary: toOklchString({ l: 0.5, c: 0.123, h: hue }),
    primaryForeground: toOklchString(neutral(0.99)),
    accent: toOklchString({ l: 0.96, c: 0.02, h: hue }),
    accentForeground: toOklchString({ l: 0.3, c: 0.06, h: hue }),
    border: toOklchString(neutral(0.922)),
    ...supporting(hue, 'light'),
  };

  const dark: PaletteTokens = {
    background: toOklchString(neutral(0.145)),
    foreground: toOklchString(neutral(0.985)),
    primary: toOklchString({ l: 0.78, c: 0.155, h: hue }),
    primaryForeground: toOklchString({ l: 0.2, c: 0.03, h: hue }),
    accent: toOklchString({ l: 0.28, c: 0.04, h: hue }),
    accentForeground: toOklchString({ l: 0.92, c: 0.05, h: hue }),
    // Dark borders use a translucent white overlay rather than a flat gray —
    // same convention as the shipped palette's `--border` in `.dark`.
    border: 'oklch(1 0 0 / 12%)',
    ...supporting(hue, 'dark'),
  };

  return { light, dark };
}

/**
 * Derives a full light+dark theme from one accent color.
 *
 * @param accentColor - `#hex` or `oklch(L C H)` string.
 */
export function defineTheme(accentColor: string): GeneratedTheme {
  const { h } = parseAccentColor(accentColor);
  return buildPalette(h);
}
