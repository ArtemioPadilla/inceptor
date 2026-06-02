# 0006 — Self-hosted backend as an opt-in archetype (Node + Flask)

## Status

Accepted

Date: 2026-06-01

## Context

Inceptor ships as a **static** Astro site (`output: 'static'`, deployed to
GitHub Pages). Several islands and forms already assume a backend that did not
exist:

- `ContactForm` / `NewsletterForm` POST to `PUBLIC_CONTACT_ENDPOINT` /
  `PUBLIC_NEWSLETTER_ENDPOINT` — empty by default, so they sit in demo mode.
- `DashboardIsland` / `IssuesList` call `api.github.com` directly from the
  browser — capped at 60 req/h unauthenticated (Epic 6) and exposed to CORS.
- `FeedbackFAB` can only build a *prefilled issue URL*; it cannot create the
  issue, because creating one needs a token that must never reach the browser.

We want self-hostable backend capabilities **without abandoning the static
deploy**: a fork should be able to run as a pure static site (today's behavior)
*or* point at a self-hosted API server that fills these gaps.

Two runtime questions: which language/framework, and how the static frontend
discovers the backend.

## Decision

Ship the backend as an **opt-in archetype**, not a hard dependency, in two
interchangeable reference implementations under sibling directories:

- **`server-node/`** — Hono + `@hono/zod-openapi`. Imports the existing Zod
  schemas from `src/schemas/` verbatim, so the request contracts are the *same
  source of truth* the forms validate against. OpenAPI/Swagger is generated
  from those schemas.
- **`server-flask/`** — Flask + Flask-Smorest + Pydantic. A parallel Python
  implementation of the identical `/api/*` contract for teams who want Python
  on the backend. Its Pydantic models mirror the Zod schemas (no cross-language
  reuse is possible; the OpenAPI contract is the shared artifact that keeps them
  honest, asserted by a contract test).

Both expose the **same API** — `POST /api/contact`, `POST /api/newsletter`,
`GET /api/issues`, `GET /api/repo-stats`, `POST /api/feedback`,
`GET /api/openapi.json`, `GET /api/docs`, `GET /api/health` — and both run via
**either** `docker compose up` **or** a bare process (`npm run server` /
`flask --app app run`).

**Frontend discovery is a single public env var, `PUBLIC_API_BASE`:**

- **empty (default)** → the site behaves exactly as before: forms in demo mode,
  islands hit `api.github.com` directly. The GitHub Pages build is unchanged.
- **set** (e.g. `https://api.example.com`) → `src/lib/api.ts` routes form POSTs
  and GitHub reads through the backend instead.

Secrets (`GITHUB_TOKEN`) live **only** in the server's environment, never in a
`PUBLIC_` var.

### Rejected alternatives

- **Astro SSR via `@astrojs/node`** — would convert the project off the static
  GitHub Pages deploy that is core to the template's "free, no-server demo"
  story. The backend must be *optional*; a separate service keeps it so.
- **One runtime only** — the user explicitly wanted both Node and Flask as
  selectable archetypes (the template ships archetypes; backend is one).
- **Serverless functions (Workers/Lambda)** — not "self-hosted"; documented as
  a future deploy target instead.

## Consequences

**Positive**

- The static demo keeps working with zero backend; self-hosting is one env var.
- Form contracts in `server-node/` are the literal `src/schemas/` Zod objects —
  no drift between client validation and server validation.
- The GitHub proxy removes the 60 req/h ceiling and the CORS exposure, and lets
  `FeedbackFAB` create real issues.
- Two archetypes demonstrate the "same contract, different runtime" pattern the
  template is meant to teach.

**Negative**

- Two server implementations to maintain. Mitigated by a shared OpenAPI
  contract + a contract test that diffs both servers' `/api/openapi.json`
  against a checked-in golden spec.
- Python enters the repo (previously TS-only). Confined to `server-flask/` with
  its own tooling (`requirements.txt`, `ruff`, `pytest`); the main `npm run
  check` does not depend on it.

**Neutral**

- `docker-compose.yml` gains a `backend` service (profile-gated so it's
  off unless `--profile backend` is requested).
- A `/demos/api` page documents the contract and links Swagger UI (Epic 16).

## Supersedes

None.

## References

- Related ADRs: [0005](./0005-base-ui-component-library.md) (component library
  archetype), [0002](./0002-base-ui-over-radix.md)
- ROADMAP Epic 10 (backend archetype, `@hono/zod-openapi`) and Epic 16
  (`/demos/api`)
- Hono: <https://hono.dev> · zod-openapi: <https://github.com/honojs/middleware/tree/main/packages/zod-openapi>
- Flask-Smorest: <https://flask-smorest.readthedocs.io>
