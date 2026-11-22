import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

/**
 * Gaps found instancing a real project: the generated re-brand checklist
 * points at `public/robots.txt` and `site`, but the generator emitted
 * neither (no sitemap either); the landing copy was Spanish under
 * <html lang="en">; and the generated CLAUDE.md dropped the stack rules
 * (islands, Nano Stores, lifecycle cleanup) that agents need, while the
 * helpers those rules point to weren't copied.
 */
describe('create-inceptor-app production defaults', () => {
  let dir: string;
  const gen = (name: string, extra: string[]) => {
    const out = join(dir, name);
    execFileSync('node', ['scripts/init.mjs', '--name', name, '--out', out, ...extra], {
      stdio: 'pipe',
    });
    return (rel: string) => readFileSync(join(out, rel), 'utf8');
  };
  let withSite: (rel: string) => string;
  let plain: (rel: string) => string;

  beforeAll(() => {
    dir = mkdtempSync(join(tmpdir(), 'init-defaults-'));
    withSite = gen('con-sitio', ['--site', 'https://example.org', '--lang', 'es']);
    plain = gen('plain-app', []);
  });
  afterAll(() => rmSync(dir, { recursive: true, force: true }));

  it('--site sets astro `site`, wires the sitemap and writes robots.txt for the deploy base', () => {
    expect(withSite('astro.config.mjs')).toContain("site: 'https://example.org'");
    expect(withSite('astro.config.mjs')).toContain('sitemap()');
    expect(JSON.parse(withSite('package.json')).dependencies['@astrojs/sitemap']).toBeTruthy();
    expect(withSite('public/robots.txt')).toContain(
      'Sitemap: https://example.org/con-sitio/sitemap-index.xml',
    );
  });

  it('without --site, robots.txt and `site` exist with explicit TODO(agent) markers', () => {
    expect(plain('public/robots.txt')).toContain('TODO(agent)');
    expect(plain('astro.config.mjs')).toContain('TODO(agent)');
  });

  it('--lang sets <html lang> default and the landing copy language', () => {
    expect(withSite('src/layouts/BaseLayout.astro')).toContain("lang = 'es'");
    expect(withSite('src/pages/index.astro')).toContain('Tu nuevo proyecto');
    expect(plain('src/layouts/BaseLayout.astro')).toContain("lang = 'en'");
    expect(plain('src/pages/index.astro')).not.toContain('Tu nuevo proyecto');
  });

  it('generated CLAUDE.md carries the stack rules agents need', () => {
    const md = plain('CLAUDE.md');
    expect(md).toContain('@astrojs/tailwind');
    expect(md).toContain('Nano Stores');
    expect(md).toContain('client:load');
    expect(md).toContain('motion/react');
    expect(md).toContain('createDisposer');
    expect(md).toContain('compound');
  });

  it('copies the helpers those rules reference', () => {
    expect(existsSync(join(dir, 'plain-app', 'src/lib/disposer.ts'))).toBe(true);
    expect(existsSync(join(dir, 'plain-app', 'src/lib/use-client-preference.ts'))).toBe(true);
  });
});
