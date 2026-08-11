#!/usr/bin/env node
/**
 * scripts/gen-registry.ts
 *
 * Generates /registry.json (shadcn `registry.json` shape — see
 * https://ui.shadcn.com/docs/registry/registry-json and
 * https://ui.shadcn.com/docs/registry/registry-item-json) from the single
 * source of truth: src/content/gallery.ts (the galleryManifest array).
 *
 * Mirrors the pattern established by scripts/gen-component-catalog.ts:
 *   - Node >=22 --experimental-strip-types imports gallery.ts directly, no
 *     build step, no jiti/tsx/esbuild dependency.
 *   - Exports a pure generateRegistry() the drift/shape test can call without
 *     touching the filesystem for the interesting part (the shape assertions
 *     do read real files on disk to confirm `files[].path` actually exists —
 *     that's the whole point of the test).
 *
 * One registry item per gallery entry (not per individual component) —
 * Epic 26 explicitly scopes this to "one registry item per gallery entry."
 * Several gallery entries bundle multiple shadcn primitives under a generic
 * directory `source` (e.g. "Primitives" -> src/components/ui/). For those we
 * use a curated MANUAL_FILES map (verified against the real directory
 * listing) rather than guessing file names from the summary string — more
 * reliable than a "best effort" text-parse for a static, slow-changing list.
 * `dependencies` (npm packages) and `registryDependencies` (other registry
 * item names) ARE best-effort static scans of each file's import
 * statements, as scoped by the issue ("doesn't need to be perfect").
 *
 * Usage:
 *   npm run gen:registry
 *   node --experimental-strip-types scripts/gen-registry.ts
 */

import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';
import type { GalleryEntry } from '../src/content/gallery.ts';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const repoRoot = join(__dirname, '..');

/** Import the gallery manifest lazily so the test can call generateRegistry() without I/O at module load. */
async function loadManifest(): Promise<GalleryEntry[]> {
  const mod = await import('../src/content/gallery.ts');
  return mod.galleryManifest;
}

/**
 * Curated overrides for gallery entries whose `source` is a generic
 * directory shared by several entries (e.g. every "primitives-ish" bucket
 * points at `src/components/ui/`). Filenames are relative to the entry's
 * base directory. Verified by hand against the real directory listing —
 * more reliable than parsing the free-text `summary` string.
 */
const MANUAL_FILES: Record<string, string[]> = {
  primitives: ['button.tsx', 'input.tsx', 'label.tsx', 'card.tsx', 'table.tsx', 'badge.tsx'],
  'form-controls': [
    'select.tsx',
    'checkbox.tsx',
    'radio-group.tsx',
    'switch.tsx',
    'slider.tsx',
    'textarea.tsx',
  ],
  advanced: [
    'toggle.tsx',
    'toggle-group.tsx',
    'number-field.tsx',
    'toolbar.tsx',
    'sheet.tsx',
    'rating.tsx',
    'tag-input.tsx',
    'input-otp.tsx',
  ],
  navigation: [
    'combobox.tsx',
    'command-palette.tsx',
    'navigation-menu.tsx',
    'menubar.tsx',
    'stepper.tsx',
  ],
  overlays: ['tooltip.tsx', 'popover.tsx', 'alert-dialog.tsx', 'hover-card.tsx', 'context-menu.tsx'],
  disclosure: [
    'accordion.tsx',
    'collapsible.tsx',
    'avatar.tsx',
    'skeleton.tsx',
    'separator.tsx',
    'scroll-area.tsx',
    'aspect-ratio.tsx',
  ],
  feedback: [
    'breadcrumb.tsx',
    'pagination.tsx',
    'alert.tsx',
    'spinner.tsx',
    'meter.tsx',
    'kbd.tsx',
    'description-list.tsx',
    'empty-state.tsx',
    'error-state.tsx',
  ],
  kpis: ['kpi-card.tsx', 'metric.tsx', 'progress-bar.tsx', 'tracker.tsx', 'callout.tsx', 'divider.tsx'],
  // "extras" reuses two components that physically live under ui/charts/.
  extras: ['tree-view.tsx', 'timeline.tsx', 'bar-list.tsx', 'charts/sparkline.tsx', 'charts/gauge.tsx'],
  pwa: ['InstallButton.tsx', 'UpdateToast.tsx'],
  // data-table's URL-state hook is a distinct file closely coupled to it.
  'data-table': ['data-table.tsx', 'use-data-table-url-state.ts'],
  // Universal input & utility primitives (ROADMAP Epic 21). calendar.tsx has
  // no gallery entry of its own — it's the rendering engine date-picker.tsx
  // composes DatePicker/DateRangePicker from — so, like data-table's coupled
  // hook file above, it's bundled here rather than left unreachable in the
  // registry. toggle-group.tsx is NOT listed here: it already has its own
  // gallery entry (`advanced`, added in PR #96) — duplicating it here would
  // violate the "no gallery entry of its own" rule above and cause the
  // auto dependency-scan to pull all of `advanced`'s files in transitively.
  'input-primitives': [
    'date-picker.tsx',
    'calendar.tsx',
    'time-picker.tsx',
    'color-picker.tsx',
    'editable.tsx',
    'password-input.tsx',
    'clipboard.tsx',
  ],
};

