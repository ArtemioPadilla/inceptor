---
title: Environment variables
description: Secrets and feature flags the scaffold expects.
---

All env vars live in `.env` locally. Copy `.env.example` to `.env` to get started.
In production, set them in your deploy host (Cloudflare Pages, Netlify, Vercel) or
as GitHub Actions secrets.

`PUBLIC_` prefix = inlined into the browser bundle at build time. Never put real
secrets in a `PUBLIC_` var.

## Build metadata

| Variable | Default | Purpose |
|---|---|---|
| `PUBLIC_CHANNEL` | `development` | Release channel: `production` / `preview` / `development` |
| `PUBLIC_BUILD_SHA` | (empty) | Git SHA — CI injects from `$GITHUB_SHA` |
| `PUBLIC_VERSION` | (empty) | Package version — CI injects from `package.json` |

## Repo wiring

| Variable | Default | Purpose |
|---|---|---|
| `PUBLIC_REPO_SLUG` | `ArtemioPadilla/inceptor` | Where FeedbackFAB files issues (`<owner>/<repo>`) |

## Feature flags

All flags accept: `true` / `false` / `1` / `0` / `on` / `off` / `yes` / `no`.
Defaults are coded in `src/lib/flags.ts`.

| Variable | Default | Purpose |
|---|---|---|
| `PUBLIC_FLAG_EXPERIMENTAL_GALLERY` | `false` | Enable experimental gallery entries |
| `PUBLIC_FLAG_FEEDBACK_FAB` | `true` | Show the FeedbackFAB on every page |
| `PUBLIC_FLAG_BLOG` | `true` | Enable `/blog` route; set `false` to hide |
| `PUBLIC_FLAG_DOCS_SEARCH` | `true` | Enable Pagefind search in `/docs` |
| `PUBLIC_FLAG_PWA_PROMPTS` | `true` | Show PWA install + update prompts |

## Self-hosted backend (opt-in, ADR 0006)

| Variable | Default | Purpose |
|---|---|---|
| `PUBLIC_API_BASE` | (empty) | Origin of `server-node/` or `server-flask/`. Unset = fully static mode |

When `PUBLIC_API_BASE` is set, forms + GitHub reads route through the backend
(token proxy, no API cap). The server's own secrets (`GITHUB_TOKEN`, etc.) live
in `server-*/.env`, never in a `PUBLIC_` var.

## Contact + newsletter

| Variable | Default | Purpose |
|---|---|---|
| `PUBLIC_CONTACT_ENDPOINT` | (empty) | URL for JSON-accepting contact handler |
| `PUBLIC_NEWSLETTER_ENDPOINT` | (empty) | URL for `{ email }` subscribe handler |

## Error monitoring (Sentry, off by default)

| Variable | Default | Purpose |
|---|---|---|
| `PUBLIC_FLAG_SENTRY` | `false` | Enable Sentry — install `@sentry/browser` first |
| `PUBLIC_SENTRY_DSN` | (empty) | Sentry DSN string |

## Analytics (off by default)

| Variable | Default | Purpose |
|---|---|---|
| `PUBLIC_FLAG_ANALYTICS` | `false` | Enable analytics injection |
| `PUBLIC_ANALYTICS_PROVIDER` | `plausible` | `plausible` or `umami` |
| `PUBLIC_ANALYTICS_DOMAIN` | (empty) | Domain to track |
| `PUBLIC_ANALYTICS_SCRIPT_URL` | (empty) | Override default provider script URL |

## GitHub Actions secrets

For CI, set these as repository secrets (Settings → Secrets and variables → Actions):

- `ANTHROPIC_API_KEY` — Claude triage (if the orchestration workflow runs in CI)
- Deployment credentials vary by host (see your provider's docs)

Canonical source → [`.env.example`](https://github.com/ArtemioPadilla/inceptor/blob/main/.env.example)
