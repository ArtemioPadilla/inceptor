/**
 * Drift guard for docs/component-catalog.md (issue #171).
 *
 * Runs the catalog generator in-memory and diffs its output against the
 * committed file. Fails with a clear "run npm run gen:catalog" message when
 * the two diverge — preventing gallery.ts changes from silently rotting the docs.
 *
 * The generator is imported directly so this test doesn't fork a child process
 * or touch the filesystem. It uses --experimental-strip-types via vitest's
 * Node runner (the script is a plain .mjs file with a TS import path that
 * vitest resolves through its own transform pipeline for the gallery module).
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Vitest (with vite-based transform) can resolve the gallery.ts import inside
// the generator even though the generator is .mjs, because vitest's resolver
// handles cross-extension imports in test mode.
import { generateCatalog } from '../../scripts/gen-component-catalog.ts';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const repoRoot = join(__dirname, '../..');
const catalogPath = join(repoRoot, 'docs/component-catalog.md');

describe('component-catalog drift (issue #171)', () => {
  it('docs/component-catalog.md is up to date with gallery.ts', async () => {
    const generated = await generateCatalog();
    const committed = readFileSync(catalogPath, 'utf-8');

    // Strip the date line before comparing so a bare re-run without gallery.ts
    // changes doesn't fail just because the date changed.
    const normalize = (s: string) =>
      s
        .split('\n')
        .filter((l) => !l.startsWith('_Last generated:'))
        .join('\n');

    const normalizedGenerated = normalize(generated);
    const normalizedCommitted = normalize(committed);

    expect(
      normalizedCommitted,
      'docs/component-catalog.md is out of date with src/content/gallery.ts.\n' +
        'Run:  npm run gen:catalog\n' +
        'Then commit the updated docs/component-catalog.md.',
    ).toBe(normalizedGenerated);
  });
});
