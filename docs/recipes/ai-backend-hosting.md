# Recipe — Dónde corre el backend de IA

El sitio se despliega **estático** (GitHub Pages) → no puede correr Python/Flask.
Si tu feature de IA usa un backend (ver [ai-byok.md](./ai-byok.md)), tienes que
hostearlo aparte. Estas son las opciones (aprendido en FinSight).

## Decisión rápida

| Quieres… | Opción | Notas |
|---|---|---|
| Cumplir "backend en **Python**" | **Flask** en Render / Railway / Fly / Cloud Run | El `server-flask/Dockerfile` ya existe; deploy desde el repo |
| **Cero hosting**, lenguaje flexible | **Client-side en TS** (`unpdf` + `fetch` a Anthropic con `anthropic-dangerous-direct-browser-access: true`) | Todo en el sitio estático; BYOK obligatorio |
| Todo dentro de **Supabase** | **Edge Functions** (Deno/TS) | ⚠️ **No corren Python** — habría que reescribir en TS |
| Solo demo local | `npm run server:flask` / `docker compose up` | No sirve para que otros entren a la URL pública |

## ⚠️ Supabase ≠ Python
Las **Supabase Edge Functions corren en Deno (TypeScript)**, no Python. Y la
*secret key* (`sb_secret_…` / `service_role`) es para que un **servidor** acceda
a datos saltándose RLS — **no** autentica el CLI/Management API ni sirve para
desplegar. Para migraciones por CI se usa un **access token** (`sbp_…`), ver
[supabase-migrations-ci.md](./supabase-migrations-ci.md).

## Render (la vía más simple para Flask)
1. Conecta el repo en render.com → New → Web Service → Docker.
2. Root: `server-flask/` (usa su `Dockerfile`).
3. Env vars del servicio: `CORS_ORIGIN=<tu sitio>`, `ANTHROPIC_MODEL` (opcional).
   *(Con BYOK no necesitas la key de Anthropic en el servidor.)*
4. Toma la URL pública y ponla como **Actions Variable** `PUBLIC_API_BASE` en el
   repo → el deploy del frontend la inyecta (ver el workflow de deploy).

## Regla
La elección del host **no afecta** auth ni datos: la persistencia vive en el
frontend (Supabase + RLS). El backend de IA es intercambiable.
