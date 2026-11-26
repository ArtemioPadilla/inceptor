import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

/**
 * #336: projects instanced from the scaffold went from issue to code with no
 * step where anyone decided what the product should look like. `dedalo` runs
 * a design round before `prometeo` plans UI work, records the decision in a
 * spec, and `centinela` refuses UI work that cites none.
 */
const read = (rel: string) => readFileSync(rel, 'utf8');

describe('design round', () => {
  it('ships the dedalo sub-agent, which never touches src/', () => {
    const agent = read('.claude/agents/dedalo.md');
    expect(agent).toMatch(/^---\nname: dedalo\n/);
    expect(agent).toMatch(/docs\/design\//);
    expect(agent).toMatch(/never (write|edit|modify)[^.]*`?src\//i);
    // The decision is the human's: the agent proposes, it does not approve.
    expect(agent).toMatch(/status: proposed/);
    expect(agent).toMatch(/never set[^.]*approved/i);
  });

  it('ships the spec template with the sections a builder needs', () => {
    const tpl = read('docs/design/TEMPLATE.md');
    expect(tpl).toMatch(/^---\n[\s\S]*status: proposed/);
    for (const heading of [
      '## Intent',
      '## Directions considered',
      '## Chosen direction',
      '## Palette',
      '## Type',
      "## The product's own idea",
      '## Layout',
      '## Requirements found in tests',
      '## Open items',
    ]) {
      expect(tpl, heading).toContain(heading);
    }
  });

  it('ships the /design command', () => {
    expect(read('.claude/commands/design.md')).toMatch(/dedalo/);
  });

  it('centinela gates UI work on an approved spec and names the exemptions', () => {
    const centinela = read('.claude/agents/centinela.md');
    expect(centinela).toMatch(/### 5\.2 Design gate/);
    expect(centinela).toMatch(/docs\/design\//);
    expect(centinela).toMatch(/status: approved/);
    expect(centinela).toMatch(/DESIGN_SPEC_MISSING/);
    expect(centinela).toMatch(/exempt/i);
  });

  it('CLAUDE.md and the docs page put dedalo before prometeo', () => {
    for (const rel of ['CLAUDE.md', 'src/content/docs/how-we-work/sub-agents.md']) {
      const md = read(rel);
      expect(md.indexOf('dedalo'), rel).toBeGreaterThan(-1);
      expect(md.indexOf('dedalo'), rel).toBeLessThan(md.indexOf('prometeo'));
    }
  });
});

describe('create-inceptor-app design round', () => {
  let dir: string;
  let out: string;
  beforeAll(() => {
    dir = mkdtempSync(join(tmpdir(), 'init-design-'));
    out = join(dir, 'app');
    execFileSync('node', ['scripts/init.mjs', '--name', 'Mi App', '--out', out], { stdio: 'pipe' });
  });
  afterAll(() => rmSync(dir, { recursive: true, force: true }));

  it('copies the agent, the command and the spec template, de-branded', () => {
    for (const rel of [
      '.claude/agents/dedalo.md',
      '.claude/commands/design.md',
      'docs/design/TEMPLATE.md',
    ]) {
      expect(existsSync(join(out, rel)), rel).toBe(true);
      expect(readFileSync(join(out, rel), 'utf8'), rel).not.toMatch(/Inceptor/);
    }
  });

  it('the generated CLAUDE.md starts the re-brand checklist with the design round', () => {
    const md = readFileSync(join(out, 'CLAUDE.md'), 'utf8');
    const checklist = md.slice(md.indexOf('Re-brand checklist'));
    const first = checklist.match(/- \[[ x]\] [^\n]*/)?.[0] ?? '';
    expect(first).toMatch(/design round/i);
    expect(md).toMatch(/dedalo \(design\)/);
  });
});
