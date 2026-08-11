/**
 * Shape guard for registry.json (Epic 26).
 *
 * Runs the registry generator in-memory (no filesystem write) and asserts:
 *   1. Every item has the required shadcn registry-item.json fields.
 *   2. Every file path an item references actually exists on disk — the
 *      whole point of generating this from gallery.ts instead of hand-typing
 *      it is that it can never point at a deleted/renamed component.
 *   3. The committed root registry.json is not stale relative to gallery.ts
 *      (same drift-guard pattern as component-catalog-drift.test.ts).
 */

import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { generateRegistry } from '../../scripts/gen-registry.ts';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const repoRoot = join(__dirname, '../..');
const registryPath = join(repoRoot, 'registry.json');

describe('registry.json generation (Epic 26)', () => {
  it('produces a root registry object with $schema, name, homepage, items', async () => {
    const registry = await generateRegistry();

    expect(registry.$schema).toBe('https://ui.shadcn.com/schema/registry.json');
    expect(typeof registry.name).toBe('string');
    expect(registry.name.length).toBeGreaterThan(0);
    expect(typeof registry.homepage).toBe('string');
    expect(registry.homepage).toMatch(/^https?:\/\//);
    expect(Array.isArray(registry.items)).toBe(true);
    expect(registry.items.length).toBeGreaterThan(0);
  });

  it('every item has the required registry-item.json fields with correct shapes', async () => {
    const registry = await generateRegistry();
    const seenNames = new Set<string>();

    for (const item of registry.items) {
      expect(typeof item.name, `item.name for ${JSON.stringify(item)}`).toBe('string');
      expect(item.name.length).toBeGreaterThan(0);

      // Names must be unique — they double as registryDependencies targets.
      expect(seenNames.has(item.name), `duplicate item name: ${item.name}`).toBe(false);
      seenNames.add(item.name);

      expect(
        [
          'registry:lib',
          'registry:block',
          'registry:component',
          'registry:ui',
          'registry:hook',
          'registry:theme',
          'registry:page',
          'registry:file',
          'registry:style',
        ],
        `item.type for ${item.name}`,
      ).toContain(item.type);

      expect(typeof item.title, `item.title for ${item.name}`).toBe('string');
      expect(item.title.length).toBeGreaterThan(0);

      expect(typeof item.description, `item.description for ${item.name}`).toBe('string');
      expect(item.description.length).toBeGreaterThan(0);

      expect(Array.isArray(item.files), `item.files for ${item.name}`).toBe(true);
      expect(item.files.length, `item.files must be non-empty for ${item.name}`).toBeGreaterThan(0);

      for (const file of item.files) {
        expect(typeof file.path, `file.path for ${item.name}`).toBe('string');
        expect(typeof file.type, `file.type for ${item.name}/${file.path}`).toBe('string');
      }

      expect(Array.isArray(item.dependencies), `item.dependencies for ${item.name}`).toBe(true);
      expect(Array.isArray(item.registryDependencies), `item.registryDependencies for ${item.name}`).toBe(
        true,
      );
      expect(typeof item.cssVars, `item.cssVars for ${item.name}`).toBe('object');
    }
  });

  it('every referenced file path exists on disk', async () => {
    const registry = await generateRegistry();
    const missing: string[] = [];

    for (const item of registry.items) {
      for (const file of item.files) {
        if (!existsSync(join(repoRoot, file.path))) {
          missing.push(`${item.name} -> ${file.path}`);
        }
      }
    }

    expect(missing, `registry.json references files that do not exist:\n${missing.join('\n')}`).toEqual(
      [],
    );
  });

  it('every registryDependencies entry references a real item name in this registry', async () => {
    const registry = await generateRegistry();
    const names = new Set(registry.items.map((i) => i.name));
    const dangling: string[] = [];

    for (const item of registry.items) {
      for (const dep of item.registryDependencies) {
        if (!names.has(dep)) dangling.push(`${item.name} -> ${dep}`);
      }
    }

    expect(dangling, `registryDependencies reference unknown item names:\n${dangling.join('\n')}`).toEqual(
      [],
    );
  });

  it('scopes generic-directory entries to their curated MANUAL_FILES set, not the whole ui/ directory', async () => {
    // Regression test for the input-primitives bug: the entry's `source` is the
    // generic shared `src/components/ui/` directory (like several other entries),
    // so without a MANUAL_FILES override resolveFiles() falls back to listing
    // every file directly under that directory instead of this entry's real
    // ~8 files. Bound well below the ~75 files actually in src/components/ui/,
    // comfortably above the real curated count, so this catches "forgot to add
    // a MANUAL_FILES override" for any current or future generic-source entry.
    const registry = await generateRegistry();
    const item = registry.items.find((i) => i.name === 'input-primitives');

    expect(item, 'expected an "input-primitives" item in the generated registry').toBeDefined();
    expect(
      item!.files.length,
      `input-primitives listed ${item!.files.length} files — looks like it fell through to ` +
        'listing the entire src/components/ui/ directory instead of its curated MANUAL_FILES set',
    ).toBeLessThan(15);

    // Files that belong to entirely unrelated gallery entries must never leak in.
    const paths = item!.files.map((f) => f.path);
    for (const unrelated of ['dialog.tsx', 'table.tsx', 'tooltip.tsx']) {
      expect(
        paths.some((p) => p.endsWith(`/${unrelated}`)),
        `input-primitives should not include unrelated file ${unrelated}, got: ${paths.join(', ')}`,
      ).toBe(false);
    }
  });

  it('input-primitives does not duplicate a file already owned by another gallery entry', async () => {
    // Regression test for a second, subtler recurrence of the same bug class:
    // toggle-group.tsx has its own gallery entry (`advanced`, PR #96), but was
    // ALSO added to MANUAL_FILES['input-primitives']. That duplicate ownership
    // doesn't blow up the file count (still ~8 files) but it does make
    // resolveFiles()'s auto dependency-scan see toggle-group.tsx -> toggle.tsx
    // and add `advanced` as a whole-item registryDependency on input-primitives
    // — transitively pulling in advanced's entire file set. Generic version of
    // the file-count check above: no file input-primitives claims may already
    // be claimed by a different item.
    const registry = await generateRegistry();
    const inputPrimitives = registry.items.find((i) => i.name === 'input-primitives');
    expect(inputPrimitives, 'expected an "input-primitives" item in the generated registry').toBeDefined();

    const inputPrimitivesPaths = new Set(inputPrimitives!.files.map((f) => f.path));
    const conflicts: string[] = [];

    for (const item of registry.items) {
      if (item.name === 'input-primitives') continue;
      for (const file of item.files) {
        if (inputPrimitivesPaths.has(file.path)) {
          conflicts.push(`${file.path} (also owned by "${item.name}")`);
        }
      }
    }

    expect(
      conflicts,
      `input-primitives duplicates file(s) already owned by another item:\n${conflicts.join('\n')}`,
    ).toEqual([]);
  });

  it('the committed registry.json is up to date with gallery.ts', async () => {
    const generated = await generateRegistry();
    const committedRaw = readFileSync(registryPath, 'utf-8');
    const committed = JSON.parse(committedRaw);

    expect(
      committed,
      'registry.json is out of date with src/content/gallery.ts.\n' +
        'Run:  npm run gen:registry\n' +
        'Then commit the updated registry.json.',
    ).toEqual(generated);
  });
});
