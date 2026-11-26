import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { fallbackFaces, readMetrics } from '../../scripts/font-fallbacks.mjs';

/**
 * #327: the layout loaded Fraunces, Hanken Grotesk and JetBrains Mono from
 * Google Fonts (every visitor's IP goes to a third party, and a strict CSP
 * must allow two extra hosts), and the stacks had no metric-matched
 * fallbacks, so the swap shifted the layout. The fonts are now served by the
 * site, and scripts/font-fallbacks.mjs computes the fallback faces.
 */
const require = createRequire(import.meta.url);
const read = (rel: string) => readFileSync(rel, 'utf8');
const squash = (s: string) => s.replace(/\s+/g, ' ').trim();
const font = (pkg: string, file: string) =>
  readFileSync(join(require.resolve(`${pkg}/package.json`), '..', 'files', file));
const GOOGLE = /fonts\.googleapis\.com|fonts\.gstatic\.com/;
const PACKAGES = [
  '@fontsource-variable/fraunces',
  '@fontsource-variable/hanken-grotesk',
  '@fontsource-variable/jetbrains-mono',
];

describe('self-hosted fonts', () => {
  it('the template layout makes no request to Google Fonts and imports the packages', () => {
    const layout = read('src/layouts/BaseLayout.astro');
    expect(layout).not.toMatch(GOOGLE);
    for (const pkg of PACKAGES) expect(layout).toContain(`import '${pkg}`);
  });

  it('the stacks put the webfont first and its metric-matched fallbacks right after', () => {
    const css = read('src/styles/global.css');
    expect(css).toMatch(/--font-sans:\s*'Hanken Grotesk Variable',\s*'Hanken Grotesk Fallback'/);
    expect(css).toMatch(/--font-display:\s*'Fraunces Variable',\s*'Fraunces Fallback'/);
    expect(css).toMatch(/--font-mono:\s*'JetBrains Mono Variable'/);
  });
});

describe('scripts/font-fallbacks.mjs', () => {
  const hanken = font(
    '@fontsource-variable/hanken-grotesk',
    'hanken-grotesk-latin-wght-normal.woff2',
  );
  const fraunces = font('@fontsource-variable/fraunces', 'fraunces-latin-wght-normal.woff2');

  it('reads the metrics of a WOFF2 file', () => {
    const m = readMetrics(hanken);
    expect(m.unitsPerEm).toBe(1000);
    expect(m.ascent).toBe(1000);
    expect(m.descent).toBe(-303);
    // Capsize publishes 450 for the static regular; the variable default is the same design.
    expect(Math.abs(m.xWidthAvg - 450)).toBeLessThanOrEqual(5);
  });

  it('rejects a buffer that is not a font', () => {
    expect(() => readMetrics(Buffer.from('not a font'))).toThrow(/font/i);
  });

  it('the fallback faces in global.css are the script output for the shipped fonts', () => {
    const css = squash(read('src/styles/global.css'));
    expect(css).toContain(
      squash(fallbackFaces(hanken, { family: 'Hanken Grotesk', kind: 'sans' })),
    );
    expect(css).toContain(squash(fallbackFaces(fraunces, { family: 'Fraunces', kind: 'serif' })));
  });

  it('emits one face per local font, each with size-adjust and the three overrides', () => {
    const out = fallbackFaces(hanken, { family: 'Hanken Grotesk', kind: 'sans' });
    for (const local of ['Arial', 'Roboto', 'Liberation Sans']) {
      expect(out).toContain(`local('${local}')`);
    }
    expect(out.match(/size-adjust:/g)).toHaveLength(3);
    expect(out.match(/ascent-override:/g)).toHaveLength(3);
    expect(out.match(/descent-override:/g)).toHaveLength(3);
    expect(out.match(/line-gap-override:/g)).toHaveLength(3);
  });
});

describe('create-inceptor-app fonts', () => {
  let dir: string;
  let gen: (rel: string) => string;
  beforeAll(() => {
    dir = mkdtempSync(join(tmpdir(), 'init-fonts-'));
    const out = join(dir, 'app');
    execFileSync('node', ['scripts/init.mjs', '--name', 'app', '--out', out], { stdio: 'pipe' });
    gen = (rel) => readFileSync(join(out, rel), 'utf8');
  });
  afterAll(() => rmSync(dir, { recursive: true, force: true }));

  it('the generated layout makes no request to Google Fonts', () => {
    expect(gen('src/layouts/BaseLayout.astro')).not.toMatch(GOOGLE);
  });

  it('the generated project depends on the font packages its layout imports', () => {
    const deps = JSON.parse(gen('package.json')).dependencies;
    for (const pkg of PACKAGES) {
      expect(deps[pkg], pkg).toBeTruthy();
      expect(gen('src/layouts/BaseLayout.astro')).toContain(`import '${pkg}`);
    }
  });
});
