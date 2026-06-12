/**
 * Single source of truth for the canonical production origin.
 *
 * WHY a plain .mjs module, not site-meta.ts:
 *   astro.config.mjs runs in Node before Vite starts, so it cannot import
 *   TypeScript files that use `import.meta.env` (a Vite-only API).
 *   This file is intentionally dependency-free so both astro.config.mjs
 *   (static import) and src/lib/site-meta.ts (re-exported as SITE_ORIGIN)
 *   can consume the same value without duplication.
 *
 * RE-BRAND ON INSTANTIATION: change SITE_ORIGIN to your production domain.
 * Then update public/robots.txt Sitemap URL to match (or let the doctor
 * script catch it for you).
 */

/** Production origin — no trailing slash. Used for sitemap + OG tags. */
export const SITE_ORIGIN = 'https://artemiop.com';

/**
 * Canonical URL for the site root (origin + base subpath).
 * GitHub Pages project sites live at <origin>/<repo>/; root deploys use '/'.
 * The base is set at build time via ASTRO_BASE env var in the deploy workflow.
 *
 * This helper exists here so astro.config.mjs can call it before Vite starts.
 *
 * @param {string} [base='/'] - The base path (e.g. '/inceptor').
 * @returns {string} Full canonical URL (e.g. 'https://artemiop.com/inceptor').
 */
export function canonicalUrl(base = '/') {
  return `${SITE_ORIGIN}${base === '/' ? '' : base.replace(/\/$/, '')}`;
}
