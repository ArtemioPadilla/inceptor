import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

/**
 * create-inceptor-app copied the template's ci.yml verbatim, so every
 * generated project's CI ran `server-node` and `server-flask` jobs against
 * directories that only exist in the template (the generated backend lives in
 * `server/`) — CI was red on day one. The node backend also imports the
 * frontend's shared Zod schemas (`../../src/schemas`), which were not copied.
 */
const ARCHETYPES = ['static', 'backend-node', 'backend-flask'] as const;
type Archetype = (typeof ARCHETYPES)[number];

describe('create-inceptor-app CI and backend wiring', () => {
  let dir: string;
  const out = (a: Archetype) => join(dir, a);
  const read = (a: Archetype, rel: string) => readFileSync(join(out(a), rel), 'utf8');

  beforeAll(() => {
    dir = mkdtempSync(join(tmpdir(), 'init-ci-'));
    for (const a of ARCHETYPES) {
      execFileSync(
        'node',
        ['scripts/init.mjs', '--name', 'ci-probe', '--archetype', a, '--out', out(a)],
        {
          stdio: 'pipe',
        },
      );
    }
  });
  afterAll(() => rmSync(dir, { recursive: true, force: true }));

  it.each(ARCHETYPES)('%s: ci.yml never references template-only backend dirs', (a) => {
    const ci = read(a, '.github/workflows/ci.yml');
    expect(ci).not.toMatch(/server-node\//);
    expect(ci).not.toMatch(/server-flask\//);
  });

  it('static: has no backend job', () => {
    expect(read('static', '.github/workflows/ci.yml')).not.toMatch(/working-directory:\s*server/);
  });

  it('backend-node: tests the generated server/ with its own lockfile', () => {
    const ci = read('backend-node', '.github/workflows/ci.yml');
    expect(ci).toContain('cache-dependency-path: server/package-lock.json');
    expect(ci).toMatch(/run: npm test\s+working-directory: server/);
    expect(existsSync(join(out('backend-node'), 'server/package-lock.json'))).toBe(true);
  });

  it('backend-flask: runs pytest in server/', () => {
    const ci = read('backend-flask', '.github/workflows/ci.yml');
    expect(ci).toContain('cache-dependency-path: server/requirements-dev.txt');
    expect(ci).toMatch(/run: pytest\s+working-directory: server/);
  });

  it('backend-node: every relative import in server/src resolves inside the project', () => {
    const root = out('backend-node');
    const missing: string[] = [];
    const walk = (abs: string) => {
      for (const e of readdirSync(abs, { withFileTypes: true })) {
        const child = join(abs, e.name);
        if (e.isDirectory()) walk(child);
        else if (e.name.endsWith('.ts')) {
          for (const [, spec = ''] of readFileSync(child, 'utf8').matchAll(
            /from\s+['"](\.[^'"]+)['"]/g,
          )) {
            const base = resolve(dirname(child), spec.replace(/\.js$/, ''));
            const found = ['.ts', '/index.ts', ''].some(
              (ext) => existsSync(base + ext) && statSync(base + ext).isFile(),
            );
            if (!found) missing.push(`${child.slice(root.length + 1)} → ${spec}`);
          }
        }
      }
    };
    walk(join(root, 'server/src'));
    expect(missing).toEqual([]);
  });

  it('README tells you to commit the lockfile CI installs from', () => {
    expect(read('static', 'README.md')).toContain('package-lock.json');
  });
});
