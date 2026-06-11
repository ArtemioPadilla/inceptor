#!/usr/bin/env node
/**
 * create-inceptor-app — genera un proyecto LEAN a partir de este scaffold.
 *
 *   node scripts/init.mjs --name my-app --archetype static --out ../my-app
 *
 * Copia un subconjunto *core* (UI ~18, lib, stores/theme, islas de infra,
 * layout, landing mínima), renombra/de-brandea, y deja `npm run check` verde.
 * Archetypes: static | backend-node | backend-flask.
 */
import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

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
const slug = name.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '');
const repoSlug = flag('repo', `your-org/${slug}`);

if (!out) {
  console.error('✗ Falta --out <dir>. Ej: node scripts/init.mjs --name app --archetype static --out ../app');
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
const LIB = ['utils', 'api', 'href', 'flags', 'report-issue', 'queryClient'];

// --- helpers ---
const dst = (p) => join(out, p);
// Copia con de-brand: reemplaza el nombre interno del scaffold por el del
// proyecto en strings/comentarios. No-op en archivos sin referencias.
function copy(rel) {
  const src = join(ROOT, rel);
  if (!existsSync(src)) return;
  mkdirSync(dirname(dst(rel)), { recursive: true });
  const text = readFileSync(src, 'utf8')
    .replaceAll('the Inceptor integration of this Astro+React UI template', `the issue-driven development of the ${name} project`)
    .replaceAll('Inceptor', name)
    .replaceAll('ArtemioPadilla/inceptor', repoSlug)
    .replaceAll('inceptor', slug);
  writeFileSync(dst(rel), text);
}
function write(rel, content) {
  mkdirSync(dirname(dst(rel)), { recursive: true });
  writeFileSync(dst(rel), content);
}

console.log(`→ Generando ${name} (${archetype}) en ${out}…`);
mkdirSync(out, { recursive: true });

// --- reusable copies (self-contained: solo dependen de @/lib/utils, base-ui, etc.) ---
copy('src/styles/global.css');
for (const f of LIB) copy(`src/lib/${f}.ts`);
copy('src/lib/api.test.ts');
copy('src/stores/theme.ts');
for (const c of CORE_UI) copy(`src/components/ui/${c}.tsx`);
copy('src/components/ui/use-data-table-url-state.ts');
copy('src/components/islands/ErrorBoundary.tsx');
copy('src/components/islands/QueryProvider.tsx');
copy('src/components/common/ThemeToggle.astro');
copy('src/components/common/FeedbackFAB.astro');
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
  dependencies: {
    '@astrojs/check': '^0.9.9',
    '@astrojs/react': '^5.0.6',
    '@base-ui-components/react': '^1.0.0-rc.0',
    '@hookform/resolvers': '^5.4.0',
    '@nanostores/react': '^1.1.0',
    '@tailwindcss/vite': '^4.3.0',
    '@tanstack/query-persist-client-core': '^5.100.14',
    '@tanstack/react-query': '^5.100.14',
    '@tanstack/react-table': '^8.21.3',
    '@tanstack/react-virtual': '^3.14.2',
    astro: '^5.18.2',
    'class-variance-authority': '^0.7.1',
    clsx: '^2.1.1',
    'idb-keyval': '^6.2.4',
    'lucide-react': '^1.17.0',
    motion: '^12.40.0',
    nanostores: '^1.3.0',
    react: '^19.2.7',
    'react-dom': '^19.2.7',
    'react-hook-form': '^7.77.0',
    recharts: '^3.8.1',
    'tailwind-merge': '^3.6.0',
    tailwindcss: '^4.3.0',
    'tailwindcss-motion': '^1.1.1',
    zod: '^4.4.3',
  },
  devDependencies: {
    '@testing-library/jest-dom': '^6.9.1',
    '@testing-library/react': '^16.3.2',
    '@testing-library/user-event': '^14.6.1',
    '@types/node': '^22.10.2',
    '@types/react': '^19.2.16',
    '@types/react-dom': '^19.2.3',
    jsdom: '^29.1.1',
    'npm-run-all': '^4.1.5',
    prettier: '^3.8.3',
    'prettier-plugin-astro': '^0.14.1',
    typescript: '^5.6.0',
    vitest: '^4.1.8',
  },
}, null, 2) + '\n');

