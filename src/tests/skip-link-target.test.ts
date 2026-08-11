import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, relative } from 'node:path';

// Regression guard for the Epic 12 a11y-debt pass (ground-truth Lighthouse
// scan found `skip-link` failures on /gallery/, /demos/dashboard/, /docs/ —
// BaseLayout's "Skip to content" link (see wave2-fixes.test.ts) points at
// `#main-content`, but most pages' <main> never carried that id, so the
// skip link went nowhere for keyboard/screen-reader users on those routes.
//
// Every .astro file that renders a top-level <main> landmark must give it
// `id="main-content"` so the sitewide skip link always has a real target.

const root = fileURLToPath(new URL('../../', import.meta.url));

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      walk(full, out);
    } else if (entry.endsWith('.astro')) {
      out.push(full);
    }
  }
  return out;
}

// Pages/layouts intentionally excluded: BaseLayout itself only documents the
// contract (the comment mentions "main-content" but never renders a <main>).
const EXCLUDED = new Set(['src/layouts/BaseLayout.astro']);

describe('skip-link target — every rendered <main> carries id="main-content"', () => {
  const astroFiles = [
    ...walk(join(root, 'src/pages')),
    ...walk(join(root, 'src/layouts')),
  ];

  const filesWithMain = astroFiles
    .map((f) => ({ path: f, rel: relative(root, f), source: readFileSync(f, 'utf-8') }))
    .filter(({ source, rel }) => /<main[\s>]/.test(source) && !EXCLUDED.has(rel));

  it('found at least one page/layout with a <main> landmark (sanity)', () => {
    expect(filesWithMain.length).toBeGreaterThan(0);
  });

  it.each(filesWithMain.map(({ rel, source }) => [rel, source] as const))(
    '%s — <main> has id="main-content"',
    (_rel, source) => {
      expect(source).toMatch(/<main\s[^>]*id="main-content"/);
    },
  );
});
