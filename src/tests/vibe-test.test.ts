/**
 * Vibe-test harness — scoring/orchestration logic only (ROADMAP Epic 26
 * stretch item). This test does NOT call the real Anthropic API: the "model"
 * is a stubbed `generate` function returning hardcoded known-good /
 * known-bad code fixtures, so it runs in `npm run test` / `npm run check`
 * without ANTHROPIC_API_KEY and without spending API credits (see
 * docs/vibe-test.md).
 *
 * The one piece of real I/O left in is the actual `tsc` invocation inside
 * scoreGeneratedCode — that has to run for real, otherwise this test would
 * prove nothing about whether the scoring step actually catches broken code.
 */

import { describe, it, expect } from 'vitest';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { runVibeTestForComponent } from '../../scripts/vibe-test/run.ts';
import type { ComponentGuideline } from '../../scripts/vibe-test/guideline-index.ts';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const repoRoot = join(__dirname, '../..');

// A minimal, realistic fixture standing in for the real "Button" section of
// docs/component-guidelines/primitives.md — the test doesn't read the real
// file so it can't be broken by future edits to that doc's prose.
const buttonGuideline: ComponentGuideline = {
  slug: 'button',
  title: 'Button',
  file: 'primitives.md',
  category: 'primitives',
  sourcePath: 'src/components/ui/button.tsx',
  importSpecifier: '@/components/ui/button',
  content: `**Purpose**: The single button primitive for the whole app.

**API overview**:

- \`variant\`: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' (default 'default').
- \`size\`: 'default' | 'sm' | 'lg' | 'icon' (default 'default').
- All native <button> props pass through (onClick, disabled, type, aria-*, etc).`,
};

// Known-good fixture: real component, real prop, real variant value — must
// type-check clean against the real src/components/ui/button.tsx.
const GOOD_CODE = `import { Button } from '@/components/ui/button';

export default function ButtonExample() {
  return (
    <Button variant="outline" onClick={() => {}}>
      Click me
    </Button>
  );
}
`;

// Known-bad fixture: same import, but a variant value that doesn't exist in
// the real component's variant union — must fail type-checking.
const BAD_CODE = `import { Button } from '@/components/ui/button';

export default function ButtonExample() {
  return <Button variant="not-a-real-variant">Click me</Button>;
}
`;

describe('vibe-test harness scoring (ROADMAP Epic 26 stretch)', () => {
  it('passes a known-good usage example (stubbed model call)', async () => {
    const generate = async (_prompt: string) => `\`\`\`tsx\n${GOOD_CODE}\`\`\``;

    const result = await runVibeTestForComponent(buttonGuideline, generate, repoRoot);

    expect(result.pass).toBe(true);
    expect(result.diagnostics).toEqual([]);
  }, 20_000);

  it('fails a known-bad usage example and reports the real tsc diagnostic (stubbed model call)', async () => {
    const generate = async (_prompt: string) => `\`\`\`tsx\n${BAD_CODE}\`\`\``;

    const result = await runVibeTestForComponent(buttonGuideline, generate, repoRoot);

    expect(result.pass).toBe(false);
    expect(result.diagnostics.length).toBeGreaterThan(0);
    expect(result.diagnostics.some((line) => line.includes('error TS2322'))).toBe(true);
  }, 20_000);
});
