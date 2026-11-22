import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

/**
 * Regression tests for create-inceptor-app's generated output, found while
 * instancing a real project ("Buró del Pueblo"):
 *  - the slug dropped accented letters ("bur-del-pueblo")
 *  - package.json pinned TypeScript 5 while tsconfig sets
 *    ignoreDeprecations: '6.0', so `npm run check` failed with TS5103.
 *  - data-table.tsx grew internal imports (action-bar, use-listing, i18n…)
 *    that the hand-maintained copy list didn't include.
 *  - the de-brand put the hyphenated slug inside JS identifiers
 *    (`W.__buro-del-pueblo_diag`), a syntax error in FeedbackFAB.
 */
describe('create-inceptor-app output', () => {
  let dir: string;
  let out: string;
  const readOut = (rel: string) => readFileSync(join(out, rel), 'utf8');

  beforeAll(() => {
    dir = mkdtempSync(join(tmpdir(), 'init-output-'));
    out = join(dir, 'app');
    execFileSync('node', ['scripts/init.mjs', '--name', 'Buró del Pueblo', '--out', out], {
      stdio: 'pipe',
    });
  });
  afterAll(() => rmSync(dir, { recursive: true, force: true }));

  it('transliterates accented letters in the slug instead of dropping them', () => {
    const pkg = JSON.parse(readOut('package.json')) as { name: string };
    expect(pkg.name).toBe('buro-del-pueblo');
    // The display name keeps its accent.
    expect(readOut('src/lib/site-meta.ts')).toContain("name: 'Buró del Pueblo'");
  });

  it("pins TypeScript 6 when tsconfig uses ignoreDeprecations '6.0'", () => {
    const tsconfig = JSON.parse(readOut('tsconfig.json')) as {
      compilerOptions: { ignoreDeprecations?: string };
    };
    const pkg = JSON.parse(readOut('package.json')) as {
      devDependencies: Record<string, string>;
    };
    expect(tsconfig.compilerOptions.ignoreDeprecations).toBe('6.0');
    expect(pkg.devDependencies.typescript).toMatch(/^\^6\./);
  });

  it('copies every local module the copied sources import', () => {
    const files: string[] = [];
    const walk = (rel: string) => {
      for (const e of readdirSync(join(out, rel), { withFileTypes: true })) {
        const child = `${rel}/${e.name}`;
        if (e.isDirectory()) walk(child);
        else if (/\.(tsx?|astro)$/.test(e.name)) files.push(child);
      }
    };
    walk('src');
    const missing: string[] = [];
    for (const f of files) {
      for (const [, spec = ''] of readOut(f).matchAll(/from\s+['"](@\/[^'"]+)['"]/g)) {
        const base = join(out, 'src', spec.slice(2));
        const found = ['', '.ts', '.tsx', '.astro', '/index.ts', '/index.tsx'].some(
          (ext) => existsSync(base + ext) && !base.endsWith('/'),
        );
        if (!found) missing.push(`${f} → ${spec}`);
      }
    }
    expect(missing).toEqual([]);
  });

  it('keeps JS identifiers valid when the slug contains hyphens', () => {
    const fab = readOut('src/components/common/FeedbackFAB.astro');
    expect(fab).not.toMatch(/__[\w$]*-/);
    expect(fab).toContain('__buro_del_pueblo_diag');
    // DOM ids keep the hyphenated slug.
    expect(fab).toContain('buro-del-pueblo-report-btn');
  });
});
