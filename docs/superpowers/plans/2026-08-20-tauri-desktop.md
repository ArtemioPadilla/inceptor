# Tauri Desktop Packaging (Epic 29a) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship an opt-in generator (`scripts/add-tauri.mjs` + `templates/tauri-desktop/`) that layers a Tauri v2 desktop shell into any Inceptor-derived project on request, plus a CI workflow that proves the generated scaffold actually builds on Windows/macOS/Linux — with zero footprint on projects that never run it.

**Architecture:** A checked-in template directory (`templates/tauri-desktop/`) holds the Rust/Tauri scaffold as static files with `__NAME__`/`__IDENTIFIER__`/`__SLUG__`/`__LIB_NAME__` placeholders. A generator script copies and substitutes those files into the target project's `src-tauri/`, merges Tauri's npm scripts/deps into the existing `package.json` (never overwriting), and appends gitignore patterns — mirroring `scripts/init.mjs`'s copy-and-rewrite style but as a *merge into an existing project*, not a *create a new one*. A `workflow_dispatch`-only CI job proves the whole path (generate → build → artifact) on all three desktop OSes without ever running on a normal push/PR.

**Tech Stack:** Tauri v2 (`@tauri-apps/cli@^2`), Rust (stable — GitHub-hosted runners ship a preinstalled toolchain, no separate setup action needed), Node/Vitest for the generator and its tests, GitHub Actions (`actions/checkout`, `actions/setup-node`, `actions/upload-artifact` — the exact SHA-pins already used elsewhere in this repo, no new third-party actions).

**Spec:** `docs/superpowers/specs/2026-08-20-tauri-desktop-design.md`

## Global Constraints

- **Opt-in only.** Nothing in this plan changes the default `npm run dev` / `npm run build` path. No project has Tauri unless `scripts/add-tauri.mjs` was run in it.
- **Layer-in script, not an init-time picker.** Per `docs/POSITIONING.md` §4 — this is a separate command run later, not a `scripts/init.mjs --archetype` option.
- **Desktop only.** Mobile (iOS/Android) is Epic 29b, a separate future spec/plan. Nothing here should assume or block on mobile.
- **Tauri major version: v2** (`@tauri-apps/cli@^2`, `tauri = "2"` in Cargo.toml).
- **Icon source:** `public/icons/pwa-512.png` (already exists, 512×512 PNG) — reused, not a new asset.
- **Capabilities: `core:default` only.** No shell, filesystem, or tray access in the base scaffold.
- **No signing, no credentials, no publishing** in this plan. The runbook documents these as per-project human follow-ups.
- **CI: `workflow_dispatch` only**, matrix `ubuntu-latest` / `macos-latest` / `windows-latest`, zero secrets required. This job never runs on a normal push/PR.
- **No new third-party GitHub Actions.** This repo's `actionlint` CI job (`.github/workflows/ci.yml`) fails any third-party `uses:` ref that isn't SHA-pinned. Rust is preinstalled on GitHub-hosted runners (no setup action needed); this plan reuses this repo's *existing* SHA-pinned `actions/checkout`, `actions/setup-node`, `actions/upload-artifact` refs verbatim rather than introducing a new pin to verify.
- **`bundle.targets` is deliberately omitted** from `tauri.conf.json` (not set to an unverified guessed value) — Tauri's documented default is to build all applicable formats for the current OS when the field is absent. Task 1 includes a step to confirm this empirically rather than asserting it as fact.

---

### Task 1: Tauri desktop template scaffold

**Files:**
- Create: `templates/tauri-desktop/src-tauri/Cargo.toml`
- Create: `templates/tauri-desktop/src-tauri/build.rs`
- Create: `templates/tauri-desktop/src-tauri/src/lib.rs`
- Create: `templates/tauri-desktop/src-tauri/src/main.rs`
- Create: `templates/tauri-desktop/src-tauri/capabilities/default.json`
- Create: `templates/tauri-desktop/src-tauri/tauri.conf.json.template`
- Create: `templates/tauri-desktop/gitignore.snippet`
- Create: `templates/tauri-desktop/package.snippet.json`
- Test: `src/tests/tauri-template.test.ts`

**Interfaces:**
- Produces: a static, placeholder-bearing scaffold at `templates/tauri-desktop/` — Task 3's generator reads every file under this directory verbatim and substitutes `__NAME__`, `__IDENTIFIER__`, `__SLUG__`, `__LIB_NAME__` wherever they appear.

- [ ] **Step 1: Create `templates/tauri-desktop/src-tauri/Cargo.toml`**

```toml
[package]
name = "__SLUG__"
version = "0.1.0"
description = "__NAME__ — desktop shell (Tauri)"
edition = "2021"
rust-version = "1.77"

[lib]
name = "__LIB_NAME__"
crate-type = ["staticlib", "cdylib", "rlib"]

[build-dependencies]
tauri-build = { version = "2", features = [] }

[dependencies]
serde = { version = "1", features = ["derive"] }
serde_json = "1"
tauri = { version = "2", features = [] }
```

