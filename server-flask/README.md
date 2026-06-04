# server-flask — Inceptor backend archetype (Flask + Pydantic)

A self-hosted backend for Inceptor built on [Flask](https://flask.palletsprojects.com)
+ [Pydantic](https://docs.pydantic.dev). It exposes the **same `/api/*` contract**
as the TypeScript sibling [`server-node/`](../server-node/README.md); the
[OpenAPI golden contract](../server-node/openapi.golden.json) keeps the two
honest (asserted by both test suites). See
[ADR 0006](../docs/decisions/0006-self-hosted-backend-archetypes.md).

Because Python can't import the frontend's Zod schemas, the Pydantic models in
`schemas.py` mirror `src/schemas/*.ts` field-for-field (lengths, honeypot,
trimming).

## API

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/health` | Liveness probe |
| `POST` | `/api/contact` | Validate (`ContactModel`) + deliver the contact form |
| `POST` | `/api/newsletter` | Validate (`NewsletterModel`) + deliver a signup |
| `GET` | `/api/issues?state=&per_page=` | Token-backed GitHub issues proxy (PRs filtered) |
| `GET` | `/api/repo-stats` | Repo stars / forks / open issues |
| `POST` | `/api/feedback` | Create a GitHub issue (`FeedbackModel`); 503 without a token |
| `GET` | `/api/openapi.json` | OpenAPI 3.1 (generated from the Pydantic models) |
| `GET` | `/api/docs` | Swagger UI |

Validation failures return `422 { error: "validation_failed", errors: [{ path, message }] }`.

## Run it — one command

Desde la raíz del repo:

```bash
npm run server:flask                          # crea venv (Python 3.11–3.13) + instala + corre
docker compose --profile backend-flask up     # o vía Docker (no depende de tu Python)
```

> Necesita **Python 3.11–3.13** (3.14 aún no trae wheels de `pydantic-core`).
> Si tu `python3` es 3.14, usa la vía Docker.

### Manual

```bash
python3.12 -m venv .venv && source .venv/bin/activate
pip install -r requirements-dev.txt
cp .env.example .env             # set GITHUB_TOKEN, CORS_ORIGIN, REPO_SLUG
flask --app app run --port 8787  # dev — or: python app.py
```

Production: `gunicorn -b 0.0.0.0:8787 'app:create_app()'`.

Point the static site at it: `PUBLIC_API_BASE=http://localhost:8787` in the
repo-root `.env`, then rebuild. Docker:
`docker compose --profile backend up backend-flask` from the repo root.

## Test / lint

```bash
pytest          # parity tests + the golden-contract assertion
ruff check .
```