/** Directory entries with no MANUAL_FILES override are auto-listed (flat, non-recursive). */
const TEST_FILE_RE = /\.test\.tsx?$/;

function baseDirOf(source: string): string {
  return source.endsWith('/') ? source : source.slice(0, source.lastIndexOf('/') + 1);
}

function listDirFiles(source: string): string[] {
  const abs = join(repoRoot, source);
  return readdirSync(abs)
    .filter((f) => /\.(tsx?|jsx?)$/.test(f) && !TEST_FILE_RE.test(f))
    .sort()
    .map((f) => source + f);
}

/** Resolve the real file paths (repo-relative) a gallery entry's registry item covers. */
function resolveFiles(entry: GalleryEntry): string[] {
  const manual = MANUAL_FILES[entry.slug];
  if (manual) {
    const base = baseDirOf(entry.source);
    return manual.map((f) => base + f);
  }
  if (!entry.source.endsWith('/')) return [entry.source];
  return listDirFiles(entry.source);
}

/** shadcn registry-item.json file-object `type` — inferred from the resolved path. */
function fileType(path: string): string {
  if (/\/use-[\w-]+\.tsx?$/.test(path)) return 'registry:hook';
  if (path.includes('/components/islands/')) return 'registry:component';
  if (path.includes('/components/ui/')) return 'registry:ui';
  return 'registry:file';
}

/** shadcn registry-item.json top-level `type` for the whole item. */
function itemType(entry: GalleryEntry, files: string[]): string {
  if (files.some((f) => f.includes('/components/islands/'))) return 'registry:component';
  return 'registry:ui';
}

const IMPORT_RE = /from\s+['"]([^'"]+)['"]/g;

/** Extract bare npm package names imported by a file's source. Best-effort. */
function extractPackageDeps(source: string): Set<string> {
  const deps = new Set<string>();
  for (const m of source.matchAll(IMPORT_RE)) {
    const spec = m[1];
    if (!spec || spec.startsWith('.') || spec.startsWith('@/') || spec.startsWith('node:')) continue;
    // Scoped package (@scope/pkg[/subpath]) vs unscoped (pkg[/subpath]).
    const parts = spec.split('/');
    const pkg = spec.startsWith('@') ? `${parts[0]}/${parts[1]}` : parts[0];
    if (pkg) deps.add(pkg);
  }
  return deps;
}

/** Extract `@/components/...` imports so we can compute cross-item registryDependencies. */
function extractInternalComponentImports(source: string): string[] {
  const out: string[] = [];
  const re = /from\s+['"]@\/components\/([^'"]+)['"]/g;
  for (const m of source.matchAll(re)) {
    const frag = m[1];
    if (!frag) continue;
    const path = /\.[jt]sx?$/.test(frag) ? `src/components/${frag}` : `src/components/${frag}.tsx`;
    out.push(path);
  }
  return out;
}

/**
 * Find the index of the top-level (paren-depth-0) comma in a `light-dark()`
 * argument string, so nested calls like `oklch(1 0 0 / 15%)` don't get
 * mistaken for the light/dark separator.
 */
function topLevelCommaIndex(args: string): number {
  let depth = 0;
  for (let i = 0; i < args.length; i++) {
    const ch = args[i];
    if (ch === '(') depth++;
    else if (ch === ')') depth--;
    else if (ch === ',' && depth === 0) return i;
  }
  return -1;
}

/**
 * Parse light/dark CSS custom-property values out of global.css.
 *
 * Epic 25 (generative theming) replaced hand-duplicated `:root`/`.dark`
 * value blocks with a single `--token: light-dark(<light>, <dark>);`
 * declaration per token inside `:root` (see the comment above that block in
 * global.css) — `.dark` now only flips `color-scheme`, it no longer redeclares
 * values. So instead of splitting the file at `.dark {` (which would grab the
 * wrong, earlier `color-scheme`-only block), walk every `light-dark(...)`
 * call directly and split its two arguments at their top-level comma.
 */