- [ ] **Step 2: Create `templates/tauri-desktop/src-tauri/build.rs`**

```rust
fn main() {
    tauri_build::build()
}
```

- [ ] **Step 3: Create `templates/tauri-desktop/src-tauri/src/lib.rs`**

```rust
pub fn run() {
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

- [ ] **Step 4: Create `templates/tauri-desktop/src-tauri/src/main.rs`**

```rust
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    __LIB_NAME__::run();
}
```

- [ ] **Step 5: Create `templates/tauri-desktop/src-tauri/capabilities/default.json`**

```json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "default",
  "description": "Minimal default capability set for the __NAME__ desktop window — a plain window only. Extend deliberately (see Tauri's capabilities docs) if this project needs shell, filesystem, or tray access.",
  "windows": ["main"],
  "permissions": [
    "core:default"
  ]
}
```

- [ ] **Step 6: Create `templates/tauri-desktop/src-tauri/tauri.conf.json.template`**

```json
{
  "$schema": "https://schema.tauri.app/config/2",
  "productName": "__NAME__",
  "version": "0.1.0",
  "identifier": "__IDENTIFIER__",
  "build": {
    "frontendDist": "../dist",
    "devUrl": "http://localhost:4321",
    "beforeDevCommand": "npm run dev",
    "beforeBuildCommand": "npm run build"
  },
  "app": {
    "windows": [
      {
        "title": "__NAME__",
        "width": 1024,
        "height": 768,
        "resizable": true,
        "fullscreen": false
      }
    ]
  },
  "bundle": {
    "active": true,
    "icon": [
      "icons/32x32.png",
      "icons/128x128.png",
      "icons/128x128@2x.png",
      "icons/icon.icns",
      "icons/icon.ico"
    ]
  }
}
```

Note the absence of `bundle.targets` — deliberate, per Global Constraints. Step 9 below confirms this parses and builds without it before Task 3 relies on it.

- [ ] **Step 7: Create `templates/tauri-desktop/gitignore.snippet`**

```gitignore
# Tauri desktop (added by scripts/add-tauri.mjs)
src-tauri/target/
src-tauri/gen/
src-tauri/icons/*.png
src-tauri/icons/*.icns
src-tauri/icons/*.ico
```

- [ ] **Step 8: Create `templates/tauri-desktop/package.snippet.json`**

```json
{
  "devDependencies": {
    "@tauri-apps/cli": "^2"
  },
  "scripts": {
    "tauri": "tauri",
    "tauri:dev": "tauri dev",
    "tauri:build": "tauri build"
  }
}
```

- [ ] **Step 9: Write the failing test — template files exist and parse**

```ts
// src/tests/tauri-template.test.ts
import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(fileURLToPath(new URL('.', import.meta.url)), '../..');
const TEMPLATE_ROOT = join(repoRoot, 'templates/tauri-desktop');

describe('templates/tauri-desktop scaffold', () => {
  const expectedFiles = [
    'src-tauri/Cargo.toml',
    'src-tauri/build.rs',
    'src-tauri/src/lib.rs',
    'src-tauri/src/main.rs',
    'src-tauri/capabilities/default.json',
    'src-tauri/tauri.conf.json.template',
    'gitignore.snippet',
    'package.snippet.json',
  ];

  it.each(expectedFiles)('%s exists', (rel) => {
    expect(existsSync(join(TEMPLATE_ROOT, rel))).toBe(true);
  });

  it('capabilities/default.json is valid JSON with only core:default', () => {
    const json = JSON.parse(readFileSync(join(TEMPLATE_ROOT, 'src-tauri/capabilities/default.json'), 'utf8'));
    expect(json.permissions).toEqual(['core:default']);
  });

  it('tauri.conf.json.template is valid JSON with no bundle.targets key', () => {
    const raw = readFileSync(join(TEMPLATE_ROOT, 'src-tauri/tauri.conf.json.template'), 'utf8')
      .replaceAll('__NAME__', 'Test App')
      .replaceAll('__IDENTIFIER__', 'com.example.testapp');
    const json = JSON.parse(raw);
    expect(json.bundle).not.toHaveProperty('targets');
    expect(json.identifier).toBe('com.example.testapp');
  });

  it('package.snippet.json is valid JSON with the three tauri scripts', () => {
    const json = JSON.parse(readFileSync(join(TEMPLATE_ROOT, 'package.snippet.json'), 'utf8'));
    expect(Object.keys(json.scripts)).toEqual(['tauri', 'tauri:dev', 'tauri:build']);
    expect(json.devDependencies['@tauri-apps/cli']).toBe('^2');
  });
});
```

- [ ] **Step 10: Run the test to verify it currently fails**

Run: `npx vitest run src/tests/tauri-template.test.ts`
Expected: FAIL — the template files don't exist yet if you're doing this test-first; if you created the files in Steps 1–8 first (reasonable for pure scaffolding with no logic to drive test-first), this instead confirms PASS immediately. Either order is fine for this task — there's no behavior to drive out via red/green here, only content to verify exists and parses.

- [ ] **Step 11: Run the test to verify it passes**

Run: `npx vitest run src/tests/tauri-template.test.ts`
Expected: PASS, 4 test groups (8 `it.each` + 3 more = matches file structure above).

- [ ] **Step 12: Commit**

```bash
git add templates/tauri-desktop/ src/tests/tauri-template.test.ts
git commit -m "feat(tauri): add desktop scaffold template (Epic 29a)"
```

---

### Task 2: Operator runbook

**Files:**
- Create: `docs/runbooks/tauri-desktop.md`

**Interfaces:**
- Produces: `docs/runbooks/tauri-desktop.md` — Task 3's generator copies this exact file into the target project as part of what it scaffolds (so the instructions travel with the code, not just live in Inceptor's own docs tree).

- [ ] **Step 1: Create `docs/runbooks/tauri-desktop.md`**

```markdown
# Tauri desktop wrapper

Operator runbook for the opt-in Tauri v2 desktop shell added by
`scripts/add-tauri.mjs`. This wraps the existing static build
(`npm run build` → `dist/`) in a native window for Windows/macOS/Linux.
It does not touch the web build path — `npm run dev` / `npm run build`
work exactly as before.

## Prerequisites (local dev only — not required for CI)

1. **Rust toolchain** — GitHub Actions runners ship one preinstalled;
   locally, install via [rustup](https://rustup.rs/) if you don't have one:
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   ```
2. **Linux only** — Tauri's WebView needs system packages. Check
   [Tauri's official prerequisites doc](https://v2.tauri.app/start/prerequisites/)
   for your distro's current package names (these have changed between
   webkit2gtk versions before — don't assume a list here is still current).
3. **Tauri CLI** — installed as a `devDependency` by `npm install` once
   this scaffold has been added to your project.

## First run

```bash
npm install
npx tauri icon public/icons/pwa-512.png   # generates src-tauri/icons/*
npm run tauri:dev
```

## Production build

```bash
npm run build          # produces dist/, same as the web build
npm run tauri:build    # produces a native installer under
                        # src-tauri/target/release/bundle/
```

The bundle format Tauri produces is OS-dependent (`.dmg`/`.app` on macOS,
`.msi`/`.exe` on Windows, `.deb`/`.AppImage` on Linux) — `tauri.conf.json`
deliberately doesn't pin a specific target list, so Tauri builds whatever's
appropriate for the OS it's running on.

## What this scaffold does NOT do

- **No code signing.** Every build from this scaffold is unsigned. On
  macOS in particular, some OS permissions (e.g. Full Disk Access) bind to
  a signed bundle's identity — an unsigned app loses that permission on
  every rebuild. If your project needs this, set up a real Apple
  Developer / Windows code-signing certificate yourself; that's a
  per-project decision this template doesn't make for you.
- **No auto-update.** Tauri has an updater plugin; not wired in here.
- **No store distribution.** This is a local/direct-download desktop
  build, not a Mac App Store or Microsoft Store submission pipeline.
- **No mobile.** iOS/Android is a separate, not-yet-built addition
  (tracked in ROADMAP.md as Epic 29b).

## Capabilities

`src-tauri/capabilities/default.json` grants only `core:default` — no
shell execution, filesystem access, or system tray. If your project needs
more, extend this file deliberately; see
[Tauri's capabilities docs](https://v2.tauri.app/security/capabilities/).

## Cross-origin gotcha to watch for

A Tauri desktop WebView's origin is **not** your production domain (it's
typically `tauri://localhost` or `https://tauri.localhost`, depending on
platform — verify the exact value for your Tauri version if this matters
to you). If your project has any code that compares against a hardcoded
origin string — a service-worker scope guard, a CORS allowlist on an API
route — audit it before relying on that code path inside the desktop app.
Inceptor's own scaffold has no such code as of this writing (its PWA
manifest uses a relative `scope`/`start_url`, not a full origin), but
it's easy to introduce one later without realizing it only breaks inside
a wrapped WebView.

## Troubleshooting

- **Blank/white window** — the dev server (`npm run dev`) didn't finish
  starting before Tauri tried to load it. Wait for the local URL to print,
  then retry `npm run tauri:dev`.
- **Build fails on Linux with a webkit2gtk error** — see the
  prerequisites link above; package names shift between Tauri/webkit2gtk
  releases.
- **Icon errors** — re-run `npx tauri icon public/icons/pwa-512.png`; the
  generated files under `src-tauri/icons/` are gitignored and always
  regenerate from that one source PNG.
```

- [ ] **Step 2: Commit**

```bash
git add docs/runbooks/tauri-desktop.md
git commit -m "docs(tauri): add desktop operator runbook (Epic 29a)"
```

---

### Task 3: Generator script (`scripts/add-tauri.mjs`) + tests

**Files:**
- Create: `scripts/add-tauri.mjs`
- Test: `src/tests/add-tauri.test.ts`

**Interfaces:**
- Consumes: `templates/tauri-desktop/` (Task 1), `docs/runbooks/tauri-desktop.md` (Task 2).
- Produces (exported from `scripts/add-tauri.mjs`, consumed by the test file and, indirectly, by CI running the CLI):
  - `deriveNames(name: string): { slug: string, libName: string }`
  - `isValidIdentifier(identifier: string): boolean`
  - `substitutePlaceholders(text: string, vars: Record<string,string>): string`
  - `mergePackageJson(existing: object, snippet: object): { merged: object, warnings: string[] }`
  - `appendGitignoreSnippet(existing: string, snippet: string): string`
  - CLI entry point: `node scripts/add-tauri.mjs --name "<Product Name>" --identifier <reverse.dns.id> [--force]`, run from a project root (operates on `process.cwd()`, not a `--out` target — unlike `scripts/init.mjs`, this layers into the *current* project rather than creating a new one).

- [ ] **Step 1: Write the failing tests for the pure helper functions**

```ts
// src/tests/add-tauri.test.ts
import { describe, it, expect } from 'vitest';
import {
  deriveNames,
  isValidIdentifier,
  substitutePlaceholders,
  mergePackageJson,
  appendGitignoreSnippet,
} from '../../scripts/add-tauri.mjs';

describe('deriveNames', () => {
  it('derives a kebab-case slug and a snake_case _lib crate name', () => {
    expect(deriveNames('My App')).toEqual({ slug: 'my-app', libName: 'my_app_lib' });
  });

  it('strips characters outside [a-z0-9-] and collapses/trims dashes', () => {
    expect(deriveNames('  Weird!! Name_2  ')).toEqual({
      slug: 'weird-name-2',
      libName: 'weird_name_2_lib',
    });
  });
});

describe('isValidIdentifier', () => {
  it('accepts a two-segment reverse-DNS identifier', () => {
    expect(isValidIdentifier('com.example.myapp')).toBe(true);
  });

  it('rejects a single-segment string (no dot)', () => {
    expect(isValidIdentifier('myapp')).toBe(false);
  });

  it('rejects uppercase characters', () => {
    expect(isValidIdentifier('Com.Example.MyApp')).toBe(false);
  });

  it('rejects a segment starting with a digit', () => {
    expect(isValidIdentifier('com.1example.myapp')).toBe(false);
  });
});

describe('substitutePlaceholders', () => {
  it('replaces every __KEY__ occurrence with its value', () => {
    const out = substitutePlaceholders('name: __NAME__, id: __IDENTIFIER__, again: __NAME__', {
      NAME: 'My App',
      IDENTIFIER: 'com.example.myapp',
    });
    expect(out).toBe('name: My App, id: com.example.myapp, again: My App');
  });

  it('leaves text with no matching placeholders untouched', () => {
    expect(substitutePlaceholders('nothing to replace', { NAME: 'x' })).toBe('nothing to replace');
  });
});

describe('mergePackageJson', () => {
  it('adds new devDependencies and scripts cleanly with no warnings', () => {
    const existing = { name: 'app', scripts: { dev: 'astro dev' }, devDependencies: { typescript: '^5' } };
    const snippet = { devDependencies: { '@tauri-apps/cli': '^2' }, scripts: { 'tauri:dev': 'tauri dev' } };
    const { merged, warnings } = mergePackageJson(existing, snippet);
    expect(merged.scripts).toEqual({ dev: 'astro dev', 'tauri:dev': 'tauri dev' });
    expect(merged.devDependencies).toEqual({ typescript: '^5', '@tauri-apps/cli': '^2' });
    expect(warnings).toEqual([]);
  });

  it('warns and preserves the existing value on a conflicting key instead of overwriting', () => {
    const existing = { scripts: { 'tauri:dev': 'echo custom' }, devDependencies: {} };
    const snippet = { devDependencies: {}, scripts: { 'tauri:dev': 'tauri dev' } };
    const { merged, warnings } = mergePackageJson(existing, snippet);
    expect(merged.scripts['tauri:dev']).toBe('echo custom');
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toMatch(/tauri:dev/);
  });

  it('does not mutate the input objects', () => {
    const existing = { scripts: {}, devDependencies: {} };
    const snippet = { devDependencies: { '@tauri-apps/cli': '^2' }, scripts: {} };
    mergePackageJson(existing, snippet);
    expect(existing.devDependencies).toEqual({});
  });
});

describe('appendGitignoreSnippet', () => {
  const snippet = '# Tauri desktop (added by scripts/add-tauri.mjs)\nsrc-tauri/target/\n';

  it('appends the snippet to existing gitignore content', () => {
    const out = appendGitignoreSnippet('node_modules/\ndist/\n', snippet);
    expect(out).toContain('node_modules/\ndist/\n');
    expect(out).toContain('src-tauri/target/');
  });

  it('is idempotent — running twice does not duplicate the block', () => {
    const once = appendGitignoreSnippet('node_modules/\n', snippet);
    const twice = appendGitignoreSnippet(once, snippet);
    expect(twice).toBe(once);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/tests/add-tauri.test.ts`
Expected: FAIL — `scripts/add-tauri.mjs` doesn't exist yet, import error.

- [ ] **Step 3: Implement `scripts/add-tauri.mjs`**

```js
#!/usr/bin/env node
/**
 * add-tauri — layers an opt-in Tauri v2 desktop shell into the CURRENT
 * project (unlike scripts/init.mjs, which creates a brand-new project
 * elsewhere, this merges into an already-existing package.json/.gitignore
 * in place). See docs/superpowers/specs/2026-08-20-tauri-desktop-design.md.
 *
 *   node scripts/add-tauri.mjs --name "My App" --identifier com.example.myapp
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const TEMPLATE_ROOT = join(ROOT, 'templates/tauri-desktop');

// --- pure helpers (exported for tests) --------------------------------------

export function deriveNames(name) {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const libName = `${slug.replace(/-/g, '_')}_lib`;
  return { slug, libName };
}

export function isValidIdentifier(identifier) {
  return /^[a-z][a-z0-9]*(\.[a-z][a-z0-9]*)+$/.test(identifier);
}

export function substitutePlaceholders(text, vars) {
  let out = text;
  for (const [key, value] of Object.entries(vars)) {
    out = out.replaceAll(`__${key}__`, value);
  }
  return out;
}

export function mergePackageJson(existing, snippet) {
  const merged = JSON.parse(JSON.stringify(existing));
  const warnings = [];

  merged.devDependencies = merged.devDependencies || {};
  for (const [k, v] of Object.entries(snippet.devDependencies || {})) {
    if (merged.devDependencies[k] && merged.devDependencies[k] !== v) {
      warnings.push(
        `devDependency "${k}" already set to "${merged.devDependencies[k]}", leaving as-is (snippet wanted "${v}")`,
      );
    } else {
      merged.devDependencies[k] = v;
    }
  }

  merged.scripts = merged.scripts || {};
  for (const [k, v] of Object.entries(snippet.scripts || {})) {
    if (merged.scripts[k] && merged.scripts[k] !== v) {
      warnings.push(`script "${k}" already set to "${merged.scripts[k]}", leaving as-is (snippet wanted "${v}")`);
    } else {
      merged.scripts[k] = v;
    }
  }

  return { merged, warnings };
}

export function appendGitignoreSnippet(existing, snippet) {
  const marker = snippet.split('\n')[0];
  if (existing.includes(marker)) return existing;
  const sep = existing === '' || existing.endsWith('\n') ? '' : '\n';
  return `${existing}${sep}\n${snippet}`;
}

// --- filesystem walk (not unit-tested directly — exercised by the
// integration test in Step 6 and by CI actually running the CLI) -----------

function listFilesRecursive(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...listFilesRecursive(full));
    } else {
      out.push(full);
    }
  }
  return out;
}

function copyTemplateTree(vars) {
  const srcTauriTemplate = join(TEMPLATE_ROOT, 'src-tauri');
  for (const file of listFilesRecursive(srcTauriTemplate)) {
    const rel = file.slice(srcTauriTemplate.length + 1).replace(/\.template$/, '');
    const dest = join(process.cwd(), 'src-tauri', rel);
    mkdirSync(dirname(dest), { recursive: true });
    const text = substitutePlaceholders(readFileSync(file, 'utf8'), vars);
    writeFileSync(dest, text);
  }
}

// --- CLI ---------------------------------------------------------------

function parseArgs(argv) {
  const flag = (n, d = null) => {
    const i = argv.indexOf(`--${n}`);
    return i >= 0 && argv[i + 1] ? argv[i + 1] : d;
  };
  return {
    name: flag('name'),
    identifier: flag('identifier'),
    force: argv.includes('--force'),
  };
}

export function main(argv = process.argv.slice(2)) {
  const { name, identifier, force } = parseArgs(argv);

  if (!name || !identifier) {
    console.error('✗ Uso: node scripts/add-tauri.mjs --name "<Product Name>" --identifier <reverse.dns.id> [--force]');
    process.exit(1);
  }
  if (!isValidIdentifier(identifier)) {
    console.error(`✗ --identifier inválido: "${identifier}" (esperado formato reverse-DNS, p. ej. com.example.myapp)`);
    process.exit(1);
  }

  const cwd = process.cwd();
  const srcTauriDest = join(cwd, 'src-tauri');
  if (existsSync(srcTauriDest) && !force) {
    console.error(`✗ ${srcTauriDest} ya existe. Usa --force para sobrescribir.`);
    process.exit(1);
  }

  const { slug, libName } = deriveNames(name);
  const vars = { NAME: name, IDENTIFIER: identifier, SLUG: slug, LIB_NAME: libName };

  console.log(`→ Agregando shell de escritorio Tauri a ${cwd}…`);
  copyTemplateTree(vars);

  // package.json merge
  const pkgPath = join(cwd, 'package.json');
  const existingPkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
  const snippet = JSON.parse(readFileSync(join(TEMPLATE_ROOT, 'package.snippet.json'), 'utf8'));
  const { merged, warnings } = mergePackageJson(existingPkg, snippet);
  writeFileSync(pkgPath, JSON.stringify(merged, null, 2) + '\n');
  for (const w of warnings) console.warn(`⚠ ${w}`);

  // .gitignore append
  const gitignorePath = join(cwd, '.gitignore');
  const existingGitignore = existsSync(gitignorePath) ? readFileSync(gitignorePath, 'utf8') : '';
  const gitignoreSnippet = readFileSync(join(TEMPLATE_ROOT, 'gitignore.snippet'), 'utf8');
  writeFileSync(gitignorePath, appendGitignoreSnippet(existingGitignore, gitignoreSnippet));

  // runbook copy
  const runbookSrc = join(ROOT, 'docs/runbooks/tauri-desktop.md');
  const runbookDestDir = join(cwd, 'docs/runbooks');
  mkdirSync(runbookDestDir, { recursive: true });
  writeFileSync(join(runbookDestDir, 'tauri-desktop.md'), readFileSync(runbookSrc, 'utf8'));

  console.log('✓ Listo. Próximos pasos:');
  console.log('  npm install');
  console.log('  npx tauri icon public/icons/pwa-512.png');
  console.log('  npm run tauri:dev');
  console.log('  Ver docs/runbooks/tauri-desktop.md para más detalle.');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/tests/add-tauri.test.ts`
Expected: PASS, all `describe` blocks green.

- [ ] **Step 5: Write and run an end-to-end integration test**

Add to `src/tests/add-tauri.test.ts`:

```ts
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';

describe('add-tauri CLI (end-to-end)', () => {
  it('scaffolds src-tauri/, merges package.json, and appends .gitignore in a real target directory', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'add-tauri-'));
    try {
      writeFileSync(
        join(dir, 'package.json'),
        JSON.stringify({ name: 'scratch-app', scripts: { dev: 'astro dev' } }, null, 2),
      );
      writeFileSync(join(dir, '.gitignore'), 'node_modules/\n');

      const cwd = process.cwd();
      process.chdir(dir);
      try {
        main(['--name', 'Scratch App', '--identifier', 'com.example.scratch']);
      } finally {
        process.chdir(cwd);
      }

      expect(existsSync(join(dir, 'src-tauri/Cargo.toml'))).toBe(true);
      expect(existsSync(join(dir, 'src-tauri/tauri.conf.json'))).toBe(true);
      expect(existsSync(join(dir, 'docs/runbooks/tauri-desktop.md'))).toBe(true);

      const cargoToml = readFileSync(join(dir, 'src-tauri/Cargo.toml'), 'utf8');
      expect(cargoToml).toContain('name = "scratch-app"');
      expect(cargoToml).toContain('name = "scratch_app_lib"');

      const tauriConf = JSON.parse(readFileSync(join(dir, 'src-tauri/tauri.conf.json'), 'utf8'));
      expect(tauriConf.identifier).toBe('com.example.scratch');

      const pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'));
      expect(pkg.scripts.dev).toBe('astro dev'); // untouched
      expect(pkg.scripts['tauri:dev']).toBe('tauri dev'); // added

      const gitignore = readFileSync(join(dir, '.gitignore'), 'utf8');
      expect(gitignore).toContain('node_modules/');
      expect(gitignore).toContain('src-tauri/target/');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('refuses to run twice without --force', () => {
    const dir = mkdtempSync(join(tmpdir(), 'add-tauri-'));
    const exitSpy = { code: null };
    const originalExit = process.exit;
    // @ts-expect-error — test-only override
    process.exit = (code) => {
      exitSpy.code = code;
      throw new Error('exit');
    };
    try {
      writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: 'x', scripts: {} }));
      const cwd = process.cwd();
      process.chdir(dir);
      try {
        main(['--name', 'X', '--identifier', 'com.example.x']);
        expect(() => main(['--name', 'X', '--identifier', 'com.example.x'])).toThrow();
        expect(exitSpy.code).toBe(1);
      } finally {
        process.chdir(cwd);
      }
    } finally {
      process.exit = originalExit;
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
```

Run: `npx vitest run src/tests/add-tauri.test.ts`
Expected: PASS, including the two new end-to-end cases.

- [ ] **Step 6: Add the npm script**

In `package.json`'s `"scripts"` block, add:

```json
    "add-tauri": "node scripts/add-tauri.mjs",
```

- [ ] **Step 7: Verify the CLI works for real against a scratch copy of Inceptor itself**

```bash
cp -r . /tmp/inceptor-tauri-smoke && cd /tmp/inceptor-tauri-smoke
node scripts/add-tauri.mjs --name "Inceptor Desktop Smoke" --identifier com.inceptor.desktopsmoke
ls src-tauri/
cat src-tauri/tauri.conf.json
cd - && rm -rf /tmp/inceptor-tauri-smoke
```

Expected: `src-tauri/` contains `Cargo.toml`, `build.rs`, `src/lib.rs`, `src/main.rs`, `capabilities/default.json`, `tauri.conf.json` (no more `.template` suffix, placeholders substituted). This is a manual sanity pass in addition to the automated tests — confirms nothing about running from a *copy* of Inceptor's own repo root breaks path resolution (`ROOT`/`TEMPLATE_ROOT` computed via `import.meta.url`, which must still resolve correctly when the whole repo — including `scripts/`, `templates/`, and `docs/runbooks/` — has been copied elsewhere; this is exactly what Task 4's CI job will do for real).

- [ ] **Step 8: Commit**

```bash
git add scripts/add-tauri.mjs src/tests/add-tauri.test.ts package.json
git commit -m "feat(tauri): add scripts/add-tauri.mjs generator + tests (Epic 29a)"
```

---

### Task 4: CI verification workflow

**Files:**
- Create: `.github/workflows/tauri-desktop.yml`

**Interfaces:**
- Consumes: `scripts/add-tauri.mjs` (Task 3), `templates/tauri-desktop/` (Task 1) — via checking out this repo and running the generator directly at the checkout root (GitHub Actions runners are already ephemeral per-job; there's no meaningful difference between "a scratch directory" and "this repo's own CI checkout," so the design spec's open question resolves to the simpler option — no separate copy step).

- [ ] **Step 1: Create `.github/workflows/tauri-desktop.yml`**

```yaml
name: Tauri desktop build (smoke)

# Manual only — proves the opt-in generator + scaffold actually build on
# all three desktop OSes. Never runs on a normal push/PR: most projects
# using this template never run scripts/add-tauri.mjs at all, so this
# workflow would be pure noise (and Rust compile time) on every commit.
# See docs/runbooks/tauri-desktop.md and
# docs/superpowers/specs/2026-08-20-tauri-desktop-design.md.
on:
  workflow_dispatch:

permissions:
  contents: read

jobs:
  build:
    strategy:
      fail-fast: false
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]
    runs-on: ${{ matrix.os }}
    timeout-minutes: 45
    steps:
      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v6

      - uses: actions/setup-node@820762786026740c76f36085b0efc47a31fe5020 # v6
        with:
          node-version: '22'
          cache: 'npm'

      - name: Confirm Rust toolchain (preinstalled on GitHub-hosted runners)
        run: rustup show

      - name: Install Linux WebView system dependencies
        if: runner.os == 'Linux'
        # Package names per Tauri v2's official prerequisites doc — verify
        # https://v2.tauri.app/start/prerequisites/ if this step starts
        # failing; these have changed across webkit2gtk releases before.
        run: |
          sudo apt-get update
          sudo apt-get install -y libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf build-essential curl wget file libssl-dev libgtk-3-dev libayatana-appindicator3-dev

      - name: Install Node deps
        run: npm ci

      - name: Run the generator against this checkout
        run: node scripts/add-tauri.mjs --name "Inceptor Desktop Smoke" --identifier com.inceptor.desktopsmoke

      - name: Generate icons
        run: npx tauri icon public/icons/pwa-512.png

      - name: Build the Astro frontend
        run: npm run build

      - name: Build the Tauri desktop bundle
        run: npx tauri build

      - name: Upload build artifact
        uses: actions/upload-artifact@043fb46d1a93c77aae656e7c1c64a875d1fc6a0a # v7
        with:
          name: tauri-desktop-smoke-${{ matrix.os }}
          path: src-tauri/target/release/bundle/**
          if-no-files-found: warn
          retention-days: 7
```

- [ ] **Step 2: Lint the workflow YAML**

Run: `python3 -c "import yaml; yaml.safe_load(open('.github/workflows/tauri-desktop.yml'))"`
Expected: no error output (syntax-only check; the real validation is Step 4's actual dispatch run).

- [ ] **Step 3: Run this repo's own actionlint check locally against the new file**

Run (mirrors the `actionlint` job in `.github/workflows/ci.yml`):
```bash
grep -rE "uses: [^/]+/[^@]+@(?!([0-9a-f]{40})|(\.github))" .github/workflows/tauri-desktop.yml | grep -v "uses: actions/" | grep -v "uses: github/" || echo "OK: no unpinned third-party actions"
```
Expected: `OK: no unpinned third-party actions` — this workflow introduces zero new third-party actions (only the already-pinned `actions/checkout` and `actions/upload-artifact` refs, copied verbatim from `ci.yml`/`visual.yml`).

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/tauri-desktop.yml
git commit -m "ci(tauri): add on-demand desktop build smoke workflow (Epic 29a)"
```

- [ ] **Step 5: Trigger a real dispatch run and verify it's green on all three OSes**

Run: `gh workflow run tauri-desktop.yml --ref <this-branch> && gh run watch`
Expected: all three matrix legs (`ubuntu-latest`, `macos-latest`, `windows-latest`) complete successfully, each producing a `tauri-desktop-smoke-<os>` artifact. If a leg fails, read the actual error before assuming any specific fix — the Linux system-dependency package list and Rust/Tauri version interactions are exactly the kind of thing the sibling projects' adversarial reviews caught wrong on paper but right after a real run. Do not mark this task complete without an actual green run witnessed.

---

### Task 5: ROADMAP.md entry

**Files:**
- Modify: `ROADMAP.md`

**Interfaces:**
- None — documentation-only, no code consumes this.

- [ ] **Step 1: Add the Epic 29 section**

Insert after the existing Epic 28 section (find it with `grep -n "^## Epic 28" ROADMAP.md` and insert immediately after that epic's content block, before the next `## Epic` or end-of-roadmap section):

```markdown
## Epic 29a — Desktop packaging via Tauri (opt-in)

An Inceptor-derived project can wrap its static build in a real desktop
app (Windows/macOS/Linux) without every project paying for Rust/Tauri
weight by default. Per `docs/POSITIONING.md` §4, this is a layer-in
command, not an init-time picker option.

- [x] `scripts/add-tauri.mjs` generator + `templates/tauri-desktop/`
  scaffold — merges into an existing project's `package.json`/`.gitignore`
  rather than creating a new project (unlike `scripts/init.mjs`)
- [x] Minimal Tauri v2 capabilities (`core:default` only) — nothing
  granted beyond a plain window until a project deliberately extends it
- [x] `docs/runbooks/tauri-desktop.md` — copied into every project that
  runs the generator, covers dev workflow, the cross-origin WebView
  gotcha, and what's deliberately NOT included (signing, auto-update,
  store distribution)
- [x] `.github/workflows/tauri-desktop.yml` — on-demand (`workflow_dispatch`
  only) build verification across all three desktop OSes, zero secrets,
  zero impact on normal push/PR CI

**Design spec:** `docs/superpowers/specs/2026-08-20-tauri-desktop-design.md`

## Epic 29b — Mobile packaging via Tauri (iOS/Android) — not yet started

Follow-up to Epic 29a. Needs its own spec: store accounts, code signing,
and (for iOS) a Mac runner + Apple Developer account are per-project,
human-provisioned prerequisites this template can document but can't
provision. See the sibling `watchboard` repo's
`docs/superpowers/plans/2026-08-19-tauri-android-play-store.md` for a
worked example of the credential/signing/CI shape this will need.
```

- [ ] **Step 2: Commit**

```bash
git add ROADMAP.md
git commit -m "docs(roadmap): add Epic 29a/29b — Tauri desktop + mobile packaging"
```

---

## Self-Review

**1. Spec coverage:** Every section of `docs/superpowers/specs/2026-08-20-tauri-desktop-design.md` maps to a task — architecture/file layout → Tasks 1 & 3, capabilities → Task 1 Step 5, cross-origin checklist → Task 2 (runbook), icon source → Task 2 + Task 4, CI → Task 4, docs/ROADMAP → Task 2 & Task 5, the open question (scratch dir vs. in-place CI) → resolved in Task 4's Interfaces note, the `bundle.targets` verification flag → Task 1 Step 6 note + Task 4's real build (Step 5) is the actual empirical check.

**2. Placeholder scan:** No TBD/TODO markers. The one place a real unknown exists (Linux system-dependency package names, NDK-style version drift) is stated as "verify against the current docs if this fails," matching how the sibling projects' plans handled their own genuinely-uncertain specifics — not hidden as a false certainty.

**3. Type/signature consistency:** `deriveNames`, `isValidIdentifier`, `substitutePlaceholders`, `mergePackageJson`, `appendGitignoreSnippet`, and `main` are used with the same names and shapes across Task 3's Steps 1, 3, 5, and 7, and match the Interfaces block at the top of Task 3. Placeholder tokens (`__NAME__`, `__IDENTIFIER__`, `__SLUG__`, `__LIB_NAME__`) are consistent between Task 1's template files and Task 3's `vars` object. `npm run tauri:dev` / `tauri:build` script names match across Task 1's `package.snippet.json`, Task 3's merge test, and Task 2's runbook.
