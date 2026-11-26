import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

/**
 * Issue #334 — CI cost guardrails ship in the template and in generated
 * projects. Text-level pins (same style as workflow-ci-hardening.test.ts).
 */
const read = (rel: string) => readFileSync(resolve(process.cwd(), rel), 'utf8');
const ci = read('.github/workflows/ci.yml');

/** Split a workflow into its top-level jobs: name -> body. */
function jobs(text: string): Record<string, string> {
  const body = text.slice(text.indexOf('\njobs:\n') + 7);
  const out: Record<string, string> = {};
  let name: string | null = null;
  for (const line of body.split('\n')) {
    const m = /^ {2}([\w-]+):\s*$/.exec(line);
    if (m) {
      name = m[1];
      out[name] = '';
    } else if (name) out[name] += line + '\n';
  }
  return out;
}

describe('ci.yml — cost-aware', () => {
  const j = jobs(ci);

  it('does not double-run on feature-branch pushes (PR covers them)', () => {
    expect(ci).not.toMatch(/'phase-\*\/\*\*'|'feat\/\*\*'/);
    expect(ci).toMatch(/push:\s+branches: \[main\]/);
  });

  it('pull_request includes ready_for_review so marking ready runs the full CI', () => {
    expect(ci).toMatch(/types: \[opened, synchronize, reopened, ready_for_review\]/);
  });

  it('cancels superseded PR runs, never main runs', () => {
    expect(ci).toContain('github.event.pull_request.number');
    expect(ci).toMatch(/cancel-in-progress: \$\{\{ github\.event_name == 'pull_request' \}\}/);
  });

  it('declares least-privilege permissions incl. actions: read for the breaker', () => {
    expect(ci).toMatch(
      /^permissions:\n {2}contents: read\n {2}actions: read\n {2}pull-requests: read/m,
    );
  });

  it('has a changes job running scripts/ci-changes.mjs', () => {
    expect(j.changes).toContain('scripts/ci-changes.mjs');
  });

  it('gates heavy work fail-safe: != false, never == true', () => {
    expect(ci).not.toMatch(/outputs\.heavy == 'true'/);
    expect(ci).toContain("needs.changes.outputs.heavy != 'false'");
    expect(ci).toContain('!cancelled()');
  });

  it.each(['build', 'actionlint', 'server-node', 'server-flask'])(
    '%s runs the budget breaker as its first non-checkout step and is never skipped by a job-level if',
    (name) => {
      const body = j[name];
      expect(body).toBeDefined();
      expect(body).toMatch(/needs: changes/);
      // Job-level `if` would turn an over-budget PR into a skipped (= passing) check.
      expect(body).not.toMatch(/^ {4}if:/m);
      const steps = body
        .slice(body.indexOf('    steps:\n'))
        .split(/\n {6}- /)
        .slice(1);
      const first = steps.find((s) => !s.startsWith('uses: actions/checkout'));
      expect(first).toContain('scripts/ci-budget.mjs');
    },
  );

  it('heavy steps are gated at step level', () => {
    expect(j.build).toMatch(
      /if: \$\{\{ !cancelled\(\) && needs\.changes\.outputs\.heavy != 'false' \}\}/,
    );
  });

  it('actions stay SHA-pinned (no new unpinned refs)', () => {
    for (const m of ci.matchAll(/uses:\s+(\S+)@(\S+)/g)) {
      if (!/^(actions|github)\//.test(m[1])) expect(m[2]).toMatch(/^[0-9a-f]{40}$/);
    }
  });
});

describe('other workflows', () => {
  it('visual.yml no longer runs on every PR/push: dispatch + schedule only', () => {
    const v = read('.github/workflows/visual.yml');
    const on = v.slice(v.indexOf('\non:'), v.indexOf('\nconcurrency:'));
    expect(on).toContain('workflow_dispatch');
    expect(on).toContain('schedule:');
    expect(on).not.toContain('pull_request');
    expect(on).not.toMatch(/\n {2}push:/);
  });

  it('tauri workflows never run on PRs', () => {
    for (const f of ['tauri-desktop.yml', 'tauri-android.yml']) {
      expect(read(`.github/workflows/${f}`)).not.toMatch(/\n {2}pull_request:/);
    }
  });

  it('deploy.yml never cancels an in-flight deploy', () => {
    expect(read('.github/workflows/deploy.yml')).toMatch(/cancel-in-progress: false/);
  });
});

describe('docs and agent wiring', () => {
  it('AGENTS.md has a CI budget section with the rules', () => {
    const a = read('AGENTS.md');
    expect(a).toMatch(/^## CI budget/m);
    for (const needle of [
      'ci:override',
      'draft',
      'validate locally',
      'update branch',
      '10',
      'stop usage',
    ]) {
      expect(a.toLowerCase()).toContain(needle.toLowerCase());
    }
  });

  it('CLAUDE.md and the three agents point to AGENTS.md', () => {
    for (const f of [
      'CLAUDE.md',
      '.claude/agents/prometeo.md',
      '.claude/agents/forja.md',
      '.claude/agents/centinela.md',
    ]) {
      expect(read(f)).toContain('AGENTS.md');
    }
  });

  it('runbook documents budget, breaker, label and the hook', () => {
    const r = read('docs/runbooks/ci-cost.md');
    for (const needle of [
      'stop usage',
      'CI_DAILY_RUN_LIMIT',
      'ci:override',
      'fails open',
      'PreToolUse',
      'required',
    ]) {
      expect(r).toContain(needle);
    }
  });

  it('ships an example settings.json wiring the hook (opt-in)', () => {
    const s = JSON.parse(read('.claude/settings.example.json'));
    expect(JSON.stringify(s)).toContain('ci-push-guard.mjs');
    expect(existsSync(resolve(process.cwd(), '.claude/settings.json'))).toBe(false);
  });
});

describe('create-inceptor-app ships the guardrails', () => {
  let dir: string;
  let stdout: string;
  const gen = (rel: string) => readFileSync(join(dir, rel), 'utf8');

  beforeAll(() => {
    dir = mkdtempSync(join(tmpdir(), 'init-cost-'));
    stdout = execFileSync(
      'node',
      ['scripts/init.mjs', '--name', 'cost-probe', '--out', dir + '/app'],
      {
        encoding: 'utf8',
      },
    );
    dir = join(dir, 'app');
  });
  afterAll(() => rmSync(join(dir, '..'), { recursive: true, force: true }));

  it('copies AGENTS.md, the runbook, scripts, hook and settings example', () => {
    for (const f of [
      'AGENTS.md',
      'docs/runbooks/ci-cost.md',
      'scripts/ci-budget.mjs',
      'scripts/ci-changes.mjs',
      '.claude/hooks/ci-push-guard.mjs',
      '.claude/settings.example.json',
    ]) {
      expect(existsSync(join(dir, f)), f).toBe(true);
    }
    expect(gen('AGENTS.md')).not.toContain('Inceptor');
  });

  it('generated CLAUDE.md points to AGENTS.md', () => {
    expect(gen('CLAUDE.md')).toContain('AGENTS.md');
  });

  it('generated ci.yml carries the breaker and the fail-safe gate', () => {
    const c = gen('.github/workflows/ci.yml');
    expect(c).toContain('scripts/ci-budget.mjs');
    expect(c).toContain("needs.changes.outputs.heavy != 'false'");
  });

  it('reminds to set an Actions budget with "stop usage"', () => {
    expect(stdout).toContain('stop usage');
    expect(gen('CLAUDE.md')).toContain('stop usage');
  });
});