function parseThemeTokens(cssContent: string): { light: Record<string, string>; dark: Record<string, string> } {
  const light: Record<string, string> = {};
  const dark: Record<string, string> = {};
  const DECL_RE = /--([\w-]+):\s*light-dark\(/g;

  for (const m of cssContent.matchAll(DECL_RE)) {
    const key = m[1];
    if (!key || m.index === undefined) continue;

    // Walk forward tracking paren depth to find this call's matching close paren.
    const argsStart = m.index + m[0].length;
    let depth = 1;
    let i = argsStart;
    while (i < cssContent.length && depth > 0) {
      if (cssContent[i] === '(') depth++;
      else if (cssContent[i] === ')') depth--;
      i++;
    }
    const args = cssContent.slice(argsStart, i - 1);

    const commaIdx = topLevelCommaIndex(args);
    if (commaIdx === -1) continue;
    light[key] = args.slice(0, commaIdx).trim();
    dark[key] = args.slice(commaIdx + 1).trim();
  }

  return { light, dark };
}

/** Which token names does this file's Tailwind utility usage reference? Best-effort. */
const UTILITY_TOKEN_RE =
  /\b(?:bg|text|border|ring|fill|stroke|from|to|via|outline|decoration|divide|accent|shadow|caret)-([a-z][a-z0-9]*(?:-[a-z0-9]+)*)\b/g;

function extractReferencedTokens(source: string, knownTokens: Set<string>): string[] {
  const found = new Set<string>();
  for (const m of source.matchAll(UTILITY_TOKEN_RE)) {
    const token = m[1];
    if (token && knownTokens.has(token)) found.add(token);
  }
  return [...found].sort();
}

interface RegistryFile {
  path: string;
  type: string;
}

interface RegistryItem {
  name: string;
  type: string;
  title: string;
  description: string;
  files: RegistryFile[];
  dependencies: string[];
  registryDependencies: string[];
  cssVars: { light?: Record<string, string>; dark?: Record<string, string> };
}

/**
 * Pure function: builds the full registry object in memory.
 * Exported so the shape test can call it without writing to disk.
 */
export async function generateRegistry(): Promise<{
  $schema: string;
  name: string;
  homepage: string;
  items: RegistryItem[];
}> {
  const manifest = await loadManifest();
  const globalCss = readFileSync(join(repoRoot, 'src/styles/global.css'), 'utf-8');
  const { light: lightTokens, dark: darkTokens } = parseThemeTokens(globalCss);
  const knownTokenNames = new Set([...Object.keys(lightTokens), ...Object.keys(darkTokens)]);

  // Pass 1: resolve every entry's file set + read source once (used for both dep scans).
  const resolved = manifest.map((entry) => {
    const files = resolveFiles(entry);
    const sources = files.map((f) => {
      try {
        return readFileSync(join(repoRoot, f), 'utf-8');
      } catch {
        return '';
      }
    });
    return { entry, files, sources };
  });

  // Build a lookup: file path -> owning gallery slug, for registryDependencies.
  const fileOwner = new Map<string, string>();
  for (const { entry, files } of resolved) {
    for (const f of files) fileOwner.set(f, entry.slug);
  }

  const items: RegistryItem[] = resolved.map(({ entry, files, sources }) => {
    const ownFiles = new Set(files);
    const deps = new Set<string>();
    const registryDeps = new Set<string>();
    const referencedTokens = new Set<string>();

    for (const src of sources) {
      for (const d of extractPackageDeps(src)) deps.add(d);
      for (const t of extractReferencedTokens(src, knownTokenNames)) referencedTokens.add(t);
      for (const importedPath of extractInternalComponentImports(src)) {
        if (ownFiles.has(importedPath)) continue;
        const owner = fileOwner.get(importedPath);
        if (owner && owner !== entry.slug) registryDeps.add(owner);
      }
    }

    const cssVars: RegistryItem['cssVars'] = {};
    if (referencedTokens.size > 0) {
      const light: Record<string, string> = {};
      const dark: Record<string, string> = {};
      for (const t of referencedTokens) {
        if (lightTokens[t]) light[t] = lightTokens[t];
        if (darkTokens[t]) dark[t] = darkTokens[t];
      }
      if (Object.keys(light).length) cssVars.light = light;
      if (Object.keys(dark).length) cssVars.dark = dark;
    }

    return {
      name: entry.slug,
      type: itemType(entry, files),
      title: entry.name,
      description: entry.summary,
      files: files.map((f) => ({ path: f, type: fileType(f) })),
      dependencies: [...deps].sort(),
      registryDependencies: [...registryDeps].sort(),
      cssVars,
    };
  });

  return {
    $schema: 'https://ui.shadcn.com/schema/registry.json',
    name: 'inceptor',
    homepage: 'https://artemiop.com',
    items,
  };
}

// When run directly (not imported by the test), write the file.
const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
  const outPath = join(repoRoot, 'registry.json');
  const registry = await generateRegistry();
  writeFileSync(outPath, `${JSON.stringify(registry, null, 2)}\n`, 'utf-8');
  console.log(`gen:registry: wrote ${outPath} (${registry.items.length} items)`);
}
