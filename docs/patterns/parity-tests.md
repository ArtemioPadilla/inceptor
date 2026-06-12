# Parity-test pattern

A parity test asserts that two sibling data sources stay in sync — without
starting a server or fetching HTML. The pattern shows up repeatedly in this
repo: i18n key coverage, route coverage, component catalog coverage, and API
golden files all follow the same shape.

## The core distinction: emitter vs consumer

Every parity test has two roles:

| Role | What it does | Lives in |
|---|---|---|
| **Build-time data emitter** | Scans the file system (via `import.meta.glob`) or reads a static source (JSON, TypeScript AST) and derives a fact set at module evaluation time | `src/tests/*.test.ts`, evaluated by Vitest / the Vite bundler at build time |
| **Runtime consumer** | Uses that fact set to render UI — e.g. the nav renders from the dictionary, the gallery page renders from `galleryManifest`, a docs page renders from the sidebar | `src/pages/**`, `src/components/**` — evaluated in the browser or SSR at request time |

Keeping the two roles separate is what makes parity tests cheap: they run in
~milliseconds, require no server, and fail loudly at CI time with a diff of
exactly what is missing.

## The pattern in code

```ts
// 1. Derive the two sets at module scope (import.meta.glob is resolved
//    by Vite at transform time — the sets are always fresh).
const sourceA = import.meta.glob('../pages/**/*.{astro,md,mdx}', { eager: false });
const sourceB = import.meta.glob('../pages/es/**/*.{astro,md,mdx}', { eager: false });

// 2. Normalize to comparable keys.
const setA = new Set(Object.keys(sourceA).map(normalize));
const setB = new Set(Object.keys(sourceB).map(normalize));

// 3. Assert both directions.
it('B contains every key in A', () => {
  const missing = [...setA].filter(k => !setB.has(k));
  expect(missing, `missing: ${missing}`).toEqual([]);
});

it('A contains every key in B (no orphans)', () => {
  const extra = [...setB].filter(k => !setA.has(k));
  expect(extra, `orphans: ${extra}`).toEqual([]);
});
```

## Parity tests in this repo

### i18n key parity — `src/tests/i18n.test.ts`

**What:** Every leaf key in the English dictionary (`src/i18n/en.ts`) must
exist in the Spanish dictionary (`src/i18n/es.ts`), and vice versa.

**Emitter:** `collectLeafKeys(dict)` — walks the dictionary tree and returns
flat dot-paths (`['nav.home', 'nav.gallery', …]`). Exported from
`src/i18n/index.ts`.

**Why both directions?** TypeScript's `typeof en` constraint blocks ES from
having *fewer* keys than EN (compile-time), but it cannot block ES from having
*more* keys (that would be a type-narrowing error). The runtime test covers the
second direction.

**Files:**
- `src/i18n/en.ts` — English dictionary (source of truth)
- `src/i18n/es.ts` — Spanish dictionary (`satisfies typeof en`)
- `src/i18n/index.ts` — exports `collectLeafKeys`, `dictionaries`
- `src/tests/i18n.test.ts` — parity assertions

---

### Route parity — `src/tests/route-parity.test.ts`

**What:** Every page under `src/pages/es/` must map to a real EN route (exact
match or covered by a dynamic catch-all like `/docs/[...slug]`). Orphan ES
pages — translations without an English source — are caught at CI time.

**Emitter:** Two `import.meta.glob` calls, one for EN pages and one for ES
pages. The `toRoute()` helper normalizes file paths to route stems; the
`isCoveredByEnRoute()` helper handles dynamic-segment prefixes.

**Allowlist:** Routes that are intentionally English-only are listed in
`EN_ONLY_ALLOWLIST`. Each allowlist entry is validated against the actual file
system so stale entries (deleted pages) are caught.

**Files:**
- `src/pages/es/` — translated landing pages
- `src/pages/` — EN routes (the source of truth)
- `src/tests/route-parity.test.ts`

---

### Component catalog parity — `src/tests/component-docs-coverage.test.ts`

**What:** Every entry in `galleryManifest` (the source-of-truth for the
component gallery) must survive `extractPropsForSource()` without throwing, and
at least 3 entries must yield at least one Props table.

**Emitter:** `galleryManifest` from `src/content/gallery.ts` + the TypeScript
AST extractor in `src/lib/component-docs.ts`.

**Consumer:** The gallery detail page (`src/pages/gallery/[component].astro`)
renders the Props table via `component-docs.ts`.

**Files:**
- `src/content/gallery.ts` — manifest
- `src/lib/component-docs.ts` — AST extractor
- `src/tests/component-docs-coverage.test.ts`
- `src/tests/component-docs-extractor.test.ts`

---

### "What docs say" vs "what components do" — `src/tests/components-docs.test.ts`

**What:** The component count documented in `docs/COMPONENTS.md` (the
human-readable guide) must not diverge more than ±5 from the actual number of
files under `src/components/ui/`. This is a loose parity — not a hard count —
because the docs intentionally omit internal helpers.

**Emitter:** `import.meta.glob` over `src/components/ui/**/*.tsx`.

**Consumer:** Humans reading the docs; the `COMPONENTS.md` count is also cited
on the marketing home page.

**Files:**
- `docs/COMPONENTS.md`
- `src/tests/components-docs.test.ts`

---

## When to write a parity test

Write a parity test when:

1. You have two sibling sources that must stay in sync (locales, route sets,
   manifests, golden files).
2. A drift between them would be silent at type-check time and only surface as
   a runtime bug or a confusing 404/empty page.
3. The check can be expressed as a set operation (`A ⊆ B` and `B ⊆ A`).

Do **not** write a parity test for:
- Data that only has one authoritative source (no sibling).
- Cross-service contracts that require a live API — those belong in integration
  tests or contract tests (Pact, etc.), not in the fast Vitest suite.

## Maintenance notes

- **When you add a new locale:** duplicate the key-parity test pair for the
  new locale's dictionary.
- **When you add a new top-level EN page without an ES translation:** add the
  route to `EN_ONLY_ALLOWLIST` in `route-parity.test.ts` so CI does not block.
- **When you delete an EN page:** remove its entry from `EN_ONLY_ALLOWLIST`
  (the stale-entry assertion will catch it if you forget).
- **When you add a new gallery entry:** run `npm run test` — the
  `component-docs-coverage` test will catch any AST extraction errors.