write('astro.config.mjs', `import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';

const BASE = process.env.ASTRO_BASE || '/';

export default defineConfig({
  base: BASE,
  integrations: [react()],
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
      <span class="ml-1"><ThemeToggle /></span>
    </div>
  </nav>
</header>
`);

write('src/layouts/BaseLayout.astro', `---
import '../styles/global.css';
import FeedbackFAB from '../components/common/FeedbackFAB.astro';
import SiteHeader from '../components/common/SiteHeader.astro';
import { withBase } from '../lib/href';
interface Props { title?: string; description?: string; lang?: 'es' | 'en'; }
const { title = '${name}', description = '', lang = 'en' } = Astro.props;
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
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=Hanken+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" />
    <title>{title}</title>
    <link rel="icon" type="image/svg+xml" href={withBase('/favicon.svg')} />
    <meta name="theme-color" content="#10b981" />
  </head>
  <body class="relative min-h-screen bg-background text-foreground antialiased">
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
  <main class="mx-auto max-w-3xl px-5 py-24 text-center">
    <h1 class="font-display text-5xl font-semibold tracking-tight text-foreground">${name}</h1>
    <p class="mt-4 text-lg text-muted-foreground">
      Tu nuevo proyecto, listo. Edita <code class="font-mono">src/pages/index.astro</code> y empieza.
    </p>
  </main>
</BaseLayout>
`);

write('.nvmrc', '22\n');
write('.gitignore', '.env\n.env.*\n!.env.example\nnode_modules/\ndist/\n.astro/\n*.log\n');
write('.env.example', `PUBLIC_REPO_SLUG=${repoSlug}\n${backend ? 'PUBLIC_API_BASE=\n' : ''}PUBLIC_BUILD_SHA=dev\nPUBLIC_VERSION=dev\n`);
// public/ con un favicon mínimo
write('public/favicon.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="#10b981"/></svg>\n`);

// minimal README
write('README.md', `# ${name}\n\nGenerado con create-inceptor-app (archetype: \`${archetype}\`).\n\n\`\`\`bash\nnpm install\nnpm run dev      # http://localhost:4321\nnpm run check    # gate: astro check + type-check + tests + build\n\`\`\`\n\nRecetas (auth, IA, hosting): ver el repo scaffold, carpeta \`docs/recipes/\`.\n`);

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
    environment: { name: github-pages, url: \${{ steps.deployment.outputs.page_url }} }
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

- [ ] \`src/lib/site-meta.ts\` — write ${name}'s real one-line description
      (it feeds /llms.txt, JSON-LD and the default meta description)
- [ ] \`src/pages/llms.txt.ts\` — list the real routes as they're built
- [ ] \`astro.config.mjs\` — set \`site\` to the production origin
- [ ] \`public/robots.txt\` — point Sitemap at the production sitemap URL
- [ ] \`.github/workflows/deploy.yml\` — confirm ASTRO_BASE matches the
      deploy path
- [ ] Issue templates in \`.github/ISSUE_TEMPLATE/\` — adjust labels/wording
      to this project

Conventions inherited from the scaffold: Conventional Commits + issue refs,
never push to main, every PR passes \`npm run check\`, never import
@radix-ui/* / framer-motion / @tremor/react, Nano Stores for cross-island
state (never React Context across islands).
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
}
if (archetype === 'backend-node') {
  cpSync(join(ROOT, 'server-node'), dst('server'), { recursive: true, filter: noArtifacts });
}

console.log(`✓ Listo: ${out}`);
console.log(`  cd ${out} && npm install && npm run check`);
if (backend) console.log('  backend en ./server (ver su README); PUBLIC_API_BASE → su URL');
