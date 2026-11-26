import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { fallbackFaces } from '../../scripts/font-fallbacks.mjs';

/**
 * #339: init.mjs generated one landing, and `--accent` only changed its hue.
 * `--look` picks one of three starting landings built from the marketing
 * blocks, each with its own type, composition and highlight treatment.
 */
const LOOKS = ['editorial', 'bold', 'product'] as const;
const require = createRequire(import.meta.url);
const squash = (s: string) => s.replace(/\s+/g, ' ').trim();

describe('create-inceptor-app --look', () => {
  let dir: string;
  const out = (name: string) => join(dir, name);
  const gen = (name: string, extra: string[]) => {
    execFileSync('node', ['scripts/init.mjs', '--name', name, '--out', out(name), ...extra], {
      stdio: 'pipe',
    });
    return (rel: string) => readFileSync(join(out(name), rel), 'utf8');
  };
  const files = {} as Record<(typeof LOOKS)[number] | 'plain', (rel: string) => string>;

  beforeAll(() => {
    dir = mkdtempSync(join(tmpdir(), 'init-looks-'));
    for (const look of LOOKS) files[look] = gen(look, ['--look', look]);
    files.plain = gen('plain', []);
  });
  afterAll(() => rmSync(dir, { recursive: true, force: true }));

  it.each(LOOKS)('%s: the landing is built from the marketing blocks, which are copied', (look) => {
    const page = files[look]('src/pages/index.astro');
    const used = [...page.matchAll(/from '\.\.\/components\/blocks\/(\w+)\.astro'/g)].map(
      (m) => m[1]!,
    );
    expect(used.length).toBeGreaterThanOrEqual(3);
    for (const block of used) {
      expect(existsSync(join(out(look), `src/components/blocks/${block}.astro`)), block).toBe(true);
    }
    expect(page).toContain('id="main"');
    // Placeholder copy is marked for the agent that takes over.
    expect(page).toMatch(/TODO\(agent\)/);
  });

  it('the three landings are different compositions, not one page recoloured', () => {
    const blocksOf = (look: (typeof LOOKS)[number]) =>
      [
        ...files[look]('src/pages/index.astro').matchAll(
          /<(HeroGraphic|HighlightHeadline|PairedCards|LevelLadder|PrinciplesPanel|CtaBand)\b/g,
        ),
      ]
        .map((m) => m[1])
        .join(' > ');
    const orders = LOOKS.map(blocksOf);
    expect(new Set(orders).size).toBe(LOOKS.length);
    // Only the bold look carries the graphic hero (and so its SVG layers).
    expect(orders[1]).toMatch(/^HeroGraphic/);
    expect(existsSync(join(out('bold'), 'src/assets/blocks/hero-lines.svg'))).toBe(true);
    expect(orders[0]).not.toMatch(/HeroGraphic/);
    expect(orders[2]).not.toMatch(/HeroGraphic/);
  });

  it('each look has its own display face, imported by the layout and listed in package.json', () => {
    const expected = {
      editorial: {
        pkg: '@fontsource-variable/fraunces',
        stack: /--font-display:\s*'Fraunces Variable'/,
      },
      bold: {
        pkg: '@fontsource-variable/bricolage-grotesque',
        stack: /--font-display:\s*'Bricolage Grotesque Variable',\s*'Bricolage Grotesque Fallback'/,
      },
      product: {
        pkg: '@fontsource-variable/hanken-grotesk',
        stack: /--font-display:\s*'Hanken Grotesk Variable'/,
      },
    };
    for (const look of LOOKS) {
      const { pkg, stack } = expected[look];
      expect(files[look]('src/layouts/BaseLayout.astro'), look).toContain(`import '${pkg}';`);
      expect(JSON.parse(files[look]('package.json')).dependencies[pkg], look).toBeTruthy();
      expect(files[look]('src/styles/global.css'), look).toMatch(stack);
    }
    // A look that does not use Fraunces does not ship it.
    for (const look of ['bold', 'product'] as const) {
      expect(files[look]('src/layouts/BaseLayout.astro')).not.toContain('fraunces');
      expect(
        JSON.parse(files[look]('package.json')).dependencies['@fontsource-variable/fraunces'],
      ).toBeUndefined();
      expect(files[look]('src/styles/global.css')).not.toContain('Fraunces');
    }
  });

  it('bold: the fallback faces are the script output for its display font', () => {
    const font = readFileSync(
      join(
        require.resolve('@fontsource-variable/bricolage-grotesque/package.json'),
        '..',
        'files',
        'bricolage-grotesque-latin-wght-normal.woff2',
      ),
    );
    expect(squash(files.bold('src/styles/global.css'))).toContain(
      squash(fallbackFaces(font, { family: 'Bricolage Grotesque', kind: 'sans' })),
    );
  });

  it('records the look in the generated CLAUDE.md', () => {
    expect(files.bold('CLAUDE.md')).toMatch(/--look bold/);
    expect(files.plain('CLAUDE.md')).not.toMatch(/--look \w/);
  });

  it('without --look the landing and the fonts are unchanged', () => {
    const page = files.plain('src/pages/index.astro');
    expect(page).not.toContain('components/blocks/');
    expect(page).toContain('Your new project is ready');
    expect(existsSync(join(out('plain'), 'src/components/blocks'))).toBe(false);
    expect(files.plain('src/styles/global.css')).toMatch(/--font-display:\s*'Fraunces Variable'/);
  });

  it('combines with --accent', () => {
    const both = gen('both', ['--look', 'bold', '--accent', '#d6006f']);
    expect(both('src/styles/global.css')).not.toMatch(/oklch\(\s*[\d.]+\s+0\.\d+\s+16[3-5]\b/);
    expect(both('src/pages/index.astro')).toContain('HeroGraphic');
  });

  it('an unknown look fails before anything is written', () => {
    const run = spawnSync(
      'node',
      ['scripts/init.mjs', '--name', 'bad', '--out', out('bad'), '--look', 'fancy'],
      { encoding: 'utf8' },
    );
    expect(run.status).toBe(1);
    expect(run.stderr).toMatch(/--look/);
    expect(existsSync(out('bad'))).toBe(false);
  });
});
