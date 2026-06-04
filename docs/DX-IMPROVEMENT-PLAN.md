# Inceptor DX — plan de mejora (lecciones de FinSight AI)

FinSight AI fue el **primer producto real construido sobre Inceptor**. Su
construcción (auth, upload de PDF, IA, categorización, deploy) reveló que
Inceptor está optimizado para **mantener el repo-scaffold**, no para
**"instanciar y enviar un producto nuevo"**. Este plan cierra ese hueco.

Convención: **Epic → Historia → Tarea**. Marca `[x]` al completar; cada Historia
referencia su PR al cerrarse. Olas de entrega al final.

> Estado: **implementado**. Ola 1 (E/D/G, PR #113), Ola 2 (B/C/F, PR #114) y
> Ola 3 (A, este PR) entregadas. Pendientes menores marcados `[ ]`/`[~]` dentro
> de cada Historia (p. ej. archetype `supabase` en el init).

---

## Epic A — Instanciación *lean* (`create-inceptor-app`)

**Problema:** instanciar un proyecto hoy es copia-selectiva manual (excluir
galería/showcase/blog/demos, recortar `ui/` de ~60→~18, renombrar, limpiar
branding). Frágil y deja restos.

### Historia A1 — Script de init que genera un proyecto mínimo ✅ (Ola 3)
- [x] `scripts/init.mjs` (+ `npm run init`) copia a un destino un subconjunto *core*
- [x] Flags: `--name`, `--archetype <static|backend-node|backend-flask>`, `--out`, `--repo`
- [x] Excluye galería, showcase, blog, demos, historia (solo el core)
- [x] Set *core* de `ui/` (18) + `lib/` + `stores/theme` + islas infra + layout + landing
- [x] **Verificado**: el proyecto generado pasa `npm install && npm run check` (1 página, tests verdes)
- [ ] *(follow-up)* archetype `supabase` en el init (la receta ya existe: `docs/recipes/auth-supabase.md`)

### Historia A2 — Parametrizar nombre / slug / base (de-brand) ✅ (Ola 3)
- [x] Reemplaza nombre, `package.json` name, `PUBLIC_REPO_SLUG`, `ASTRO_BASE`, slug del deploy
- [x] **Cero referencias "Inceptor"** en el proyecto generado (verificado por grep)
- [x] README mínimo generado con el nombre del proyecto

### Historia A3 — Kit `ui/` *core + add* ✅ (Ola 3)
- [x] Set *core* (button, input, label, textarea, form, card, alert, callout, skeleton, spinner, badge, separator, table, data-table, select, dialog, toast, dropdown-menu)
- [~] `npm run new-component` on-demand → alineado con Epic 18 (scaffolder)
- [x] El init documenta "empieza lean" en el README generado

---

## Epic B — Receta Auth + DB (Supabase)

**Problema:** todo producto real necesita auth + datos; Inceptor no lo trae.
En FinSight se construyó desde cero.

### Historia B1 — Recipe doc + código de referencia ✅ (Ola 2)
- [x] `docs/recipes/auth-supabase.md` (copy-paste) con el flujo completo
- [x] Código de `supabase.ts` guardado incluido en el recipe
- [x] Código de `stores/auth.ts` (sesión cross-island) incluido
- [x] Código de islas `LoginForm` / `RegisterForm` / `AuthNav` incluido

> Nota: se entrega como **recipe** (código en el doc), no como código vivo en el
> demo — meter Supabase al demo forzaría una dep + opinión. El init (Epic A) lo
> instala on-demand por archetype.

### Historia B2 — Patrón de datos + RLS ✅ (Ola 2)
- [x] Migración ejemplo con RLS (`auth.uid() = user_id`, `default auth.uid()`)
- [x] Patrón **"frontend escribe con la sesión + RLS, sin service key"** documentado
- [x] ADR de la arquitectura (ver ADR 0006 + recipe)

---

## Epic C — Receta feature de IA (BYOK)

**Problema:** apps con IA son cada vez más comunes; no hay patrón en Inceptor.
FinSight inventó BYOK + server stateless + mock en tests.

### Historia C1 — Recipe BYOK ✅ (Ola 2)
- [x] `docs/recipes/ai-byok.md` — patrón BYOK (key → `sessionStorage` → header → uso transitorio)
- [x] Código de `stores/apiKey.ts` + `ApiKeyField` incluido
- [x] Helper `call_claude` aislado (mockeable) + patrón de test (monkeypatch) incluido

### Historia C2 — Guía de hosting del backend de IA ✅ (Ola 2)
- [x] `docs/recipes/ai-backend-hosting.md` — local / Render / Cloud Run
- [x] Nota explícita: *Supabase Edge Functions = Deno, no Python*
- [x] Tabla de decisión (requisito de Python vs cero-hosting)

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

### Historia F1 — Inyección de env públicas en deploy ✅ (Ola 2)
- [x] Plantilla documentada: inyectar `PUBLIC_*` desde *Actions Variables* en `deploy.yml`

### Historia F2 — Workflow de migraciones (template) ✅ (Ola 2)
- [x] `docs/recipes/supabase-migrations-ci.md` + plantilla `supabase.yml` (`db push`)
- [x] Guía de secrets del usuario (`SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD`)

---

## Epic G — Issues como guías

**Problema:** los issues detallados (con desglose de tareas) hacen que los
sub-agentes ejecuten mejor; no hay template para ese formato.

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
