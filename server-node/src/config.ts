/**
 * Server configuration from the environment. None of these are `PUBLIC_` —
 * they live only in the server process. `GITHUB_TOKEN` in particular must
 * never reach the browser bundle.
 */
export const config = {
  service: 'node' as const,
  port: Number(process.env.PORT ?? 8787),
  /** `<owner>/<repo>` the GitHub proxy + feedback endpoints act on. */
  repoSlug: process.env.REPO_SLUG ?? 'ArtemioPadilla/inceptor',
  /** Server-only GitHub token. Empty → proxy runs unauthenticated, feedback 503s. */
  githubToken: process.env.GITHUB_TOKEN ?? '',
  /** Allowed CORS origin (the static site). `*` in dev. */
  corsOrigin: process.env.CORS_ORIGIN ?? '*',
  /** Optional downstream the form handlers forward to (email/CRM/webhook). */
  contactForwardUrl: process.env.CONTACT_FORWARD_URL ?? '',
  newsletterForwardUrl: process.env.NEWSLETTER_FORWARD_URL ?? '',
};

export type Config = typeof config;
