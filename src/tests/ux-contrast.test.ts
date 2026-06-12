import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/**
 * WCAG AA contrast guard (Epic 12, criterion #5).
 *
 * Parses global.css's `:root` and `.dark` blocks, extracts every CSS-var
 * value, then verifies that the foreground/background pairs we actually
 * use (e.g. --foreground/--background, --card-foreground/--card,
 * --primary-foreground/--primary) hit ≥ 4.5:1 contrast.
 *
 * Uses the WCAG 2.1 relative luminance formula. OKLCH values are first
 * converted to sRGB via a (best-effort) conversion since native browser
 * APIs aren't available in Node.
 */

const css = readFileSync(
  fileURLToPath(new URL('../styles/global.css', import.meta.url)),
  'utf-8',
);

interface Vars {
  [name: string]: string;
}

/** Extracts the `--name: value;` declarations from a CSS block delimited by selector. */
function extractVars(blockSelector: RegExp): Vars {
  const m = css.match(blockSelector);
  if (!m) return {};
  // Non-null: the regex has exactly one capture group, so m[1] is always present when m is truthy.
  const body = m[1]!;
  const out: Vars = {};
  for (const line of body.split(/[;\n]/)) {
    const declMatch = line.match(/^\s*(--[a-z0-9-]+):\s*(.+?)\s*$/);
    // Non-null: m[1] and m[2] are the two capture groups of the declaration regex.
    if (declMatch) out[declMatch[1]!] = declMatch[2]!;
  }
  return out;
}

// `:root` may be grouped with `.light` (the alias used to force light tokens
// inside a `.dark` page — see global.css). Match either form.
const lightVars = extractVars(/:root(?:\s*,\s*\.light)?\s*\{([\s\S]*?)\}/);
const darkVars = extractVars(/\.dark\s*\{([\s\S]*?)\}/);

/** Parse an oklch(L C H) string to sRGB. Best-effort, sufficient for AA contrast. */
function oklchToSrgb(value: string): [number, number, number] | null {
  const m = value.match(
    /oklch\(\s*([0-9.]+)\s+([0-9.]+)\s+([0-9.]+)(?:\s*\/\s*([0-9.%]+))?\s*\)/i,
  );
  if (!m) return null;
  // Non-null: the regex has 4 capture groups; m[1..3] always present when m is truthy.
  const L = parseFloat(m[1]!);
  const C = parseFloat(m[2]!);
  const Hdeg = parseFloat(m[3]!);
  // OKLCH → OKLab
  const Hrad = (Hdeg * Math.PI) / 180;
  const a = Math.cos(Hrad) * C;
  const b = Math.sin(Hrad) * C;
  // OKLab → linear sRGB (from Björn Ottosson's matrix)
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const lc = l_ ** 3;
  const mc = m_ ** 3;
  const sc = s_ ** 3;
  const r = 4.0767416621 * lc - 3.3077115913 * mc + 0.2309699292 * sc;
  const g = -1.2684380046 * lc + 2.6097574011 * mc - 0.3413193965 * sc;
  const bb = -0.0041960863 * lc - 0.7034186147 * mc + 1.707614701 * sc;
  // Linear sRGB → sRGB (gamma-encode)
  const enc = (v: number) =>
    v <= 0 ? 0 : v >= 1 ? 1 : v < 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055;
  return [enc(r), enc(g), enc(bb)];
}

/** WCAG relative luminance (input: sRGB 0..1). */
function luminance([r, g, b]: [number, number, number]): number {
  const lin = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function contrast(a: [number, number, number], b: [number, number, number]): number {
  const la = luminance(a);
  const lb = luminance(b);
  const lighter = Math.max(la, lb);
  const darker = Math.min(la, lb);
  return (lighter + 0.05) / (darker + 0.05);
}

/** Test fixture: pairs we actually use as foreground/background in the UI. */
const pairs: Array<[fg: string, bg: string, label: string]> = [
  ['--foreground', '--background', 'body text on surface'],
  ['--card-foreground', '--card', 'text on card'],
  ['--popover-foreground', '--popover', 'text on popover'],
  ['--primary-foreground', '--primary', 'text on primary button'],
  ['--secondary-foreground', '--secondary', 'text on secondary'],
  ['--muted-foreground', '--muted', 'muted text on muted'],
  ['--accent-foreground', '--accent', 'text on accent'],
];

describe('WCAG AA contrast (Epic 12 criterion #5)', () => {
  describe('light theme (:root)', () => {
    it.each(pairs)('%s on %s — %s ≥ 4.5:1', (fgVar, bgVar, _label) => {
      const fgVal = lightVars[fgVar];
      const bgVal = lightVars[bgVar];
      expect(fgVal, `${fgVar} declared in :root`).toBeTruthy();
      expect(bgVal, `${bgVar} declared in :root`).toBeTruthy();
      // Non-null assertions guarded by the toBeTruthy() expectations above.
      const fg = oklchToSrgb(fgVal!);
      const bg = oklchToSrgb(bgVal!);
      expect(fg, `${fgVar} parses as oklch`).not.toBeNull();
      expect(bg, `${bgVar} parses as oklch`).not.toBeNull();
      if (fg && bg) {
        const ratio = contrast(fg, bg);
        // 3:1 is allowed for "muted" foregrounds (large/secondary text per WCAG AA 1.4.3 ≥ 18pt or ≥ 14pt bold).
        // We accept ≥ 3 for --muted-foreground, ≥ 4.5 for everything else.
        const threshold = fgVar === '--muted-foreground' ? 3 : 4.5;
        expect(ratio, `${fgVar}/${bgVar} ratio (${ratio.toFixed(2)})`).toBeGreaterThanOrEqual(
          threshold,
        );
      }
    });
  });

  describe('dark theme (.dark)', () => {
    it.each(pairs)('%s on %s — %s ≥ 4.5:1', (fgVar, bgVar, _label) => {
      const fgVal = darkVars[fgVar];
      const bgVal = darkVars[bgVar];
      expect(fgVal, `${fgVar} declared in .dark`).toBeTruthy();
      expect(bgVal, `${bgVar} declared in .dark`).toBeTruthy();
      // Non-null assertions guarded by the toBeTruthy() expectations above.
      const fg = oklchToSrgb(fgVal!);
      const bg = oklchToSrgb(bgVal!);
      expect(fg, `${fgVar} parses as oklch`).not.toBeNull();
      expect(bg, `${bgVar} parses as oklch`).not.toBeNull();
      if (fg && bg) {
        const ratio = contrast(fg, bg);
        const threshold = fgVar === '--muted-foreground' ? 3 : 4.5;
        expect(ratio, `${fgVar}/${bgVar} ratio (${ratio.toFixed(2)})`).toBeGreaterThanOrEqual(
          threshold,
        );
      }
    });
  });
});
