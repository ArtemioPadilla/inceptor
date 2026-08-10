/**
 * Loads the generated /registry.json (repo root, sibling to mcp-server/) and
 * cross-references it against src/content/gallery.ts to recover the
 * `category` field the shadcn registry-item.json shape doesn't carry —
 * gallery.ts is read-only here per Epic 26's scope (owned by parallel work,
 * never modified).
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** mcp-server/src -> mcp-server -> repo root. */
export const repoRoot = join(__dirname, '..', '..');

export interface RegistryFile {
  path: string;
  type: string;
}

export interface RegistryItem {
  name: string;
  type: string;
  title: string;
  description: string;
  files: RegistryFile[];
  dependencies: string[];
  registryDependencies: string[];
  cssVars: Record<string, unknown>;
}

export interface Registry {
  $schema: string;
  name: string;
  homepage: string;
  items: RegistryItem[];
}

let cachedRegistry: Registry | undefined;

/** Reads and caches registry.json from the repo root. Throws if it hasn't been generated (`npm run gen:registry`). */
export function loadRegistry(): Registry {
  if (!cachedRegistry) {
    const raw = readFileSync(join(repoRoot, 'registry.json'), 'utf-8');
    cachedRegistry = JSON.parse(raw) as Registry;
  }
  return cachedRegistry;
}

let cachedCategoryMap: Map<string, string> | undefined;

/**
 * Maps registry item name (== gallery slug) -> gallery category, by
 * dynamically importing gallery.ts. Read-only — never write to that file.
 */
export async function loadCategoryMap(): Promise<Map<string, string>> {
  if (!cachedCategoryMap) {
    const galleryPath = join(repoRoot, 'src/content/gallery.ts');
    const mod = (await import(pathToFileURL(galleryPath).href)) as {
      galleryManifest: { slug: string; category: string }[];
    };
    cachedCategoryMap = new Map(mod.galleryManifest.map((e) => [e.slug, e.category]));
  }
  return cachedCategoryMap;
}

/** Reads a registered file's real content off disk, relative to repo root. */
export function readComponentFile(relativePath: string): string {
  return readFileSync(join(repoRoot, relativePath), 'utf-8');
}
