#!/usr/bin/env node
/**
 * create-inceptor-app — genera un proyecto LEAN a partir de este scaffold.
 *
 *   node scripts/init.mjs --name my-app --archetype static --out ../my-app \
 *     [--repo owner/repo] [--lang en|es] [--site https://example.com] \
 *     [--accent '#d6006f']
 *
 * Copia un subconjunto *core* (UI ~18, lib, stores/theme, islas de infra,
 * layout, landing mínima), renombra/de-brandea, y deja `npm run check` verde.
 * Archetypes: static | backend-node | backend-flask.
 */
import { cpSync, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, posix } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readdirSync } from 'node:fs';
import { accentHex, parseAccent, rebrandCss } from './accent.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

// --- args ---
const args = process.argv.slice(2);
const flag = (n, d) => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : d;
};
const name = flag('name', 'my-app');
const archetype = flag('archetype', 'static');
const out = flag('out', null);
// Strip diacritics before slugging so "Buró del Pueblo" → "buro-del-pueblo"
// (not "bur-del-pueblo"): NFD splits "ó" into "o" + U+0301, which we drop.
const slug = name
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9-]+/g, '-')
  .replace(/^-+|-+$/g, '');
const ident = slug.replace(/-/g, '_');
const repoSlug = flag('repo', `your-org/${slug}`);
// UI language of the generated shell (<html lang>, landing copy, FeedbackFAB).
const lang = flag('lang', 'en');
// Production origin (no trailing slash) → astro `site`, sitemap, robots.txt.
const site = flag('site', null)?.replace(/\/+$/, '') ?? null;

// Brand colour (#hex or oklch(L C H)): its hue re-brands the palette, the
// favicon and theme-color. Without it the template's emerald is kept.
const accent = flag('accent', null);
let accentHue = null;
if (accent !== null) {
  try {
    accentHue = parseAccent(accent).h;
  } catch (err) {
    console.error(`✗ --accent inválido: ${err.message}`);
    process.exit(1);
  }
}
const brandHex = accentHue === null ? '#10b981' : accentHex(accentHue);

if (!out) {
  console.error('✗ Falta --out <dir>. Ej: node scripts/init.mjs --name app --archetype static --out ../app');
  process.exit(1);
}
if (!['en', 'es'].includes(lang)) {
  console.error(`✗ --lang inválido: ${lang} (usa en | es)`);
  process.exit(1);
}
if (site !== null && !/^https?:\/\/[^/]+$/.test(site)) {
  console.error(`✗ --site debe ser un origen, p.ej. https://example.com (recibido: ${site})`);
  process.exit(1);
}
if (!['static', 'backend-node', 'backend-flask'].includes(archetype)) {
  console.error(`✗ --archetype inválido: ${archetype} (usa static | backend-node | backend-flask)`);
  process.exit(1);
}
if (existsSync(out)) {
  console.error(`✗ El destino ya existe: ${out}`);
  process.exit(1);
}

const CORE_UI = [
  'button', 'input', 'label', 'textarea', 'form', 'card', 'alert', 'callout',
  'skeleton', 'spinner', 'badge', 'separator', 'table', 'data-table', 'select',
  'dialog', 'toast', 'dropdown-menu',
];
// disposer + use-client-preference back the island rules in the generated CLAUDE.md.
const LIB = ['utils', 'api', 'href', 'flags', 'report-issue', 'queryClient', 'disposer', 'use-client-preference'];

// --- helpers ---
const dst = (p) => join(out, p);
// Copia con de-brand: reemplaza el nombre interno del scaffold por el del
// proyecto en strings/comentarios. No-op en archivos sin referencias.
const copied = new Set();
function copy(rel) {
  const src = join(ROOT, rel);
  if (!existsSync(src)) return;
  copied.add(rel);
  mkdirSync(dirname(dst(rel)), { recursive: true });
  const text = readFileSync(src, 'utf8')
    .replaceAll('the Inceptor integration of this Astro+React UI template', `the issue-driven development of the ${name} project`)
    .replaceAll('Inceptor', name)
    .replaceAll('ArtemioPadilla/inceptor', repoSlug)
    // Inside JS identifiers (`W.__inceptor_diag`) a hyphenated slug is a
    // syntax error, so use an identifier-safe variant there.
    .replace(/(?<=[\w$])inceptor|inceptor(?=[\w$])/g, ident)
    .replaceAll('inceptor', slug);
  writeFileSync(dst(rel), text);
}
function write(rel, content) {
  mkdirSync(dirname(dst(rel)), { recursive: true });
  writeFileSync(dst(rel), content);
}

