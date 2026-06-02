---
title: Self-hosted backend
description: "The opt-in backend archetypes (Node/Hono + Flask/Pydantic): one /api contract, two runtimes, zero impact on the static deploy."
---

Inceptor deploys as a **static** site, but several islands assume a backend:
the contact and newsletter forms POST somewhere, the dashboard reads GitHub
(capped at 60 req/h unauthenticated), and the FeedbackFAB can only build a
prefilled issue *URL*. The self-hosted backend fills those gaps — **without
giving up the static deploy**. It is entirely opt-in.

See [ADR 0006](https://github.com/ArtemioPadilla/inceptor/blob/main/docs/decisions/0006-self-hosted-backend-archetypes.md)
for the decision record.

## The one switch: `PUBLIC_API_BASE`

Everything keys off a single public env var, resolved in
[`src/lib/api.ts`](https://github.com/ArtemioPadilla/inceptor/blob/main/src/lib/api.ts):

- **unset (default)** — static mode. Forms validate + log (demo mode); the
  GitHub islands hit `api.github.com` directly. The GitHub Pages build is
  exactly as before.
- **set** (`https://api.example.com`) — forms POST to the backend's
  `/api/contact` · `/api/newsletter`, and the islands read through
  `/api/issues` (authenticated, no rate cap).

Server secrets (`GITHUB_TOKEN`, …) live only in `server-*/.env` — **never** in
a `PUBLIC_` var, which would inline them into the browser bundle.

## Two archetypes, one contract

| | `server-node/` | `server-flask/` |
|---|---|---|
| Runtime | Hono (TypeScript) | Flask (Python) |
| Validation | **reuses** `src/schemas/*.ts` (Zod) | Pydantic mirror of the same rules |
| OpenAPI | `z.toJSONSchema()` | `model_json_schema()` |
| Port (docker) | `:8787` | `:8788` |

Both expose the identical API:

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/health` | Liveness probe |
| `POST` | `/api/contact` | Validate + deliver the contact form |
| `POST` | `/api/newsletter` | Validate + deliver a signup |
| `GET` | `/api/issues?state=&per_page=` | GitHub issues proxy (PRs filtered) |
| `GET` | `/api/repo-stats` | Stars / forks / open issues |
| `POST` | `/api/feedback` | Create a real GitHub issue (503 without a token) |
| `GET` | `/api/openapi.json` · `/api/docs` | OpenAPI 3.1 + Swagger UI |

Validation failures return `422 { error: "validation_failed", errors: [{ path, message }] }`
from **both** servers. The committed
[`server-node/openapi.golden.json`](https://github.com/ArtemioPadilla/inceptor/blob/main/server-node/openapi.golden.json)
is the cross-runtime contract — both test suites assert their generated spec's
surface against it, so the two implementations can't silently drift.

## Run it

### Bare process

```bash
# Node
cd server-node && cp .env.example .env && npm install && npm run dev   # :8787
# Flask
cd server-flask && python -m venv .venv && . .venv/bin/activate \
  && pip install -r requirements-dev.txt && cp .env.example .env \
  && flask --app app run --port 8787
```

### Docker

```bash
docker compose --profile backend       up   # both (node :8787, flask :8788)
docker compose --profile backend-node  up   # just Hono
docker compose --profile backend-flask up   # just Flask
```

Then activate it from the static site:

```bash
echo 'PUBLIC_API_BASE=http://localhost:8787' >> .env
npm run build && npm run preview
```

Visit [`/demos/api`](/demos/api) — it reflects whether a backend is wired and
links to the live Swagger UI.

## Add an endpoint

1. Add (or reuse) the contract in `src/schemas/` so the **frontend** owns it.
2. `server-node/`: re-export it in `src/schemas.ts`, add a route under
   `src/routes/`, register it in `src/app.ts`, extend `src/openapi.ts`, then
   `npm run gen:openapi` to refresh the golden.
3. `server-flask/`: mirror the model in `schemas.py`, add the route in
   `app.py`, extend `openapi.py`.
4. Tests in both (`server-node/test/`, `server-flask/tests/`) — the contract
   test will fail until both surfaces match the regenerated golden.
