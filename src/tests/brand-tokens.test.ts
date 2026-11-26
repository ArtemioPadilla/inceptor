import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseAccent, rebrandCss, supportingTokens } from '../../scripts/accent.mjs';
import { defineTheme } from '@/lib/define-theme';

/**
 * #337: the template had one brand colour. A landing needs a highlight (the
 * block behind a phrase, a pin) and one or two supporting fills; Buró del
 * Pueblo added them by hand. They are now tokens, derived from the accent hue
 * so `--accent` re-brands them, and each fill ships with its text colour.
 */
const css = readFileSync('src/styles/global.css', 'utf8');
const TOKENS = ['highlight', 'brand-2', 'brand-3'] as const;

/** `oklch(L C H)` → WCAG relative luminance (same conversion as ux-contrast.test.ts). */
function luminance(value: string): number {
  const m = value.match(/oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)/)!;
  const [L, C, H] = [parseFloat(m[1]!), parseFloat(m[2]!), (parseFloat(m[3]!) * Math.PI) / 180];
  const a = Math.cos(H) * C;
  const b = Math.sin(H) * C;
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const mm = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const clip = (v: number) => Math.min(1, Math.max(0, v));
  const r = clip(4.0767416621 * l - 3.3077115913 * mm + 0.2309699292 * s);
  const g = clip(-1.2684380046 * l + 2.6097574011 * mm - 0.3413193965 * s);
  const bl = clip(-0.0041960863 * l - 0.7034186147 * mm + 1.707614701 * s);
  return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
}
const contrast = (x: string, y: string) => {
  const [hi, lo] = [luminance(x), luminance(y)].sort((p, q) => q - p) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
};
const declared = (source: string, name: string) => {
  const m = source.match(
    new RegExp(
      `--${name}:\\s*light-dark\\(\\s*(oklch\\([^)]*\\))\\s*,\\s*(oklch\\([^)]*\\))\\s*\\)`,
    ),
  );
  expect(m, `--${name} is declared with light-dark()`).not.toBeNull();
  return { light: m![1]!, dark: m![2]! };
};

describe('highlight and supporting brand tokens', () => {
  it.each(TOKENS)('--%s and its foreground exist and map to a Tailwind colour', (name) => {
    declared(css, name);
    declared(css, `${name}-foreground`);
    expect(css).toContain(`--color-${name}: var(--${name});`);
    expect(css).toContain(`--color-${name}-foreground: var(--${name}-foreground);`);
  });

  it.each(TOKENS)('text on --%s clears 4.5:1 in light and dark', (name) => {
    const fill = declared(css, name);
    const text = declared(css, `${name}-foreground`);
    expect(contrast(text.light, fill.light)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(text.dark, fill.dark)).toBeGreaterThanOrEqual(4.5);
  });

  it('the shipped values are the ones derived from the template accent', () => {
    const derived = supportingTokens(163);
    for (const name of TOKENS) {
      expect(declared(css, name)).toEqual(derived[name]);
      expect(declared(css, `${name}-foreground`)).toEqual(derived[`${name}-foreground`]);
    }
  });
});

describe('derivation from the accent', () => {
  const HUES = [0.8, 40, 90, 163, 216, 255, 300];

  it.each(HUES)('at hue %s every fill keeps AA text contrast in both themes', (hue) => {
    const t = supportingTokens(hue);
    for (const name of TOKENS) {
      expect(
        contrast(t[`${name}-foreground`].light, t[name].light),
        `${name} light`,
      ).toBeGreaterThanOrEqual(4.5);
      expect(
        contrast(t[`${name}-foreground`].dark, t[name].dark),
        `${name} dark`,
      ).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('the highlight never lands on the accent hue', () => {
    for (const hue of HUES) {
      const h = parseFloat(supportingTokens(hue).highlight.light.match(/([\d.]+)\)$/)![1]!);
      const distance = Math.min(Math.abs(h - hue), 360 - Math.abs(h - hue));
      expect(distance, `accent ${hue}`).toBeGreaterThanOrEqual(40);
    }
  });

  it('rebrandCss rewrites the supporting tokens for the new hue', () => {
    const hue = parseAccent('#d6006f').h;
    const out = rebrandCss(css, hue);
    const derived = supportingTokens(hue);
    for (const name of TOKENS) expect(declared(out, name)).toEqual(derived[name]);
  });

  it('define-theme.ts derives the same supporting tokens (parity)', () => {
    const theme = defineTheme('#d6006f');
    const derived = supportingTokens(parseAccent('#d6006f').h);
    expect(theme.light.highlight).toBe(derived.highlight.light);
    expect(theme.dark.highlight).toBe(derived.highlight.dark);
    expect(theme.light.brand2).toBe(derived['brand-2'].light);
    expect(theme.dark.brand3).toBe(derived['brand-3'].dark);
    expect(theme.light.brand3Foreground).toBe(derived['brand-3-foreground'].light);
  });
});
