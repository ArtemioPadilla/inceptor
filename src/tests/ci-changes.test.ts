import { describe, expect, it } from 'vitest';
import { classify } from '../../scripts/ci-changes.mjs';

/**
 * Issue #334 — the `changes` gate. Fail-safe: heavy jobs run unless this
 * explicitly proves they are not needed (draft PR, or docs-only diff).
 */
const pr = { eventName: 'pull_request', draft: false };

describe('classify', () => {
  it('docs-only diffs do not need the heavy jobs', () => {
    expect(classify({ ...pr, files: ['docs/decisions/0001-x.md', 'SECURITY.md'] }).heavy).toBe(
      false,
    );
  });

  it('any code file makes it heavy', () => {
    expect(classify({ ...pr, files: ['docs/decisions/a.md', 'src/lib/utils.ts'] }).heavy).toBe(
      true,
    );
  });

  it('workflow and script changes are heavy', () => {
    expect(classify({ ...pr, files: ['.github/workflows/ci.yml'] }).heavy).toBe(true);
    expect(classify({ ...pr, files: ['scripts/ci-budget.mjs'] }).heavy).toBe(true);
  });

  it('markdown that tests read (CLAUDE.md, README.md, docs/COMPONENTS.md) is heavy', () => {
    for (const f of ['CLAUDE.md', 'README.md', 'docs/COMPONENTS.md', 'AGENTS.md']) {
      expect(classify({ ...pr, files: [f] }).heavy).toBe(true);
    }
  });

  it('an empty or unknown file list is heavy (fail-safe)', () => {
    expect(classify({ ...pr, files: [] }).heavy).toBe(true);
    expect(classify({ ...pr, files: undefined }).heavy).toBe(true);
  });

  it('draft PRs are not heavy, even with code changes', () => {
    expect(classify({ eventName: 'pull_request', draft: true, files: ['src/a.ts'] }).heavy).toBe(
      false,
    );
  });

  it('non-PR events are always heavy', () => {
    expect(classify({ eventName: 'push', draft: false, files: ['SECURITY.md'] }).heavy).toBe(true);
    expect(classify({ eventName: 'workflow_dispatch', draft: true, files: [] }).heavy).toBe(true);
  });
});
