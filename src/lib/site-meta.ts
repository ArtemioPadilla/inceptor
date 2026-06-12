/**
 * ⚠️ RE-BRAND ON INSTANTIATION — single source of the site's machine-readable
 * identity.
 *
 * Everything an external agent (LLM crawler, search engine, tooling) learns
 * about this site flows from this object: /llms.txt, /llms-full.txt, the
 * JSON-LD blocks (WebSite, SoftwareSourceCode, Article, BreadcrumbList), and
 * the default <meta name="description">.
 *
 * If you are an agent instantiating a project FROM this template (via
 * create-inceptor-app or a fork): update every field below to the new
 * project's identity, or the new site will introduce itself to the world as
 * "Inceptor". `repoSlug` honors PUBLIC_REPO_SLUG so CI/fork setups can
 * override without an edit. See CLAUDE.md § "Agent-readable surface".
 */

/**
 * Canonical production origin — must match SITE_ORIGIN in /site.config.mjs.
 *
 * WHY declared twice (here + site.config.mjs):
 *   astro.config.mjs runs in Node before Vite starts, so it cannot import
 *   TypeScript files that use `import.meta.env`. Both files declare the same
 *   string; the vitest in src/tests/site-meta.test.ts and the doctor script
 *   assert they are in sync so a stale one-sided edit is caught immediately.
 *
 * RE-BRAND: update this AND SITE_ORIGIN in /site.config.mjs to your domain.
 */
export const SITE_ORIGIN = 'https://artemiop.com';
export const SITE = {
  /** Product name as it should appear to agents and search engines. */
  name: 'Inceptor',
  /** One-line positioning (used as the default meta description). */
  description:
    'Issue-driven web template: a governed, agent-orchestrated way of building — ' +
    'issue → Claude Code → PR → merge → deploy — on Astro 5 + React 19 islands, ' +
    'with quality and ethics gates enforced by the repo.',
  /** owner/repo on GitHub. */
  repoSlug: (import.meta.env.PUBLIC_REPO_SLUG as string | undefined) ?? 'ArtemioPadilla/inceptor',
  /** SPDX license id of the codebase. */
  license: 'MIT',
  /** Languages an agent should expect in the source. */
  programmingLanguages: ['TypeScript', 'Astro', 'CSS'],
} as const;

/** Absolute repo URL derived from the slug. */
export const REPO_URL = `https://github.com/${SITE.repoSlug}`;

/** Absolute site origin + base (e.g. https://artemiop.com/inceptor). */
export function siteUrl(site: URL | undefined, base: string): string {
  const origin = (site ?? new URL('https://localhost')).origin;
  return `${origin}${base.replace(/\/$/, '')}`;
}
