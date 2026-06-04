# Recipe — Migraciones de Supabase + env públicas por CI

Aplicar el esquema de la DB y desplegar el frontend con sus variables públicas,
todo por GitHub Actions. Validado en FinSight AI.

## A. Migraciones de DB por CI

Estructura:
```
supabase/
  config.toml                 # project_id = "<tu-proyecto>"
  migrations/0001_init.sql     # tablas + RLS (ver auth-supabase.md)
```

Workflow `.github/workflows/supabase.yml`:
```yaml
name: Supabase migrations
on:
  push:
    branches: [main]
    paths: ['supabase/migrations/**', '.github/workflows/supabase.yml']
  workflow_dispatch:
jobs:
  migrate:
    runs-on: ubuntu-latest
    env:
      SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
      SUPABASE_DB_PASSWORD: ${{ secrets.SUPABASE_DB_PASSWORD }}
      PROJECT_REF: <tu-project-ref>          # público, vive en la URL del proyecto
    steps:
      - uses: actions/checkout@v6
      - uses: supabase/setup-cli@v1
        with: { version: latest }
      - run: supabase link --project-ref "$PROJECT_REF" -p "$SUPABASE_DB_PASSWORD"
      - run: supabase db push -p "$SUPABASE_DB_PASSWORD"
```

**Secrets que pone el usuario** (Settings → Secrets and variables → Actions → Secrets):
- `SUPABASE_ACCESS_TOKEN` — supabase.com → Account → **Access Tokens** (`sbp_…`).
  *No es la secret key del proyecto* (`sb_secret_…`); esa no autentica el CLI.
- `SUPABASE_DB_PASSWORD` — Project Settings → Database.

> Córrelos así (el prompt es oculto, no queda en el historial):
> `gh secret set SUPABASE_ACCESS_TOKEN --repo <owner>/<repo>`

## B. Inyectar env públicas en el deploy

En `deploy.yml`, paso de build:
```yaml
- name: Build
  run: npm run build
  env:
    ASTRO_BASE: ${{ secrets.ASTRO_BASE || '/<repo>' }}
    PUBLIC_SUPABASE_URL: ${{ vars.PUBLIC_SUPABASE_URL }}
    PUBLIC_SUPABASE_ANON_KEY: ${{ vars.PUBLIC_SUPABASE_ANON_KEY }}
    PUBLIC_API_BASE: ${{ vars.PUBLIC_API_BASE }}     # si hosteas un backend
```

Estas son **Actions *Variables*** (no Secrets), porque son públicas (la anon key
es segura, RLS protege). Configúralas con:
```bash
gh variable set PUBLIC_SUPABASE_URL --body "https://<ref>.supabase.co"
gh variable set PUBLIC_SUPABASE_ANON_KEY --body "sb_publishable_…"
```

## Resultado
Push a `main` → el frontend se redespliega con sus env, y si tocaste
`supabase/migrations/**`, el esquema se aplica solo. Cero pasos manuales.
