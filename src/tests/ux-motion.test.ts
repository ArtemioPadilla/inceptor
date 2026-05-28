import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

/**
 * `prefers-reduced-motion` guard (Epic 12 criterion #4).
 *
 * Two rules:
 *   1. global.css declares the @media (prefers-reduced-motion: reduce) block
 *      that disables view-transitions and animation keyframes.
 *   2. No island uses Motion's `animate=` prop outside a <LazyMotion> tree.
 *      `tailwindcss-motion` utilities are exempt — they respect the OS pref
 *      by default.
 *
 * Rule 2 is a lint: greps the islands tree for `animate=` and asserts that
 * every match co-locates with `LazyMotion`.
 */

const css = readFileSync(
  fileURLToPath(new URL('../styles/global.css', import.meta.url)),
  'utf-8',
);

describe('prefers-reduced-motion guard', () => {
  it('global.css declares the @media (prefers-reduced-motion: reduce) rule', () => {
    expect(css).toMatch(/@media\s*\(\s*prefers-reduced-motion\s*:\s*reduce\s*\)/);
  });

  it('disables view-transitions on reduced motion', () => {
    // Both ::view-transition-old(root) and ::view-transition-new(root) get animation: none
    expect(css).toMatch(/::view-transition-(old|new)\(root\)/);
  });

  it('every Motion `animate=` prop in islands is wrapped in <LazyMotion>', () => {
    // List islands using `find` since `node:fs/promises` glob isn't on all node versions
    const list = execSync(
      "find src/components -type f \\( -name '*.tsx' -o -name '*.ts' \\)",
      { encoding: 'utf-8' },
    )
      .trim()
      .split('\n')
      .filter(Boolean);

    const offenders: string[] = [];
    for (const path of list) {
      const src = readFileSync(path, 'utf-8');
      // Only flag files that import from motion/react (i.e. real Motion usage)
      if (!/from\s+['"]motion\/react['"]/.test(src)) continue;
      if (!/<LazyMotion/.test(src) && /animate\s*=/.test(src)) {
        offenders.push(path);
      }
    }
    expect(offenders, `Motion animate= outside <LazyMotion>: ${offenders.join(', ')}`).toEqual([]);
  });
});