// Follow local imports (`@/…` and relative) of every copied src/ file and copy
// whatever they pull in, so a core component that grows a new internal
// dependency in the template (e.g. data-table → action-bar, use-listing,
// i18n) can't silently break the generated project's type-check.
const IMPORT_RE = /(?:from\s+|import\s*\(\s*|import\s+)['"]([^'"]+)['"]/g;
const RESOLVE_EXTS = ['', '.ts', '.tsx', '.astro', '/index.ts', '/index.tsx'];
function resolveLocal(spec, fromRel) {
  let base;
  if (spec.startsWith('@/')) base = `src/${spec.slice(2)}`;
  else if (spec.startsWith('.')) base = posix.join(posix.dirname(fromRel), spec);
  else return null;
  for (const ext of RESOLVE_EXTS) {
    const p = join(ROOT, base + ext);
    if (existsSync(p) && statSync(p).isFile()) return base + ext;
  }
  return null;
}
function copyImportClosure() {
  const queue = [...copied].filter((f) => f.startsWith('src/') && /\.(tsx?|astro)$/.test(f));
  while (queue.length) {
    const rel = queue.shift();
    for (const [, spec] of readFileSync(join(ROOT, rel), 'utf8').matchAll(IMPORT_RE)) {
      const dep = resolveLocal(spec, rel);
      if (!dep || copied.has(dep) || !/\.(tsx?|astro)$/.test(dep)) continue;
      copy(dep);
      queue.push(dep);
    }
  }
}

console.log(`→ Generando ${name} (${archetype}) en ${out}…`);
mkdirSync(out, { recursive: true });

// --- reusable copies (self-contained: solo dependen de @/lib/utils, base-ui, etc.) ---
copy('src/styles/global.css');
if (accentHue !== null) {
  writeFileSync(dst('src/styles/global.css'), rebrandCss(readFileSync(dst('src/styles/global.css'), 'utf8'), accentHue));
}
for (const f of LIB) copy(`src/lib/${f}.ts`);
copy('src/lib/api.test.ts');
copy('src/stores/theme.ts');
for (const c of CORE_UI) copy(`src/components/ui/${c}.tsx`);
copy('src/components/ui/use-data-table-url-state.ts');
copy('src/components/islands/ErrorBoundary.tsx');
copy('src/components/islands/QueryProvider.tsx');
copy('src/components/common/ThemeToggle.astro');
copy('src/components/common/FeedbackFAB.astro');
copyImportClosure();
for (const f of ['vitest.config.ts', 'vitest.setup.ts', '.prettierrc.json', '.prettierignore', '.editorconfig', '.nvmrc']) copy(f);
copy('.claude/agents/prometeo.md');
copy('.claude/agents/forja.md');
copy('.claude/agents/centinela.md');
copy('.claude/checklists/ethics.json');
copy('.claude/checklists/ethics.md');
copy('.claude/checklists/governance.md');
copy('.claude/checklists/forbidden-imports.json');
copy('docs/decisions/TEMPLATE.md');
copy('.github/workflows/ci.yml');

// --- templated files ---
const TEMPLATE_PKG = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
const TEMPLATE_VERSIONS = { ...TEMPLATE_PKG.dependencies, ...TEMPLATE_PKG.devDependencies };
function pick(names) {
  return Object.fromEntries(names.map((n) => {
    const v = TEMPLATE_VERSIONS[n];
    if (!v) throw new Error(`init.mjs: ${n} is not a dependency of the template package.json`);
    return [n, v];
  }));
}
const backend = archetype !== 'static';
write('package.json', JSON.stringify({
  name: slug,
  type: 'module',
  version: '0.1.0',
  engines: { node: '>=22' },
  scripts: {
    dev: 'astro dev',
    build: 'astro build',
    preview: 'astro preview',
    'check:astro': 'astro check',
    check: 'npm-run-all --parallel check:astro type-check test --serial build',
    'type-check': 'tsc --noEmit',
    test: 'vitest run',
    format: 'prettier --write .',
  },
  // Versions come from the template's own package.json so the generated
  // project can never drift from what this repo actually builds and tests
  // with (drift once paired TS 5 with ignoreDeprecations: '6.0' → TS5103).
  dependencies: pick([
    '@astrojs/check', '@astrojs/react', '@astrojs/sitemap', '@base-ui-components/react',
    '@fontsource-variable/fraunces', '@fontsource-variable/hanken-grotesk',
    '@fontsource-variable/jetbrains-mono',
    '@hookform/resolvers', '@nanostores/react', '@tailwindcss/vite',
    '@tanstack/query-persist-client-core', '@tanstack/react-query',
    '@tanstack/react-table', '@tanstack/react-virtual', 'astro',
    'class-variance-authority', 'clsx', 'idb-keyval', 'lucide-react', 'motion',
    'nanostores', 'react', 'react-day-picker', 'react-dom', 'react-hook-form',
    'recharts', 'tailwind-merge', 'tailwindcss', 'tailwindcss-motion', 'zod',
  ]),
  devDependencies: pick([
    '@testing-library/jest-dom', '@testing-library/react',
    '@testing-library/user-event', '@types/node', '@types/react',
    '@types/react-dom', 'jsdom', 'npm-run-all', 'prettier',
    'prettier-plugin-astro', 'typescript', 'vitest',
  ]),
}, null, 2) + '\n');

write('astro.config.mjs', `import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

const BASE = process.env.ASTRO_BASE || '/';

export default defineConfig({
  site: '${site ?? 'https://example.com'}',${site ? '' : ' // TODO(agent): production origin — feeds the sitemap and public/robots.txt'}
  base: BASE,
  integrations: [react(), sitemap()],
  vite: { plugins: [tailwindcss()] },
  output: 'static',
});
`);

write('tsconfig.json', JSON.stringify({
  compilerOptions: {
    target: 'ES2022', module: 'ESNext', moduleResolution: 'bundler',
    strict: true, skipLibCheck: true, jsx: 'react-jsx', baseUrl: '.',
    // TS6 errors on the deprecated baseUrl unless this is present (same as
    // the template's own tsconfig).
    ignoreDeprecations: '6.0',
    paths: { '@/*': ['./src/*'] },
  },
  include: ['src/**/*'],
}, null, 2) + '\n');

write('src/env.d.ts', '/// <reference types="astro/client" />\n');

write('src/components/common/SiteHeader.astro', `---
import ThemeToggle from './ThemeToggle.astro';
import { withBase } from '@/lib/href';
const nav: { href: string; label: string }[] = [];
---
<header class="sticky top-0 z-40 border-b border-border/60 bg-background/75 backdrop-blur-md">
  <nav class="mx-auto flex max-w-6xl items-center gap-3 px-5 py-2.5">
    <a href={withBase('/')} class="font-display text-lg font-semibold tracking-tight text-foreground">
      ${name}
    </a>
    <div class="ml-auto flex items-center gap-1 font-mono text-xs sm:text-sm">
      {nav.map((n) => (
        <a href={withBase(n.href)} class="rounded-md px-2 py-1 text-muted-foreground transition-colors hover:text-primary">{n.label}</a>
      ))}
      <span class="ml-1"><ThemeToggle lang="${lang}" /></span>
    </div>
  </nav>
</header>
`);

write('src/layouts/BaseLayout.astro', `---
// Self-hosted fonts (#327): no request to a third party, so no visitor IP
// leaves for Google Fonts and a strict CSP needs no extra host. Variable
// files: one request per family, fetched per unicode-range.
import '@fontsource-variable/fraunces';
import '@fontsource-variable/hanken-grotesk';
import '@fontsource-variable/jetbrains-mono';
import '../styles/global.css';
import FeedbackFAB from '../components/common/FeedbackFAB.astro';
import SiteHeader from '../components/common/SiteHeader.astro';
import { withBase } from '../lib/href';
interface Props { title?: string; description?: string; lang?: 'es' | 'en'; }
const { title = '${name}', description = '', lang = '${lang}' } = Astro.props;
---
<!doctype html>
<html lang={lang}>
  <head>
    <script is:inline>
      (function () {
        try {
          const s = localStorage.getItem('theme');
          const d = window.matchMedia('(prefers-color-scheme: dark)').matches;
          if (s === 'dark' || (s === null && d)) document.documentElement.classList.add('dark');
        } catch (_) {}
      })();
    </script>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content={description} />
    <title>{title}</title>
    <link rel="icon" type="image/svg+xml" href={withBase('/favicon.svg')} />
    <meta name="theme-color" content="${brandHex}" />
  </head>
  <body class="relative min-h-screen bg-background text-foreground antialiased">
    <a
      href="#main"
      class="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-primary-foreground"
    >${lang === 'es' ? 'Saltar al contenido' : 'Skip to content'}</a>
    <SiteHeader />
    <slot />
    <FeedbackFAB lang={lang} />
  </body>
</html>
`);

write('src/pages/index.astro', `---
import BaseLayout from '../layouts/BaseLayout.astro';
---
<BaseLayout title="${name}">
  <main id="main" class="mx-auto max-w-3xl px-5 py-24 text-center">
    <h1 class="font-display text-5xl font-semibold tracking-tight text-foreground">${name}</h1>
    <p class="mt-4 text-lg text-muted-foreground">
      ${lang === 'es'
        ? 'Tu nuevo proyecto, listo. Edita <code class="font-mono">src/pages/index.astro</code> y empieza.'
        : 'Your new project is ready. Edit <code class="font-mono">src/pages/index.astro</code> to get started.'}
    </p>
  </main>
</BaseLayout>
`);

write('.nvmrc', '22\n');
// robots.txt: the deploy workflow serves under /${slug}/ by default (ASTRO_BASE).
write('public/robots.txt', site
  ? `User-agent: *\nAllow: /\n\n# Deploy base /${slug}/ (ASTRO_BASE in .github/workflows/deploy.yml)\nSitemap: ${site}/${slug}/sitemap-index.xml\n`
  : `User-agent: *\nAllow: /\n\n# TODO(agent): point at the production sitemap (deploy base included), e.g.\n# Sitemap: https://example.com/${slug}/sitemap-index.xml\n`);
write('.gitignore', '.env\n.env.*\n!.env.example\nnode_modules/\ndist/\n.astro/\n*.log\n');
write('.env.example', `PUBLIC_REPO_SLUG=${repoSlug}\n${backend ? 'PUBLIC_API_BASE=\n' : ''}PUBLIC_BUILD_SHA=dev\nPUBLIC_VERSION=dev\n`);
// public/ con un favicon mínimo
write('public/favicon.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="${brandHex}"/></svg>\n`);

// minimal README
write('README.md', `# ${name}\n\nGenerado con create-inceptor-app (archetype: \`${archetype}\`).\n\n\`\`\`bash\nnpm install\nnpm run dev      # http://localhost:4321\nnpm run check    # gate: astro check + type-check + tests + build\n\`\`\`\n\n> CI y deploy instalan con \`npm ci\`: haz commit de \`package-lock.json\` tras el primer \`npm install\`. Si npm 10.9 truena con \`Cannot read properties of null (reading 'edgesOut')\`, genera el lockfile con \`npx npm@11 install\`.\n\nRecetas (auth, IA, hosting): ver el repo scaffold, carpeta \`docs/recipes/\`.\n`);

// deploy workflow (Pages) con el slug
write('.github/workflows/deploy.yml', `name: Deploy to GitHub Pages
on:
  push: { branches: [main] }
  workflow_dispatch:
concurrency: { group: pages, cancel-in-progress: true }
permissions: { contents: read, pages: write, id-token: write }
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@df4cb1c069e1874edd31b4311f1884172cec0e10 # v6
      - uses: actions/setup-node@48b55a011bda9f5d6aeb4c2d9c7362e8dae4041e # v6
        with: { node-version: '22', cache: 'npm' }
      - run: npm ci
      - run: npm run build
        env:
          ASTRO_BASE: \${{ secrets.ASTRO_BASE || '/${slug}' }}
      - uses: actions/upload-pages-artifact@fc324d3547104276b827a68afc52ff2a11cc49c9 # v5
        with: { path: ./dist }
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: \${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@cd2ce8fcbc39b97be8ca5fce6e763baed58fa128 # v5
`);

// --- agent-readable surface (llms.txt + structured identity) -------------
// The template's own llms endpoints read its content collections, which the
// generated project doesn't have — so emit simple, already-re-branded
// versions instead, plus the single-source identity file with explicit
// TODOs the instancing agent must resolve.
write('src/lib/site-meta.ts', `/**
 * ⚠️ SINGLE SOURCE of this site's machine-readable identity (llms.txt,
 * JSON-LD, default meta description). Generated by create-inceptor-app —
 * the TODO below is yours to resolve before shipping.
 */
export const SITE = {
  name: '${name}',
  // TODO(agent): replace with ${name}'s real one-line positioning. This is
  // what search engines and LLM crawlers will quote about the site.
  description: '${name} — built on the Inceptor issue-driven scaffold.',
  repoSlug: (import.meta.env.PUBLIC_REPO_SLUG as string | undefined) ?? '${repoSlug}',
  license: 'MIT',
} as const;

export const REPO_URL = \`https://github.com/\${SITE.repoSlug}\`;
`);

write('src/pages/llms.txt.ts', `import type { APIRoute } from 'astro';
import { SITE, REPO_URL } from '@/lib/site-meta';

/**
 * /llms.txt — agent-first index (llmstxt.org). Keep this in sync as routes
 * grow; an agent reads this before crawling anything else.
 */
export const GET: APIRoute = () => {
  const body = \`# \${SITE.name}

> \${SITE.description}

Source: \${REPO_URL} (\${SITE.license}). Agent/contributor context:
\${REPO_URL}/blob/main/CLAUDE.md

## Pages

- [Home](/): TODO(agent): describe the landing page
\`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
`);

write('CLAUDE.md', `# ${name} — agent context

Generated by create-inceptor-app from the Inceptor scaffold
(https://github.com/ArtemioPadilla/inceptor). Workflow: issue → Claude Code
orchestrates prometeo (plan) → forja (implement) → centinela (validate) →
PR → merge.

## ⚠️ Re-brand checklist — do this BEFORE shipping features

This project was instanced from a template. The machine-readable identity
still carries generated defaults; an agent (or human) must:

- [${accentHue === null ? ' ' : 'x'}] \`src/styles/global.css\` — brand colour: the template ships emerald.
      Decide the action colour on purpose (a green brand can read as an
      "approved" state) and re-run with \`--accent <colour>\`, or rotate the
      hue of the brand tokens by hand; the favicon and \`theme-color\` follow it
- [ ] \`src/lib/site-meta.ts\` — write ${name}'s real one-line description
      (it feeds /llms.txt, JSON-LD and the default meta description)
- [ ] \`src/pages/llms.txt.ts\` — list the real routes as they're built
- [${site ? 'x' : ' '}] \`astro.config.mjs\` — set \`site\` to the production origin
- [${site ? 'x' : ' '}] \`public/robots.txt\` — point Sitemap at the production sitemap URL
- [ ] \`.github/workflows/deploy.yml\` — confirm ASTRO_BASE matches the
      deploy path
- [ ] Issue templates in \`.github/ISSUE_TEMPLATE/\` — adjust labels/wording
      to this project

Conventions inherited from the scaffold: Conventional Commits + issue refs,
never push to main, every PR passes \`npm run check\`.

## Stack rules (from the Inceptor scaffold — read before touching code)

Astro 5 islands + React 19 + Tailwind v4 + Base UI primitives.

1. Never install \`@astrojs/tailwind\` — Tailwind v4 goes through
   \`@tailwindcss/vite\`.
2. Never use React Context for state shared between islands — each
   \`client:*\` island is its own React root. Use Nano Stores (\`src/stores/\`).
3. Never wrap the whole app in one \`client:load\` island — prefer
   \`client:idle\` / \`client:visible\`; ship zero JS by default.
4. Never mix Radix and Base UI primitives in one component (prefer Base UI);
   never import \`@radix-ui/*\`, \`@tremor/react\` or \`framer-motion\` —
   animations come from \`motion/react\`.
5. The compound-component gotcha: \`Dialog\`, \`Tabs\`, controlled
   \`DropdownMenu\`, \`Toast\` cannot span islands. Compose the whole thing in
   ONE file under \`src/components/islands/\` and hydrate that single island.
6. Island lifecycle: every listener, interval, timeout or observer is torn
   down on unmount. Use \`createDisposer()\` from \`src/lib/disposer.ts\` and
   return \`d.dispose\` from the \`useEffect\`.
7. Browser-only values (theme, locale, reduced motion) go through
   \`useClientPreference\` (\`src/lib/use-client-preference.ts\`) to avoid
   hydration mismatches.
8. Path alias \`@/*\` → \`./src/*\`.
`);

// Issue forms ARE the Inceptor workflow's front door (issue → Claude → PR):
// a generated project without them can't run the loop. Copy them de-branded.
for (const tpl of [
  'config.yml',
  'bug_report.yml',
  'feature_request.yml',
  'question.yml',
  'story.yml',
]) {
  copy(`.github/ISSUE_TEMPLATE/${tpl}`);
}

// --- archetype backend (excluye artefactos locales) ---
const SKIP = new Set(['.venv', 'node_modules', '__pycache__', '.pytest_cache', 'dist', '.env']);
const noArtifacts = (src) => !SKIP.has(src.split('/').pop());
if (archetype === 'backend-flask') {
  cpSync(join(ROOT, 'server-flask'), dst('server'), { recursive: true, filter: noArtifacts });
  // The parity test compares Flask's OpenAPI surface against the node
  // archetype's golden contract, which lives in server-node/ only in the
  // template. Ship the golden next to the server and point the test at it.
  cpSync(join(ROOT, 'server-node/openapi.golden.json'), dst('server/openapi.golden.json'));
  const testPath = dst('server/tests/test_app.py');
  writeFileSync(
    testPath,
    readFileSync(testPath, 'utf8')
      .replace('"..", "..", "server-node", "openapi.golden.json"', '"..", "openapi.golden.json"')
      .replace('run `npm run gen:openapi` in server-node/ ', 'regenerate it with `npm run gen:openapi` in the Inceptor template\'s server-node/ '),
  );
}
if (archetype === 'backend-node') {
  cpSync(join(ROOT, 'server-node'), dst('server'), { recursive: true, filter: noArtifacts });
}

// De-brand the copied backend like every other file: otherwise REPO_SLUG
// defaults to the template repo and a generated project's feedback endpoint
// files issues into Inceptor. (Same replacements as copy().)
function debrandTree(rel) {
  for (const e of readdirSync(dst(rel), { withFileTypes: true })) {
    const child = `${rel}/${e.name}`;
    if (e.isDirectory()) debrandTree(child);
    else {
      const text = readFileSync(dst(child), 'utf8');
      const next = text
        .replaceAll('ArtemioPadilla/inceptor', repoSlug)
        .replaceAll('inceptor', slug);
      if (next !== text) writeFileSync(dst(child), next);
    }
  }
}
if (backend) debrandTree('server');

// The node Dockerfile builds from the repo root (it needs ../src/schemas) and
// referenced the template's server-node/ paths and docker-compose.yml.
if (archetype === 'backend-node') {
  const df = dst('server/Dockerfile');
  writeFileSync(
    df,
    readFileSync(df, 'utf8')
      .replace(/\(see docker-compose\.yml\)/, '(docker build -f server/Dockerfile .)')
      .replaceAll('server-node', 'server'),
  );
}

// The node backend reuses the frontend's Zod schemas
// (server/src/schemas.ts imports ../../src/schemas/index).
if (archetype === 'backend-node') {
  cpSync(join(ROOT, 'src/schemas'), dst('src/schemas'), { recursive: true });
}

// --- CI: only the jobs this project actually has ---
// The template's ci.yml also tests server-node/ and server-flask/, which exist
// only in the template. Keep the job matching this archetype — renamed and
// pointed at server/, so its SHA pins stay in sync with the template — and
// drop the other one (both, for static).
function rewriteCi() {
  const path = dst('.github/workflows/ci.yml');
  if (!existsSync(path)) return;
  const BACKEND_JOBS = { 'backend-node': 'server-node', 'backend-flask': 'server-flask' };
  const keep = BACKEND_JOBS[archetype];
  const lines = [];
  let job = null;
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const key = /^ {2}([\w-]+):\s*$/.exec(line);
    if (key) job = key[1];
    if (job !== 'server-node' && job !== 'server-flask') {
      lines.push(line);
    } else if (job === keep) {
      lines.push(
        line
          .replace(/^ {2}[\w-]+:\s*$/, '  server:')
          .replace(/^( {4}name: ).*$/, '$1server tests')
          .replaceAll(`${keep}/`, 'server/')
          .replace(new RegExp(`(working-directory: )${keep}$`), '$1server'),
      );
    }
  }
  writeFileSync(path, lines.join('\n'));
}
rewriteCi();

console.log(`✓ Listo: ${out}`);
console.log(`  cd ${out} && npm install && npm run check`);
if (backend) console.log('  backend en ./server (ver su README); PUBLIC_API_BASE → su URL');
