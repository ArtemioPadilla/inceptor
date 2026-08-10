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
