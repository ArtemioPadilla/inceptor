import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { DOCS_ONLY, classify } from '../../scripts/ci-changes.mjs';

/**
 * Issue #334 — the `changes` gate. Fail-safe: heavy jobs run unless this
 * explicitly proves they are not needed (draft PR, or docs-only diff).
 */
const pr = { eventName: 'pull_request', draft: false };

describe('classify', () => {
  it('docs-only diffs do not need the heavy jobs', () => {
    expect(classify({ ...pr, files: ['docs/superpowers/plans/x.md', 'SECURITY.md'] }).heavy).toBe(
      false,
    );
  });

  it('any code file makes it heavy', () => {
    expect(classify({ ...pr, files: ['docs/superpowers/a.md', 'src/lib/utils.ts'] }).heavy).toBe(
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

describe('files that tests or the generator read are never docs-only', () => {
  it('issue templates and ADRs are heavy (tests and init.mjs read them)', () => {
    for (const f of [
      '.github/ISSUE_TEMPLATE/add_component.yml',
      'docs/decisions/0007-ai-triage-trust-model.md',
      'docs/decisions/TEMPLATE.md',
    ]) {
      expect(classify({ ...pr, files: [f] }).heavy, f).toBe(true);
    }
  });

  it('no DOCS_ONLY path is referenced by src/tests or scripts/init.mjs', () => {
    const root = process.cwd();
    const walk = (d: string): string[] =>
      readdirSync(d).flatMap((n) => {
        const p = join(d, n);
        return statSync(p).isDirectory() ? walk(p) : [p];
      });
    const corpus = [
      ...walk(resolve(root, 'src/tests')).filter((f) => !f.endsWith('ci-changes.test.ts')),
      resolve(root, 'scripts/init.mjs'),
    ]
      .map((f) => readFileSync(f, 'utf8'))
      .join('\n');
    const tracked = execFileSync('git', ['ls-files'], { cwd: root, encoding: 'utf8' })
      .split('\n')
      .filter((f) => f && DOCS_ONLY.some((re) => re.test(f)));
    expect(tracked.length).toBeGreaterThan(0);
    for (const f of tracked) {
      expect(corpus.includes(f), `${f} is read by a test`).toBe(false);
      expect(corpus.includes(dirname(f) + '/'), `${dirname(f)}/ is read by a test`).toBe(false);
    }
  });
});

describe('scripts/ci-changes.mjs against a real diff', () => {
  const run = (setup: (git: (...a: string[]) => void, dir: string) => void, extra = {}) => {
    const dir = mkdtempSync(join(tmpdir(), 'ci-changes-'));
    try {
      const git = (...a: string[]) =>
        void execFileSync('git', ['-c', 'user.email=a@b.c', '-c', 'user.name=t', ...a], {
          cwd: dir,
          stdio: 'ignore',
        });
      git('init', '-q', '-b', 'main');
      mkdirSync(join(dir, 'docs/superpowers'), { recursive: true });
      mkdirSync(join(dir, 'src/tests'), { recursive: true });
      writeFileSync(join(dir, 'docs/COMPONENTS.md'), '# components\n'.repeat(20));
      writeFileSync(join(dir, 'src/tests/a.test.ts'), 'export {};\n'.repeat(20));
      git('add', '.');
      git('commit', '-qm', 'base');
      git('update-ref', 'refs/remotes/origin/main', 'HEAD');
      git('checkout', '-qb', 'feature');
      setup(git, dir);
      git('add', '-A');
      git('commit', '-qm', 'change');
      const out = join(dir, 'out.txt');
      writeFileSync(out, '');
      execFileSync('node', [resolve(process.cwd(), 'scripts/ci-changes.mjs')], {
        cwd: dir,
        stdio: 'ignore',
        env: {
          PATH: process.env.PATH,
          GITHUB_EVENT_NAME: 'pull_request',
          GITHUB_OUTPUT: out,
          BASE_REF: 'main',
          PR_DRAFT: 'false',
          ...extra,
        },
      });
      return readFileSync(out, 'utf8');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  };

  it('moving a test-read file into an allowlisted folder is still heavy (rename)', () => {
    const out = run((git) => {
      git('mv', 'docs/COMPONENTS.md', 'docs/superpowers/COMPONENTS.md');
    });
    expect(out).toContain('heavy=true');
  });

  it('moving a test file into an allowlisted folder is still heavy (rename)', () => {
    const out = run((git) => {
      git('mv', 'src/tests/a.test.ts', 'docs/superpowers/a.md');
    });
    expect(out).toContain('heavy=true');
  });

  it('a pure docs-only change is not heavy', () => {
    const out = run((_git, dir) => {
      writeFileSync(join(dir, 'docs/superpowers/new.md'), 'x\n');
    });
    expect(out).toContain('heavy=false');
    expect(out).toContain('draft=false');
  });

  it('emits draft=true on a draft PR', () => {
    const out = run((_git, dir) => writeFileSync(join(dir, 'docs/superpowers/new.md'), 'x\n'), {
      PR_DRAFT: 'true',
    });
    expect(out).toContain('draft=true');
  });
});
