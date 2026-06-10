import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

// Source-level guards for the June 2026 audit Wave-1 production fixes
// (docs/AUDIT-2026-06.md §3, §5.3). Each assertion pins a fix that shipped
// after being reproduced on the live deploy.

const read = (p: string) => readFileSync(new URL(`../../${p}`, import.meta.url), 'utf-8');

describe('audit wave 1 — production fixes', () => {
  it('robots.txt points at the real sitemap, not the placeholder domain', () => {
    const robots = read('public/robots.txt');
    expect(robots).not.toContain('inceptor.example');
    expect(robots).toContain('https://artemiop.com/inceptor/sitemap-index.xml');
  });

  it('PWA navigateFallback stays inside the configured base scope', () => {
    const config = read('astro.config.mjs');
    expect(config).toContain('navigateFallback: BASE');
    expect(config).not.toMatch(/navigateFallback:\s*'\/'/);
  });

  it('a custom 404 page exists so GitHub Pages stops serving its default', () => {
    const page = read('src/pages/404.astro');
    expect(page).toContain('Page not found');
    expect(page).toContain('withBase(');
  });

  it('docs search resolves the Pagefind bundle under the deploy base', () => {
    const search = read('src/components/docs/DocsSearch.astro');
    expect(search).toContain('import.meta.env.BASE_URL');
    expect(search).not.toContain("['/', '_pagefind', '/pagefind.js']");
  });

  it('blog disabled-flag redirects are base-aware', () => {
    expect(read('src/pages/blog/index.astro')).toContain("Astro.redirect(withBase('/')");
    expect(read('src/pages/blog/[...slug].astro')).toContain("Astro.redirect(withBase('/')");
  });

  it('data demo links the live large-table route, not the pre-redirect path', () => {
    expect(read('src/pages/demos/data.astro')).toContain("withBase('/demos/data/large/')");
  });

  it('every Recharts wrapper disables the entry animation that left shapes invisible inside Astro islands', () => {
    for (const f of [
      'src/components/ui/charts/bar-chart.tsx',
      'src/components/ui/charts/donut-chart.tsx',
      'src/components/ui/charts/area-chart.tsx',
      'src/components/ui/charts/line-chart.tsx',
      'src/components/ui/charts/gauge.tsx',
      'src/components/ui/charts/sparkline.tsx',
    ]) {
      expect(read(f), `${f} must set isAnimationActive={false}`).toContain(
        'isAnimationActive={false}',
      );
    }
  });
});
