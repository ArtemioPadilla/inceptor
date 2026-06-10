import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

// Source-level guards for Wave 4 issues #138 (/how-it-works) and #144
// (status badge strip) from docs/AUDIT-2026-06.md §7 items 2 & 9.
//
// These are structural guards: they assert the presence of specific markup
// strings that form the acceptance criteria without executing the Astro build.

const read = (p: string) => readFileSync(new URL(`../../${p}`, import.meta.url), 'utf-8');

// ── Issue #138 — /how-it-works page ─────────────────────────────────────────

describe('how-it-works page (#138)', () => {
  it('the page file exists', () => {
    const src = read('src/pages/how-it-works.astro');
    expect(src.length).toBeGreaterThan(0);
  });

  it('uses BaseLayout', () => {
    const src = read('src/pages/how-it-works.astro');
    expect(src).toContain('BaseLayout');
  });

  it('sets id="main-content" on main for the skip-to-content link', () => {
    const src = read('src/pages/how-it-works.astro');
    expect(src).toContain('id="main-content"');
  });

  it('uses withBase() for all internal links', () => {
    const src = read('src/pages/how-it-works.astro');
    expect(src).toContain("import { withBase } from '@/lib/href'");
    expect(src).toMatch(/withBase\(/);
  });

  it('contains the ISSUE stage label', () => {
    const src = read('src/pages/how-it-works.astro');
    // Stage label rendered via TimelineStage label prop
    expect(src).toContain('label="ISSUE"');
  });

  it('contains the PLAN stage label', () => {
    const src = read('src/pages/how-it-works.astro');
    expect(src).toContain('label="PLAN"');
  });

  it('contains the COMMITS stage label', () => {
    const src = read('src/pages/how-it-works.astro');
    expect(src).toContain('label="COMMITS"');
  });

  it('contains the VERDICT stage label', () => {
    const src = read('src/pages/how-it-works.astro');
    expect(src).toContain('label="VERDICT"');
  });

  it('references PR #136 as the real worked example', () => {
    const src = read('src/pages/how-it-works.astro');
    expect(src).toContain('#136');
  });

  it('contains the Tdd-Red trailer mention to explain the convention', () => {
    const src = read('src/pages/how-it-works.astro');
    expect(src).toContain('Tdd-Red:');
  });

  it('has an npm create inceptor-app command in the run-it-yourself CTA', () => {
    const src = read('src/pages/how-it-works.astro');
    expect(src).toContain('npm create inceptor-app');
  });

  it('links to the quick-start docs from the CTA via withBase', () => {
    const src = read('src/pages/how-it-works.astro');
    expect(src).toContain("withBase('/docs/start-here/quick-start/')");
  });

  it('has an SEO title and description on the BaseLayout', () => {
    const src = read('src/pages/how-it-works.astro');
    expect(src).toContain('title="How a feature ships');
    expect(src).toContain('description=');
  });
});

// ── TimelineStage component ───────────────────────────────────────────────────

describe('TimelineStage component (#138)', () => {
  it('the component file exists', () => {
    const src = read('src/components/marketing/TimelineStage.astro');
    expect(src.length).toBeGreaterThan(0);
  });

  it('accepts ISSUE | PLAN | COMMITS | VERDICT as the label prop', () => {
    const src = read('src/components/marketing/TimelineStage.astro');
    // The Props type must enumerate all four
    expect(src).toContain("'ISSUE'");
    expect(src).toContain("'PLAN'");
    expect(src).toContain("'COMMITS'");
    expect(src).toContain("'VERDICT'");
  });
});

// ── Issue #144 — status badge strip ──────────────────────────────────────────

describe('StatusBadgeStrip component (#144)', () => {
  it('the component file exists', () => {
    const src = read('src/components/marketing/StatusBadgeStrip.astro');
    expect(src.length).toBeGreaterThan(0);
  });

  it('contains the CI workflow badge.svg reference', () => {
    const src = read('src/components/marketing/StatusBadgeStrip.astro');
    expect(src).toContain('ci.yml/badge.svg');
  });

  it('contains the Deploy workflow badge.svg reference', () => {
    const src = read('src/components/marketing/StatusBadgeStrip.astro');
    expect(src).toContain('deploy.yml/badge.svg');
  });

  it('all badge data entries carry alt text', () => {
    const src = read('src/components/marketing/StatusBadgeStrip.astro');
    // The badges const array has an `alt` key for each badge; we check the
    // template uses it (b.alt renders via the img alt={b.alt} expression).
    expect(src).toContain('alt={b.alt}');
    // All four badge objects have an `alt:` entry
    const altEntries = src.match(/alt:/g) ?? [];
    expect(altEntries.length).toBeGreaterThanOrEqual(4);
  });

  it('badge images have explicit width and height to prevent CLS', () => {
    const src = read('src/components/marketing/StatusBadgeStrip.astro');
    expect(src).toContain('width=');
    expect(src).toContain('height=');
  });

  it('badge images use loading="lazy"', () => {
    const src = read('src/components/marketing/StatusBadgeStrip.astro');
    expect(src).toContain('loading="lazy"');
  });

  it('each badge is wrapped in an anchor linking to the corresponding workflow/file page', () => {
    const src = read('src/components/marketing/StatusBadgeStrip.astro');
    // The anchor iterates b.href from the badges array; each badge has `href:`
    expect(src).toContain('href={b.href}');
    // All four badge objects define a href: entry
    const hrefEntries = src.match(/href:/g) ?? [];
    expect(hrefEntries.length).toBeGreaterThanOrEqual(4);
  });

  it('shields.io badges use flat-square style for dark-mode consistency', () => {
    const src = read('src/components/marketing/StatusBadgeStrip.astro');
    expect(src).toContain('flat-square');
  });
});

// ── index.astro integrations ──────────────────────────────────────────────────

describe('index.astro wave 4 integrations', () => {
  it('links /how-it-works/ from the loop section', () => {
    const src = read('src/pages/index.astro');
    expect(src).toContain("withBase('/how-it-works/')");
  });

  it('the how-it-works link is labeled "See a real run"', () => {
    const src = read('src/pages/index.astro');
    expect(src).toContain('See a real run');
  });

  it('imports and renders StatusBadgeStrip', () => {
    const src = read('src/pages/index.astro');
    expect(src).toContain("import StatusBadgeStrip from '@/components/marketing/StatusBadgeStrip.astro'");
    expect(src).toContain('<StatusBadgeStrip />');
  });

  it('still retains "Read the 60-second tour →" link (no regression)', () => {
    const src = read('src/pages/index.astro');
    expect(src).toContain('Read the 60-second tour');
  });

  it('badge strip section contains badge.svg references via the component', () => {
    // The component reference is enough; we already tested the component itself.
    const src = read('src/pages/index.astro');
    expect(src).toContain('StatusBadgeStrip');
  });
});
