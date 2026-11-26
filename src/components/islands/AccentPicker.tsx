import * as React from 'react';
import { defineTheme, type PaletteTokens } from '@/lib/define-theme';

/**
 * Live accent picker (#340): repaints every `[data-accent-scope]` element
 * with the palette `defineTheme()` derives from one colour, the same
 * derivation `scripts/init.mjs --accent` applies to a generated project.
 *
 * It sets CSS custom properties on the scope (each as `light-dark(l, d)`, so
 * the scope keeps following the theme) and removes them on reset. No
 * listeners, timers or observers: nothing to dispose.
 */
const TOKENS: [cssVar: string, key: keyof PaletteTokens][] = [
  ['--primary', 'primary'],
  ['--primary-foreground', 'primaryForeground'],
  ['--accent', 'accent'],
  ['--accent-foreground', 'accentForeground'],
  ['--highlight', 'highlight'],
  ['--highlight-foreground', 'highlightForeground'],
  ['--brand-2', 'brand2'],
  ['--brand-2-foreground', 'brand2Foreground'],
  ['--brand-3', 'brand3'],
  ['--brand-3-foreground', 'brand3Foreground'],
];

const PRESETS = [
  { name: 'Emerald', hex: '#10b981' },
  { name: 'Rosa', hex: '#d6006f' },
  { name: 'Blue', hex: '#1e70c8' },
  { name: 'Orange', hex: '#c2410c' },
  { name: 'Violet', hex: '#6d3fd1' },
];

const scopes = () => document.querySelectorAll<HTMLElement>('[data-accent-scope]');

function apply(hex: string) {
  const theme = defineTheme(hex);
  for (const el of scopes()) {
    for (const [cssVar, key] of TOKENS) {
      el.style.setProperty(cssVar, `light-dark(${theme.light[key]}, ${theme.dark[key]})`);
    }
  }
}

function reset() {
  for (const el of scopes()) {
    for (const [cssVar] of TOKENS) el.style.removeProperty(cssVar);
    if (el.getAttribute('style') === '') el.removeAttribute('style');
  }
}

export default function AccentPicker() {
  const [picked, setPicked] = React.useState<string | null>(null);
  const id = React.useId();

  const pick = (hex: string) => {
    try {
      apply(hex);
      setPicked(hex.toLowerCase());
    } catch {
      // A gray has no hue to derive from: keep the current palette.
    }
  };

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-center gap-3">
        <label htmlFor={id} className="text-sm font-semibold text-card-foreground">
          Accent colour
        </label>
        <input
          id={id}
          type="color"
          value={picked ?? '#10b981'}
          onChange={(e) => pick(e.target.value)}
          className="h-11 w-14 cursor-pointer rounded-md border border-input bg-background p-1"
        />
        <ul className="flex list-none flex-wrap gap-2">
          {PRESETS.map((preset) => (
            <li key={preset.hex}>
              <button
                type="button"
                aria-pressed={picked === preset.hex}
                onClick={() => pick(preset.hex)}
                className="inline-flex min-h-11 items-center rounded-md border border-input bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted aria-pressed:border-foreground aria-pressed:bg-muted"
              >
                {preset.name}
              </button>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={() => {
            reset();
            setPicked(null);
          }}
          className="inline-flex min-h-11 items-center rounded-md px-3 text-sm font-medium text-muted-foreground underline underline-offset-4 hover:text-foreground"
        >
          Reset
        </button>
      </div>
      <p className="text-sm leading-relaxed text-muted-foreground">
        Only the hue of the colour you pick is used: lightness and saturation stay the ones tested
        for contrast, so the result is usually darker than your colour. The highlight and the two
        supporting fills are derived from it. This is what{' '}
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">--accent</code> does at
        generation time.
      </p>
    </div>
  );
}
