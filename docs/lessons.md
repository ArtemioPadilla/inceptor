# Lessons log

Registro de lecciones no obvias aprendidas durante la migración de travel-plan
a Inceptor. Mismo formato que `docs/lessons.md` de Inceptor: lo más nuevo
arriba; cada entrada = fecha · lección en una línea · por qué nos mordió · la
regla que adoptamos. `centinela` añade una entrada cuando rechaza el mismo
issue dos veces.

---

## 2026-09-06 · Un shell con `cd` persistente commitea en el repo equivocado

Con tres checkouts hermanos (`travel-plan`, `TravelHub`, `inceptor`) en el
mismo entorno, un comando que empieza con `cd /home/user/inceptor` deja el
cwd ahí para los comandos siguientes; el siguiente `git commit` de "docs" fue
a parar a la rama de sesión de Inceptor y se publicó. Se revirtió con un
commit de reversión (el force-push está bloqueado por política).

**Regla:** todo comando de git y de escritura empieza con `cd /home/user/travel-plan &&`;
nunca se confía en el cwd heredado.

---

## 2026-09-06 · El subset "lean" de `create-inceptor-app` no compila solo

`node scripts/init.mjs --archetype static` genera 18 componentes de `ui/`,
pero `data-table.tsx` importa `action-bar`, `checkbox`, `download-trigger`,
`empty-state`, `error-state`, `field-type/display`, `lib/use-listing` y
`lib/field-type`, que el init no copia. Además deja
`ignoreDeprecations: "6.0"` en `tsconfig.json` mientras fija
`typescript ^5.6`, y `npm install` falla con `Cannot read properties of null
(reading 'edgesOut')` hasta usar `--legacy-peer-deps`. La afirmación
"Verificado: el proyecto generado pasa `npm run check`" del
`DX-IMPROVEMENT-PLAN.md` quedó obsoleta tras los Epics 23–24.

**Regla:** travel-plan v3 parte del `src/` completo de Inceptor con su
`package.json` + `package-lock.json` (que sí pasan `npm ci`), y se poda
después. Abrir issue upstream en Inceptor con estos tres hallazgos.

---

<!-- Append new lessons above this line. -->
