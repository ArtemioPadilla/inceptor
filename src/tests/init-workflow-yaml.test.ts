import { execFileSync } from 'node:child_process';
import { mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

/**
 * The generated deploy.yml wrote `environment: { name: github-pages, url:
 * ${{ steps.deployment.outputs.page_url }} }`. YAML forbids `{` and `}` in a
 * plain scalar inside a flow collection, so GitHub refused to parse the file
 * (every push to main showed a failed run named after the file) and
 * actionlint failed on the first PR of every generated project.
 */
const ARCHETYPES = ['static', 'backend-node', 'backend-flask'] as const;

// A mapping value written as a flow collection `{ … }` that holds an
// unquoted `${{ … }}` expression — invalid YAML.
const FLOW_WITH_EXPRESSION = /:\s*\{[^#\n]*\$\{\{/;

describe('create-inceptor-app generated workflows are valid YAML', () => {
  let dir: string;
  const workflows = (a: string) => join(dir, a, '.github', 'workflows');

  beforeAll(() => {
    dir = mkdtempSync(join(tmpdir(), 'init-yaml-'));
    for (const a of ARCHETYPES) {
      execFileSync(
        'node',
        ['scripts/init.mjs', '--name', 'yaml-probe', '--archetype', a, '--out', join(dir, a)],
        { stdio: 'pipe' },
      );
    }
  });
  afterAll(() => rmSync(dir, { recursive: true, force: true }));

  it.each(ARCHETYPES)('%s: no flow collection holds a ${{ }} expression', (a) => {
    const files = readdirSync(workflows(a)).filter((f) => /\.ya?ml$/.test(f));
    expect(files).toContain('deploy.yml');
    for (const f of files) {
      const offending = readFileSync(join(workflows(a), f), 'utf8')
        .split('\n')
        .filter((line) => FLOW_WITH_EXPRESSION.test(line));
      expect(offending, `${f} has invalid flow-style YAML`).toEqual([]);
    }
  });

  it('deploy job declares the Pages environment in block style', () => {
    const deploy = readFileSync(join(workflows('static'), 'deploy.yml'), 'utf8');
    expect(deploy).toMatch(
      /\n {4}environment:\n {6}name: github-pages\n {6}url: \$\{\{ steps\.deployment\.outputs\.page_url \}\}\n/,
    );
  });
});
