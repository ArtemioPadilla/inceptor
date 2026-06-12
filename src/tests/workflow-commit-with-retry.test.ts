/**
 * Validates the commit-with-retry composite action structure from issue #166.
 *
 * Tests read the action.yml and README.md as text — no runtime dependency
 * on GitHub Actions.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect } from 'vitest';

const ACTION_PATH = resolve(
  process.cwd(),
  '.github/actions/commit-with-retry/action.yml',
);
const README_PATH = resolve(
  process.cwd(),
  '.github/actions/commit-with-retry/README.md',
);

const action = readFileSync(ACTION_PATH, 'utf-8');
const readme = readFileSync(README_PATH, 'utf-8');

describe('commit-with-retry composite action (#166)', () => {
  // -------------------------------------------------------------------------
  // action.yml structure
  // -------------------------------------------------------------------------
  it('is a composite action', () => {
    expect(action).toContain("using: composite");
  });

  it('declares required inputs: paths, message', () => {
    expect(action).toContain('paths:');
    expect(action).toContain('message:');
  });

  it('has an attempts input with default of 5', () => {
    expect(action).toContain('attempts:');
    expect(action).toContain("default: '5'");
  });

  it('outputs the pushed commit SHA', () => {
    expect(action).toContain('sha:');
  });

  it('uses git pull --rebase between push attempts', () => {
    expect(action).toContain('git pull --rebase origin main');
  });

  it('aborts rebase on conflict instead of leaving dirty state', () => {
    expect(action).toContain('git rebase --abort');
  });

  it('includes random jitter sleep between attempts', () => {
    // RANDOM % N produces jitter
    expect(action).toContain('RANDOM');
    expect(action).toContain('sleep');
  });

  it('exits 1 (never silently) when all attempts exhausted', () => {
    expect(action).toContain('exit 1');
    // Must not contain the "non-fatal" pattern from Watchboard
    expect(action).not.toContain('non-fatal');
  });

  it('is a no-op (no commit) when working tree is clean', () => {
    expect(action).toContain('git diff --cached --quiet');
    expect(action).toContain('committed=false');
  });

  it('configures git user identity before committing', () => {
    expect(action).toContain('git config user.name');
    expect(action).toContain('git config user.email');
  });

  // -------------------------------------------------------------------------
  // README documents concurrency group patterns
  // -------------------------------------------------------------------------
  it('README documents the main-commits concurrency group', () => {
    expect(readme).toContain('main-commits');
    expect(readme).toContain('cancel-in-progress: false');
  });

  it('README documents why long pipelines should use a self-group', () => {
    // The README must warn against putting long jobs in the shared group
    expect(readme).toContain('Pattern B');
    expect(readme).toContain('cancel-in-progress: true');
  });

  it('README explains why exit 1 is used instead of echo non-fatal', () => {
    expect(readme).toContain('non-fatal');
    expect(readme).toContain('exit 1');
  });

  it('README documents the random jitter rationale', () => {
    expect(readme).toContain('jitter');
    expect(readme).toContain('RANDOM');
  });

  it('README references issue #166', () => {
    expect(readme).toContain('#166');
  });
});
