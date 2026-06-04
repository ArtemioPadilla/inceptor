# Inceptor DX — plan de mejora (lecciones de FinSight AI)

FinSight AI fue el **primer producto real construido sobre Inceptor**. Su
construcción (auth, upload de PDF, IA, categorización, deploy) reveló que
Inceptor está optimizado para **mantener el repo-scaffold**, no para
**"instanciar y enviar un producto nuevo"**. Este plan cierra ese hueco.

Convención: **Epic → Historia → Tarea**. Marca `[x]` al completar; cada Historia
referencia su PR al cerrarse. Olas de entrega al final.

> Estado: documento creado. Implementación en curso (ver "Olas").

---

## Epic A — Instanciación *lean* (`create-inceptor-app`)

**Problema:** instanciar un proyecto hoy es copia-selectiva manual (excluir
galería/showcase/blog/demos, recortar `ui/` de ~60→~18, renombrar, limpiar
branding). Frágil y deja restos.

### Historia A1 — Script de init que genera un proyecto mínimo
- [ ] `scripts/init.mjs` (+ `npm run init`) que copia a un destino un subconjunto *core*
- [ ] Flags: `--name`, `--archetype <static|backend-node|backend-flask|supabase>`, `--out <dir>`
- [ ] Excluye galería, showcase, blog, demos, `INTEGRATION-PLAN.md`, historia
- [ ] Incluye set *core* de `ui/` (~12) + `lib/` + `stores/theme` + layout + landing mínima
- [ ] Deja el árbol con `npm run check` verde out-of-the-box

### Historia A2 — Parametrizar nombre / slug / base (de-brand)
- [ ] Reemplazar nombre de proyecto, `package.json` name, `PUBLIC_REPO_SLUG`, `ASTRO_BASE`
- [ ] Cero referencias "Inceptor" en el proyecto generado
- [ ] README/CLAUDE/ROADMAP plantilla con placeholders rellenados

### Historia A3 — Kit `ui/` *core + add*
- [ ] Definir el set *core* mínimo (button, input, label, form, card, table, dialog, callout, skeleton, badge, separator, spinner)
- [ ] `npm run new-component` añade desde Base UI on-demand (alinear con Epic 18)
- [ ] Documentar "empieza lean, añade cuando lo necesites"

---

## Epic B — Receta Auth + DB (Supabase)

**Problema:** todo producto real necesita auth + datos; Inceptor no lo trae.
En FinSight se construyó desde cero.

### Historia B1 — Recipe doc + código de referencia
- [ ] `docs/recipes/auth-supabase.md` (copy-paste) con el flujo completo
- [ ] `src/lib/supabase.ts` guardado (no rompe build sin env)
- [ ] `src/stores/auth.ts` (sesión cross-island con Nano Stores)
- [ ] Islas `LoginForm` / `RegisterForm` / `AuthNav` (react-hook-form + zod)

### Historia B2 — Patrón de datos + RLS
- [ ] Migración ejemplo con RLS (`auth.uid() = user_id`, `default auth.uid()`)
- [ ] Documentar el patrón **"frontend escribe con la sesión + RLS, sin service key"**
- [ ] ADR plantilla de la decisión (Supabase + stateless backend)

---

## Epic C — Receta feature de IA (BYOK)

**Problema:** apps con IA son cada vez más comunes; no hay patrón en Inceptor.
FinSight inventó BYOK + server stateless + mock en tests.

### Historia C1 — Recipe BYOK
- [ ] `docs/recipes/ai-byok.md` — patrón BYOK (key del usuario → `sessionStorage` → header → uso transitorio)
- [ ] `src/stores/apiKey.ts` + isla `ApiKeyField` de referencia
- [ ] Helper `callClaude` aislado (mockeable) + patrón de test (monkeypatch)

### Historia C2 — Guía de hosting del backend de IA
- [ ] `docs/recipes/ai-backend-hosting.md` — local / Render / Cloud Run
- [ ] Nota explícita: *Supabase Edge Functions = Deno, no Python*
- [ ] Tabla de decisión (requisito de Python vs cero-hosting)

---

## Epic D — DX del backend local

**Problema:** levantar el venv de Flask es molesto; Python 3.14 rompe wheels.

### Historia D1 — Backend de un comando ✅ (Ola 1)
- [x] `npm run server:flask` → `scripts/dev-flask.sh` (detecta Python 3.11–3.13); `server:node` también
- [x] `docker compose --profile backend-flask up` documentado en el README
- [x] `.dockerignore` en `server-flask/` y `server-node/`
- [x] Rango de Python (3.11–3.13) documentado en `server-flask/README.md`

---

## Epic E — Portabilidad de fork & footguns

**Problema:** cosas que rompen al forkear Inceptor.

### Historia E1 — `report-issue` lee el slug del entorno ✅ (Ola 1)
- [x] `src/lib/report-issue.ts` usa `PUBLIC_REPO_SLUG` (fallback al slug del template)

### Historia E2 — `tsconfig` portable ✅ (Ola 1)
- [x] Comentario en `tsconfig.json`: `ignoreDeprecations: "6.0"` es de TS 6; un fork en TS 5.x debe quitarlo (lo maneja `create-inceptor-app`)

### Historia E3 — `env.d.ts` a prueba de olvidos ✅ (Ola 1)
- [x] `npm run doctor` verifica que `src/env.d.ts` existe

---

## Epic F — Patrones de CI/CD de backend

**Problema:** `deploy.yml` no inyecta env públicas ni hay workflow de migraciones.

### Historia F1 — Inyección de env públicas en deploy
- [ ] Documentar/plantilla: inyectar `PUBLIC_*` desde *Actions Variables* en `deploy.yml`

### Historia F2 — Workflow de migraciones (template)
- [ ] `docs/recipes/supabase-migrations-ci.md` + plantilla `supabase.yml` (`db push`)
- [ ] Guía de qué secrets pone el usuario (`SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD`)

---

## Epic G — Issues como guías

**Problema:** los issues detallados (con desglose de tareas) hacen que `/goal`
ejecute mejor; no hay template para ese formato.

### Historia G1 — Template de "historia" ✅ (Ola 1)
- [x] `.github/ISSUE_TEMPLATE/story.yml` con: historia, criterios, enfoque, archivos, tareas (checkboxes), DoD, TDD tier

---

## Olas de entrega

| Ola | Epics | Por qué primero |
|---|---|---|
| **1 — Quick wins** | E, D, G | Port directo de FinSight, bajo riesgo, arreglan footguns |
| **2 — Recipes de alto valor** | B, C, F | Convierten Inceptor en base para apps reales (auth + IA) |
| **3 — Apuesta estructural** | A | `create-inceptor-app`: de "repo que copias" a "template que instancias" |

## Métrica de éxito
Re-instanciar un demo desde el flujo lean + recipes y medir **cero-a-"hola
mundo con auth"** y **cero-a-"feature de IA"**. Si baja de horas a minutos, el DX
mejoró.
