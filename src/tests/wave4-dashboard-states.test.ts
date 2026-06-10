import { beforeAll, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

// Source-level guards for Wave 4 (dashboard states + view-source links).
// Each assertion pins a specific code-level property so regressions are caught
// at the test layer before a deploy.

const read = (p: string) => readFileSync(new URL(`../../${p}`, import.meta.url), 'utf-8');

// ── 1. DashboardIsland — rate-limit error card ────────────────────────────────

describe('DashboardIsland — rate-limit error', () => {
  let island: string;
  beforeAll(() => { island = read('src/components/islands/DashboardIsland.tsx'); });

  it('defines GitHubApiError with a status field', () => {
    expect(island).toContain('GitHubApiError');
    expect(island).toContain('readonly status: number');
  });

  it('captures X-RateLimit-Reset header from the response', () => {
    expect(island).toContain('X-RateLimit-Reset');
    // The header value is parsed as an integer
    expect(island).toContain('parseInt(resetHeader, 10)');
  });

  it('checks for 403 or 429 status to classify rate-limit errors', () => {
    expect(island).toContain('403');
    expect(island).toContain('429');
  });

  it('renders a RateLimitErrorCard component', () => {
    expect(island).toContain('RateLimitErrorCard');
  });

  it('renders "60 requests per hour" copy in rate-limit card', () => {
    expect(island).toContain('60 requests per hour');
  });

  it('renders "resets in approximately" copy for the reset countdown', () => {
    expect(island).toContain('resets in approximately');
  });

  it('computes reset minutes at render time using Date.now()', () => {
    // The resetMinutes helper (or inline expression) must reference Date.now()
    // so the countdown reflects actual elapsed time, not the throw-time snapshot.
    expect(island).toContain('Date.now()');
  });

  it('references PUBLIC_API_BASE in the rate-limit card copy', () => {
    expect(island).toContain('PUBLIC_API_BASE');
  });
});

// ── 2. DashboardIsland — celebratory inbox-zero empty state ──────────────────

describe('DashboardIsland — inbox-zero empty state', () => {
  let island: string;
  beforeAll(() => { island = read('src/components/islands/DashboardIsland.tsx'); });

  it('renders inbox zero copy when open issues count is 0', () => {
    expect(island).toContain('inbox zero');
  });

  it('uses a celebratory emoji for the inbox-zero state', () => {
    expect(island).toContain('🎉');
  });

  it('guards inbox-zero rendering on openIssues.length === 0', () => {
    // The condition must check the count, not just `bothEmpty`
    expect(island).toMatch(/openIssues\.length\s*===\s*0/);
  });
});

// ── 3. View-source links on demo pages ───────────────────────────────────────

describe('view-source links', () => {
  const GITHUB_BLOB = 'https://github.com/ArtemioPadilla/inceptor/blob/main';

  it('dashboard.astro has a view-source link to itself', () => {
    const src = read('src/pages/demos/dashboard.astro');
    expect(src).toContain(`${GITHUB_BLOB}/src/pages/demos/dashboard.astro`);
    expect(src).toContain('View source');
  });

  it('dashboard.astro also links to DashboardIsland.tsx', () => {
    const src = read('src/pages/demos/dashboard.astro');
    expect(src).toContain(`${GITHUB_BLOB}/src/components/islands/DashboardIsland.tsx`);
  });

  it('data.astro has a view-source link', () => {
    const src = read('src/pages/demos/data.astro');
    expect(src).toContain(`${GITHUB_BLOB}/src/pages/demos/data.astro`);
    expect(src).toContain('View source');
  });

  it('data/large.astro has a view-source link', () => {
    const src = read('src/pages/demos/data/large.astro');
    expect(src).toContain(`${GITHUB_BLOB}/src/pages/demos/data/large.astro`);
    expect(src).toContain('View source');
  });

  it('settings.astro has a view-source link', () => {
    const src = read('src/pages/demos/settings.astro');
    expect(src).toContain(`${GITHUB_BLOB}/src/pages/demos/settings.astro`);
    expect(src).toContain('View source');
  });

  it('api.astro has a view-source link', () => {
    const src = read('src/pages/demos/api.astro');
    expect(src).toContain(`${GITHUB_BLOB}/src/pages/demos/api.astro`);
    expect(src).toContain('View source');
  });

  it('all view-source links open in a new tab with noopener', () => {
    const demoFiles = [
      'src/pages/demos/dashboard.astro',
      'src/pages/demos/data.astro',
      'src/pages/demos/data/large.astro',
      'src/pages/demos/settings.astro',
      'src/pages/demos/api.astro',
    ];
    for (const file of demoFiles) {
      const src = read(file);
      // Every external link (to github.com) must use target="_blank" + noopener
      expect(src, `${file} should use target="_blank"`).toContain('target="_blank"');
      expect(src, `${file} should use rel="noopener noreferrer"`).toContain('rel="noopener noreferrer"');
    }
  });
});

// ── 4. COMPONENTS.md — data-fetching states section ──────────────────────────

describe('COMPONENTS.md — data-fetching states section', () => {
  let docs: string;
  beforeAll(() => { docs = read('docs/COMPONENTS.md'); });

  it('contains a section about data-fetching states', () => {
    expect(docs).toContain('Data-fetching states');
  });

  it('documents the loading=Skeleton pattern', () => {
    expect(docs).toContain('Skeleton');
    expect(docs).toContain('Loading');
  });

  it('documents the error=structured card with retry-after pattern', () => {
    expect(docs).toContain('RateLimitErrorCard');
    expect(docs).toContain('retry');
  });

  it('documents the empty=celebratory pattern', () => {
    expect(docs).toContain('celebratory');
    expect(docs).toContain('empty');
  });

  it('includes a file pointer to DashboardIsland.tsx', () => {
    expect(docs).toContain('DashboardIsland.tsx');
  });
});
