# server-node — Inceptor backend archetype (Hono + Zod)

A self-hosted backend for Inceptor built on [Hono](https://hono.dev). It
**reuses the frontend's Zod schemas verbatim** (`src/schemas/`, imported via
`src/schemas.ts`) so request validation can never drift from form validation.
See [ADR 0006](../docs/decisions/0006-self-hosted-backend-archetypes.md). The
Python sibling is [`server-flask/`](../server-flask/README.md) — identical API.

## API

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/health` | Liveness probe |
| `POST` | `/api/contact` | Validate (`ContactSchema`) + deliver the contact form |
| `POST` | `/api/newsletter` | Validate (`NewsletterSchema`) + deliver a signup |
| `GET` | `/api/issues?state=&per_page=` | Token-backed GitHub issues proxy (PRs filtered) |
| `GET` | `/api/repo-stats` | Repo stars / forks / open issues |
| `POST` | `/api/feedback` | Create a GitHub issue (`FeedbackSchema`); 503 without a token |
| `GET` | `/api/openapi.json` | OpenAPI 3.1 (generated from the Zod schemas) |
| `GET` | `/api/docs` | Swagger UI |

Validation failures return `422 { error: "validation_failed", errors: [{ path, message }] }`.

## Run it

```bash
cp .env.example .env        # set GITHUB_TOKEN, CORS_ORIGIN, REPO_SLUG
npm install
npm run dev                 # tsx watch, :8787 — or `npm start`
```

Then point the static site at it: set `PUBLIC_API_BASE=http://localhost:8787`
in the repo-root `.env` and rebuild. With it unset, the site stays fully static.

Docker: `docker compose --profile backend up backend-node` from the repo root.

## Test / type-check

```bash
npm test          # vitest — handlers, validation, proxy (fetch mocked), openapi
npm run type-check
```
