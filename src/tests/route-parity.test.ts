/**
 * Route parity test (issue #186).
 *
 * ## What this tests
 * Every page that exists under `src/pages/es/` must map to a real EN route.
 * An orphan ES page — one without a corresponding English source — means
 * either the EN page was deleted (without removing the translation) or the ES
 * page was created by mistake. Both are caught here at CI time.
 *
 * ## What this does NOT enforce
 * It is intentional that many EN routes have NO ES equivalent. The site ships
 * only the top-level ES pages (index, gallery, docs) as translated landing
 * pages. All deeper routes (/demos, /blog, /contact, etc.) are English-only
 * by design. Those are listed in EN_ONLY_ALLOWLIST below.
 *
 * ## Methodology: build-time data emitter vs runtime consumer
 * This file is a *build-time data emitter* test: it reads the file system
 * (Vite's `import.meta.glob` resolves at build/test time) and derives facts
 * about the route structure. No server is started; no HTML is fetched. The
 * pattern is documented in docs/patterns/parity-tests.md.
 */

import { describe, it, expect } from 'vitest';

// ── File-system page discovery ─────────────────────────────────────────────
// import.meta.glob is resolved by Vite at transform time; the glob runs in the
// test runner's module context so paths are relative to this file's location.

const allEnPages = import.meta.glob('../pages/**/*.{astro,md,mdx}', { eager: false });
const allEsPages = import.meta.glob('../pages/es/**/*.{astro,md,mdx}', { eager: false });

/**
 * Intentionally English-only routes — ES translations are out of scope for
 * the current sprint. Add a route here (relative to src/pages, leading slash,
 * no extension) when you explicitly decide not to translate it.
 *
 * Use the route as it appears from toRoute() — typically the stem without
 * extension, with index files already normalized to the parent path.
 *
 * Maintenance: if you add a new top-level page and have no ES translation yet,
 * add it here so the parity test does not block CI.
 */
const EN_ONLY_ALLOWLIST = new Set([
  // Deep app routes — interactive demos, not marketing copy
  '/demos',
  '/demos/api',
  '/demos/dashboard',
  '/demos/data',
  '/demos/data/large',
  '/demos/settings',
  // Blog — placeholder content, out of scope for i18n
  '/blog',
  // Dynamic blog posts (dynamic segment — won't appear as a static glob key)
  '/blog/[...slug]',
  // Utility / reference pages
  '/contact',
  '/how-it-works',
  '/404',
  // Gallery — shared across locales; individual component pages are EN-only
  '/gallery',
  '/gallery/[component]',
  // Docs — content-heavy, shared across locales; only the landing is translated
  '/docs/[...slug]',
]);

// ── Helpers ────────────────────────────────────────────────────────────────

/** Normalize a glob key to a route-like path without extension. */
function toRoute(globKey: string): string {
  // globKey example: "../pages/es/gallery.astro"
  // Strip leading "../pages" and extension → "/es/gallery"
  const rel = globKey.replace(/^\.\.\/pages/, '').replace(/\.(astro|mdx?|tsx?)$/, '');
  // Normalize "/index" → "/"
  return rel.endsWith('/index') ? rel.slice(0, -'/index'.length) || '/' : rel;
}

/** Strip the "/es" locale prefix to get the EN equivalent. */
function toEnRoute(esRoute: string): string {
  return esRoute.replace(/^\/es/, '') || '/';
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('route parity — ES pages must map to real EN routes', () => {
  const enRoutes = new Set(Object.keys(allEnPages).map(toRoute));
  const esRoutes = Object.keys(allEsPages).map(toRoute);

  /**
   * Check whether `candidate` is covered by the set of EN routes. A dynamic
   * route like `/docs/[...slug]` covers any `/docs/*` path, including `/docs`
   * itself. We check both exact match and prefix-coverage by a catch-all.
   */
  function isCoveredByEnRoute(candidate: string): boolean {
    if (enRoutes.has(candidate)) return true;
    // Check whether any dynamic EN route is a prefix of the candidate
    for (const enRoute of enRoutes) {
      if (!enRoute.includes('[')) continue;
      // /docs/[...slug] → prefix "/docs"
      const prefix = enRoute.replace(/\/\[.*$/, '');
      if (candidate === prefix || candidate.startsWith(prefix + '/')) return true;
    }
    return false;
  }

  it('every /es/* page has a corresponding EN route', () => {
    const orphans: string[] = [];

    for (const esRoute of esRoutes) {
      const enEquivalent = toEnRoute(esRoute);
      if (!isCoveredByEnRoute(enEquivalent)) {
        orphans.push(`${esRoute} → expected EN: ${enEquivalent}`);
      }
    }

    expect(
      orphans,
      `Orphan ES pages found (no matching EN route):\n${orphans.join('\n')}`,
    ).toEqual([]);
  });

  it('allowlist documents intentionally EN-only routes that exist as files', () => {
    // Every route in the allowlist should actually exist as a file (or be
    // covered by a dynamic catch-all). If a static file was deleted, its
    // allowlist entry should also be removed to keep the list honest.
    const nonExistentAllowlist: string[] = [];

    for (const allowedRoute of EN_ONLY_ALLOWLIST) {
      const exists =
        isCoveredByEnRoute(allowedRoute) ||
        // Dynamic routes like /gallery/[component] may resolve only as the
        // raw glob key — also check by looking for any file with that pattern
        Array.from(enRoutes).some((r) => r === allowedRoute);

      if (!exists) {
        nonExistentAllowlist.push(allowedRoute);
      }
    }

    expect(
      nonExistentAllowlist,
      `Allowlist entries with no matching file (stale — remove them):\n${nonExistentAllowlist.join('\n')}`,
    ).toEqual([]);
  });
});
