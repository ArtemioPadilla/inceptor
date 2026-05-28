import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Reads CLAUDE.md relative to this test file so the path works regardless
// of where vitest is invoked from.
const md = readFileSync(
  fileURLToPath(new URL('../../CLAUDE.md', import.meta.url)),
  'utf-8',
);

describe('CLAUDE.md', () => {
  it('lists installed Astro version', () => {
    expect(md).toMatch(/astro.*5\./i);
  });

  it('mentions native /goal (Claude Code v2.1.139+)', () => {
    expect(md).toMatch(/native[^.]+\/goal|v2\.1\.139/);
  });

  it('documents the compound-component gotcha', () => {
    expect(md.toLowerCase()).toMatch(/compound[\s-]?component/);
    expect(md.toLowerCase()).toMatch(/cannot span (multiple )?islands/);
  });

  it('shows a concrete example fix', () => {
    expect(md).toMatch(/ShowcaseDialog|MyDialogIsland|client:visible/);
  });

  it('documents sub-agents prometeo / forja / centinela', () => {
    expect(md).toMatch(/prometeo/);
    expect(md).toMatch(/forja/);
    expect(md).toMatch(/centinela/);
  });
});
