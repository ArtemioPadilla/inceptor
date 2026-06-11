import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

// The agent-readable surface (llms.txt, JSON-LD, site identity) and the
// re-brand instructions for instancing agents. See CLAUDE.md
// § "Agent-readable surface".

const read = (p: string) => readFileSync(new URL(`../../${p}`, import.meta.url), 'utf-8');

describe('agent-readable surface', () => {
  it('site identity is single-sourced in site-meta.ts with the re-brand warning', () => {
    const meta = read('src/lib/site-meta.ts');
    expect(meta).toContain('RE-BRAND ON INSTANTIATION');
    expect(meta).toContain('PUBLIC_REPO_SLUG');
    expect(meta).toMatch(/license: 'MIT'/);
  });

  it('llms.txt and llms-full.txt endpoints exist and derive from site-meta', () => {
    for (const f of ['src/pages/llms.txt.ts', 'src/pages/llms-full.txt.ts']) {
      const src = read(f);
      expect(src).toContain("from '@/lib/site-meta'");
      expect(src).toContain('text/plain');
    }
    expect(read('src/pages/llms.txt.ts')).toContain("getCollection('docs')");
  });

  it('BaseLayout emits JSON-LD blocks and defaults description to the real positioning', () => {
    const layout = read('src/layouts/BaseLayout.astro');
    expect(layout).toContain('application/ld+json');
    expect(layout).toContain('description = SITE.description');
    expect(layout).not.toContain("description = 'Built with inceptor'");
    expect(layout).toContain("href={withBase('/llms.txt')}");
  });

  it('home ships WebSite + SoftwareSourceCode; blog Article; docs BreadcrumbList', () => {
    expect(read('src/pages/index.astro')).toContain("'@type': 'SoftwareSourceCode'");
    expect(read('src/pages/index.astro')).toContain("'@type': 'WebSite'");
    expect(read('src/pages/blog/[...slug].astro')).toContain("'@type': 'Article'");
    expect(read('src/layouts/DocsLayout.astro')).toContain("'@type': 'BreadcrumbList'");
  });

  it('the footer links llms.txt', () => {
    expect(read('src/components/common/SiteFooter.astro')).toContain("withBase('/llms.txt')");
  });

  it('CLAUDE.md instructs instancing agents to re-brand the surface', () => {
    const md = read('CLAUDE.md');
    expect(md).toContain('Agent-readable surface');
    expect(md).toContain('re-brand when instantiating');
    expect(md).toContain('src/lib/site-meta.ts');
  });

  it('create-inceptor-app emits site-meta, llms.txt, and a CLAUDE.md re-brand checklist with TODO(agent) markers', () => {
    const init = read('scripts/init.mjs');
    expect(init).toContain("write('src/lib/site-meta.ts'");
    expect(init).toContain("write('src/pages/llms.txt.ts'");
    expect(init).toContain("write('CLAUDE.md'");
    expect(init).toContain('Re-brand checklist');
    expect(init.match(/TODO\(agent\)/g)?.length ?? 0).toBeGreaterThanOrEqual(2);
  });
});
