import { describe, expect, it } from 'vitest';
import { defineTheme, parseAccentColor } from './define-theme';

/**
 * defineTheme(accentColor) — Epic 25 (ROADMAP "Generative theming").
 *
 * Pure function: given one brand/accent color, derive a full light+dark
 * palette using the same oklch-based approach the shipped emerald palette
 * in src/styles/global.css already uses (fixed, vetted lightness/chroma
 * magnitudes, hue rotated to the caller's accent). No DOM, no build step —
 * plausibly callable from a future `create-inceptor-app` setup script.
 */

/** Extracts the L component from an `oklch(L C H [/ A])` string. */
function lightnessOf(oklchValue: string): number {
  const m = oklchValue.match(/oklch\(\s*([\d.]+)/i);
  if (!m) throw new Error(`not an oklch() string: ${oklchValue}`);
  return parseFloat(m[1]!);
}

/** Extracts the H component from an `oklch(L C H)` string, if present. */
function hueOf(oklchValue: string): number | null {
  const m = oklchValue.match(/oklch\(\s*[\d.]+\s+[\d.]+\s+([\d.]+)/i);
  return m ? parseFloat(m[1]!) : null;
}

describe('parseAccentColor', () => {
  it('parses a 6-digit hex color into oklch components', () => {
    const parsed = parseAccentColor('#10b981');
    expect(parsed.l).toBeGreaterThan(0);
    expect(parsed.l).toBeLessThan(1);
    expect(parsed.h).toBeGreaterThanOrEqual(0);
    expect(parsed.h).toBeLessThan(360);
  });

  it('parses a 3-digit hex color', () => {
    const parsed = parseAccentColor('#0a0');
    expect(parsed.c).toBeGreaterThan(0);
  });

  it('parses an oklch(...) string directly', () => {
    const parsed = parseAccentColor('oklch(0.6 0.15 250)');
    expect(parsed.l).toBeCloseTo(0.6, 5);
    expect(parsed.c).toBeCloseTo(0.15, 5);
    expect(parsed.h).toBeCloseTo(250, 5);
  });

  it('throws on an unparseable input', () => {
    expect(() => parseAccentColor('not-a-color')).toThrow();
  });
});

describe('defineTheme', () => {
  it('returns a light and dark palette with every required token', () => {
    const theme = defineTheme('#10b981');
    for (const mode of ['light', 'dark'] as const) {
      const palette = theme[mode];
      expect(palette.background).toMatch(/^oklch\(/);
      expect(palette.foreground).toMatch(/^oklch\(/);
      expect(palette.primary).toMatch(/^oklch\(/);
      expect(palette.primaryForeground).toMatch(/^oklch\(/);
      expect(palette.accent).toMatch(/^oklch\(/);
      expect(palette.accentForeground).toMatch(/^oklch\(/);
      expect(palette.border).toMatch(/^oklch\(/);
    }
  });

  it('is a pure function — same input yields deep-equal output', () => {
    const a = defineTheme('#10b981');
    const b = defineTheme('#10b981');
    expect(a).toEqual(b);
  });

  it('rotates primary/accent hue to match the caller-supplied accent', () => {
    const theme = defineTheme('oklch(0.6 0.15 250)');
    const primaryHue = hueOf(theme.light.primary);
    const accentHue = hueOf(theme.light.accent);
    expect(primaryHue).not.toBeNull();
    expect(accentHue).not.toBeNull();
    // Allow a small tolerance since hue is carried straight through parsing.
    expect(Math.abs(primaryHue! - 250)).toBeLessThan(1);
    expect(Math.abs(accentHue! - 250)).toBeLessThan(1);
  });

  it('accepts a hex accent color and produces a plausible hue', () => {
    // #10b981 is emerald — hue should land in the green range (~140-170).
    const theme = defineTheme('#10b981');
    const primaryHue = hueOf(theme.light.primary);
    expect(primaryHue).not.toBeNull();
    expect(primaryHue!).toBeGreaterThan(120);
    expect(primaryHue!).toBeLessThan(180);
  });

  it('produces legible foreground/background lightness contrast — light mode', () => {
    const theme = defineTheme('#10b981');
    const { light } = theme;
    expect(Math.abs(lightnessOf(light.foreground) - lightnessOf(light.background))).toBeGreaterThan(
      0.7,
    );
    expect(
      Math.abs(lightnessOf(light.primaryForeground) - lightnessOf(light.primary)),
    ).toBeGreaterThan(0.3);
    expect(
      Math.abs(lightnessOf(light.accentForeground) - lightnessOf(light.accent)),
    ).toBeGreaterThan(0.3);
  });

  it('produces legible foreground/background lightness contrast — dark mode', () => {
    const theme = defineTheme('#10b981');
    const { dark } = theme;
    expect(Math.abs(lightnessOf(dark.foreground) - lightnessOf(dark.background))).toBeGreaterThan(
      0.7,
    );
    expect(
      Math.abs(lightnessOf(dark.primaryForeground) - lightnessOf(dark.primary)),
    ).toBeGreaterThan(0.3);
    expect(
      Math.abs(lightnessOf(dark.accentForeground) - lightnessOf(dark.accent)),
    ).toBeGreaterThan(0.3);
  });

  it('produces a different hue for a differently-hued accent (e.g. blue vs emerald)', () => {
    const emerald = defineTheme('#10b981');
    const blue = defineTheme('oklch(0.55 0.2 260)');
    const emeraldHue = hueOf(emerald.light.primary)!;
    const blueHue = hueOf(blue.light.primary)!;
    expect(Math.abs(emeraldHue - blueHue)).toBeGreaterThan(30);
  });
});
