/**
 * Accent-colour helpers for scripts/init.mjs (#326): re-brand a generated
 * project from one colour. Plain ESM because init.mjs cannot import the
 * TypeScript in src/lib/define-theme.ts; src/tests/init-accent.test.ts keeps
 * the two parsers in step (parity test).
 *
 * Same design choice as define-theme.ts: only the HUE of the caller's colour
 * is used. Lightness and chroma stay the ones the template ships and tests
 * for WCAG AA contrast, so an arbitrary accent cannot produce an unreadable
 * palette.
 */

/** Hues of the template's emerald brand tokens in src/styles/global.css. */
const TEMPLATE_HUES = '16[3-5]';
/** The template's hex scale (`--color-primary-400` … `-700`). */
const TEMPLATE_HEX_SCALE = ['#34d399', '#10b981', '#059669', '#047857'];
/** Lightness and chroma of the light-mode `--primary`: the favicon and theme-color colour. */
const PRIMARY_LIGHT = { l: 0.5, c: 0.123 };

const toLinear = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const toGamma = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);

function hexToSrgb(hex) {
  const m = hex.trim().match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (!m) return null;
  const h = m[1].length === 3 ? [...m[1]].map((ch) => ch + ch).join('') : m[1];
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
}

function srgbToOklch([r, g, b]) {
  const [lr, lg, lb] = [r, g, b].map(toLinear);
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const bb = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return { l: L, c: Math.hypot(a, bb), h: ((Math.atan2(bb, a) * 180) / Math.PI + 360) % 360 };
}

function oklchToLinearSrgb({ l, c, h }) {
  const a = c * Math.cos((h * Math.PI) / 180);
  const b = c * Math.sin((h * Math.PI) / 180);
  const L = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const M = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const S = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * L - 3.3077115913 * M + 0.2309699292 * S,
    -1.2684380046 * L + 2.6097574011 * M - 0.3413193965 * S,
    -0.0041960863 * L - 0.7034186147 * M + 1.707614701 * S,
  ];
}

/** OKLCH → `#rrggbb`. Out-of-gamut colours lose chroma, never hue or lightness. */
function oklchToHex(color) {
  let c = color.c;
  let rgb = oklchToLinearSrgb({ ...color, c });
  const inGamut = (v) => v.every((x) => x >= -0.0005 && x <= 1.0005);
  while (!inGamut(rgb) && c > 0) {
    c = Math.max(0, c - 0.004);
    rgb = oklchToLinearSrgb({ ...color, c });
  }
  const byte = (v) =>
    Math.round(toGamma(Math.min(1, Math.max(0, v))) * 255)
      .toString(16)
      .padStart(2, '0');
  return `#${rgb.map(byte).join('')}`;
}

/**
 * Parses `#rgb`, `#rrggbb` or `oklch(L C H)` into OKLCH. Throws on anything
 * else, and on a colour with no hue (a gray cannot brand a palette).
 */
export function parseAccent(input) {
  const text = String(input).trim();
  const m = text.match(/^oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*[\d.%]+)?\s*\)$/i);
  const rgb = m ? null : hexToSrgb(text);
  if (!m && !rgb) {
    throw new Error(
      `accent: could not parse "${input}" — expected a #hex or an oklch(L C H) colour.`,
    );
  }
  const color = m
    ? { l: parseFloat(m[1]), c: parseFloat(m[2]), h: parseFloat(m[3]) }
    : srgbToOklch(rgb);
  if (color.c < 0.02) {
    throw new Error(`accent: "${input}" is a gray (no hue to brand the palette with).`);
  }
  return color;
}

/** The light-mode primary at `hue`, as a hex: favicon fill and theme-color. */
export function accentHex(hue) {
  return oklchToHex({ ...PRIMARY_LIGHT, h: hue });
}

/** Dark ink and paper: the two text colours a brand fill can carry. */
const INK = 'oklch(0.165 0.004 286)';
const PAPER = 'oklch(0.99 0 0)';
const SUPPORTING = ['highlight', 'brand-2', 'brand-3'];
const hueDistance = (a, b) => Math.min(Math.abs(a - b), 360 - Math.abs(a - b));
const oklch = (l, c, h) => `oklch(${l} ${c} ${Math.round((((h % 360) + 360) % 360) * 100) / 100})`;

/**
 * The highlight and the two supporting fills for an accent `hue`, each with
 * the text colour it carries, as `{ light, dark }` pairs (#337). Same formula
 * as define-theme.ts (parity test in src/tests/brand-tokens.test.ts).
 *
 * - highlight: a highlighter amber (hue 90), light enough for dark ink. If
 *   the accent is itself near amber, the complement is used instead, so the
 *   highlight never merges with the action colour.
 * - brand-2: a mid-light fill 210° round the wheel, with dark ink.
 * - brand-3: a deep fill 30° before the accent, with white text.
 */
export function supportingTokens(hue) {
  const same = (value) => ({ light: value, dark: value });
  const highlightHue = hueDistance(hue, 90) >= 40 ? 90 : hue + 180;
  return {
    highlight: same(oklch(0.86, 0.16, highlightHue)),
    'highlight-foreground': same(INK),
    'brand-2': same(oklch(0.72, 0.1, hue + 210)),
    'brand-2-foreground': same(INK),
    'brand-3': { light: oklch(0.38, 0.13, hue - 30), dark: oklch(0.43, 0.14, hue - 30) },
    'brand-3-foreground': same(PAPER),
  };
}

/**
 * Rotates every emerald brand token of the template's global.css to `hue`:
 * the `oklch()` values whose hue is the template's (chroma > 0, so neutrals
 * never match) and the `--color-primary-*` hex scale. Lightness and chroma
 * are kept. Other hues (destructive, the rest of the chart palette) stay.
 * The highlight and the supporting fills are re-derived (supportingTokens).
 */
export function rebrandCss(css, hue) {
  const h = Math.round(hue * 10) / 10;
  const brand = new RegExp(
    `oklch\\(\\s*([\\d.]+)\\s+(0\\.\\d*[1-9]\\d*)\\s+${TEMPLATE_HUES}(\\s*\\/[^)]*)?\\)`,
    'g',
  );
  let out = css.replace(brand, (_, l, c, alpha = '') => `oklch(${l} ${c} ${h}${alpha})`);
  for (const hex of TEMPLATE_HEX_SCALE) {
    const { l, c } = srgbToOklch(hexToSrgb(hex));
    out = out.replace(new RegExp(hex, 'gi'), oklchToHex({ l, c, h: hue }));
  }
  // The highlight and supporting fills are derived, not rotated.
  const derived = supportingTokens(hue);
  for (const name of SUPPORTING.flatMap((n) => [n, `${n}-foreground`])) {
    const { light, dark } = derived[name];
    out = out.replace(
      new RegExp(`(--${name}:\\s*)light-dark\\([^;]*\\);`),
      `$1light-dark(${light}, ${dark});`,
    );
  }
  return out;
}
