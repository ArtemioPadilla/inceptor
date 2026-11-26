import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { LOOKS, landing } from '../../scripts/looks.mjs';

/**
 * #340: the site showed components and app blocks, never what a product
 * built from the scaffold can look like. /looks renders the three starting
 * landings live, with a live accent picker, and a blog post tells how Buró
 * del Pueblo got from the generic template to its own design.
 */
const page = readFileSync('src/pages/looks.astro', 'utf8');
const BLOCK = /<(HeroGraphic|HighlightHeadline|PairedCards|LevelLadder|PrinciplesPanel|CtaBand)\b/g;
const order = (source: string) => [...source.matchAll(BLOCK)].map((m) => m[1]).join(' > ');
/** The part of the page inside one look's preview. */
const preview = (look: string) => {
  const start = page.indexOf(`data-look="${look}"`);
  expect(start, `preview for ${look}`).toBeGreaterThan(-1);
  const next = page.indexOf('data-look="', start + 1);
  return page.slice(start, next === -1 ? undefined : next);
};

describe('/looks', () => {
  it.each(Object.keys(LOOKS))(
    '%s: the preview composes the same blocks, in the same order, as init.mjs generates',
    (look) => {
      expect(order(preview(look))).toBe(order(landing(look, { name: 'X', lang: 'en' })));
    },
  );

  it.each(Object.keys(LOOKS))('%s: shows the command that generates it', (look) => {
    expect(page).toContain(`--look ${look}`);
  });

  it('renders one page heading: previews use lower heading levels', () => {
    expect(page.match(/<h1\b/g)).toHaveLength(1);
    expect(page).not.toMatch(/tag="h1"/);
  });

  it('mounts the accent picker as a lazy island scoped to the previews', () => {
    expect(page).toMatch(/<AccentPicker[^>]*client:visible/);
    expect(page).toMatch(/data-accent-scope/);
  });

  it('is reachable from the header and the blocks index', () => {
    expect(readFileSync('src/components/common/SiteHeader.astro', 'utf8')).toMatch(
      /href: '\/looks\/'/,
    );
    expect(readFileSync('src/pages/blocks/index.astro', 'utf8')).toMatch(/\/looks\//);
  });
});

describe('the Buró del Pueblo case', () => {
  const post = readFileSync('src/content/blog/2026-11-design-round-buro-del-pueblo.md', 'utf8');

  it('is a blog post that links the looks and the design round', () => {
    expect(post).toMatch(/^---\ntitle: /);
    expect(post).toMatch(/pubDate: 2026-11-/);
    expect(post).toMatch(/\/looks\//);
    expect(post).toMatch(/dedalo|design round/i);
  });

  it('publishes no screenshot of the other project', () => {
    expect(post).not.toMatch(/!\[[^\]]*\]\(/);
  });
});
