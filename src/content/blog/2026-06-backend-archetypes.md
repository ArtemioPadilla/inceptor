---
title: "Self-hosted backend archetypes: Hono + Flask, one OpenAPI contract"
description: How PR #109 added opt-in server archetypes without changing the static-first default.
pubDate: 2026-06-05
tags:
  - changelog
  - backend
  - architecture
author: artemiopadilla
---

PR #109 shipped two opt-in backend archetypes: `server-node/` (Hono + TypeScript)
and `server-flask/` (Flask + Python), both implementing the same `/api/*` contract
derived from a single Zod schema. ADR 0006 documents the decision.

## The problem

The scaffold is fully static by default: forms run in demo mode, GitHub reads hit
`api.github.com` directly (60 req/h cap), and the FeedbackFAB can only create
issues if the user has a token in scope. For real deployments, you want:

- A token proxy so GitHub API calls don't hit rate limits
- A server-side contact and newsletter handler (no third-party form service)
- An endpoint the FeedbackFAB can post to without exposing a GitHub token in the browser

## The solution

`PUBLIC_API_BASE` env var. When unset (default), everything stays static. When set
to a running backend origin (e.g. `http://localhost:8787`), `src/lib/api.ts` routes
calls through the backend instead of hitting the APIs directly.

The contract: `server-node/src/routes/` and `server-flask/app/routes/` both implement:

```
POST /api/contact       — contact form → email/Sendgrid/whatever
POST /api/newsletter    — email subscribe → Buttondown/ConvertKit/whatever  
POST /api/feedback      — FeedbackFAB → GitHub issue (uses server-side GITHUB_TOKEN)
GET  /api/github/issues — GitHub Issues proxy (authenticated, no rate-limit cap)
GET  /api/health        — health check
```

Both expose `/api/openapi.json` — an OpenAPI 3.0 spec generated from the same Zod
schemas used on the frontend. The Hono backend uses `@hono/zod-openapi`; the Flask
backend uses `flask-openapi3` + `pydantic` mirroring the same schema shape.

## Why two runtimes?

The scaffold serves as a reference for teams who might deploy on different platforms:

- **Hono** is the natural fit for Cloudflare Workers, Deno Deploy, Node.js, and Bun.
  It's TypeScript-native and reuses the same Zod schemas the frontend uses.
- **Flask** demonstrates that the backend is not tied to the frontend's runtime.
  A Python team can run `server-flask/` with Docker compose and get the same API
  surface.

Both are opt-in. Neither is required. The scaffold stays fully static without them.

## The "one OpenAPI contract" principle

ADR 0006's key constraint: **the contract is defined once, not twice**. The Hono
backend defines it via `@hono/zod-openapi`; the Flask backend implements against
the same spec. If the contract changes, both backends update.

The schemas live in `src/schemas/` on the frontend and are mirrored (or referenced
via the OpenAPI spec) in the backends. A type mismatch between frontend expectations
and backend response is a build-time error, not a runtime surprise.

## Running locally

```bash
# Hono (Node.js)
cd server-node && npm install && npm run dev
# → http://localhost:8787

# Flask (Docker)
docker compose up server-flask
# → http://localhost:8788

# Tell the frontend
PUBLIC_API_BASE=http://localhost:8787 npm run dev
```

`docker-compose.yml` at the root wires both backends and the Astro dev server
together for a full-stack local session.

## What's not included

The backends don't include: authentication (add your own middleware), databases
(add Drizzle/SQLAlchemy), queue workers, or cron jobs. These are per-project
additions. The goal was a minimal, working API surface that demonstrates the pattern
without locking you into a specific backend framework beyond what you need.
