/**
 * scripts/vibe-test/score.ts
 *
 * Given a generated TSX usage example, actually type-checks it against this
 * repo's real component source (not a mock) — the whole point of the
 * vibe-test harness is measuring whether doc-only context produces code that
 * survives contact with the real compiler.
 *
 * The scratch file is written into a throwaway subdirectory under
 * `.vibe-test-tmp/` (gitignored) with its own tsconfig.json that extends the
 * repo root tsconfig — so it inherits the real "@/*" path alias, strict
 * mode, and jsx settings (TS resolves `baseUrl`/`paths` from the config that
 * originally declared them, i.e. the root tsconfig, even through `extends`),
 * but its `include` is scoped to just the one generated file, so this never
 * accidentally re-checks the whole project. The directory is deleted again
 * once scoring is done, pass or fail.
 */

import { mkdirSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';

export interface ScoreResult {
  pass: boolean;
  /** Raw `tsc` diagnostic lines (empty when pass is true). */
  diagnostics: string[];
}

/** Type-checks `code` (a generated .tsx usage example) against the real project config. */
export function scoreGeneratedCode(params: { code: string; slug: string; repoRoot: string }): ScoreResult {
  const { code, slug, repoRoot } = params;
  const runId = randomBytes(4).toString('hex');
  const scratchDir = join(repoRoot, '.vibe-test-tmp', `${slug}-${runId}`);

  mkdirSync(scratchDir, { recursive: true });

  const fileName = `${slug}.gen.tsx`;
  writeFileSync(join(scratchDir, fileName), code, 'utf-8');
  writeFileSync(
    join(scratchDir, 'tsconfig.json'),
    JSON.stringify({ extends: '../../tsconfig.json', include: [fileName] }, null, 2),
    'utf-8',
  );

  try {
    const tscBin = join(repoRoot, 'node_modules', '.bin', 'tsc');
    const command = existsSync(tscBin) ? tscBin : 'tsc';

    const result = spawnSync(command, ['-p', join(scratchDir, 'tsconfig.json'), '--noEmit', '--pretty', 'false'], {
      cwd: repoRoot,
      encoding: 'utf-8',
    });

    const output = `${result.stdout ?? ''}${result.stderr ?? ''}`;
    const diagnostics = output
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && /error TS\d+/.test(line));

    return { pass: result.status === 0, diagnostics };
  } finally {
    rmSync(scratchDir, { recursive: true, force: true });
  }
}
