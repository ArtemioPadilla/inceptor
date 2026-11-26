import { describe, expect, it } from 'vitest';
import { decide, isCostly } from '../../.claude/hooks/ci-push-guard.mjs';

/** Issue #334 — opt-in Claude Code PreToolUse hook: ask after N costly calls/day. */
describe('isCostly', () => {
  it.each([
    'git push',
    'git push origin HEAD',
    'cd x && git push -u origin feat/a',
    'gh pr merge 12 --squash',
    'gh workflow run visual.yml',
    'gh pr ready 3',
    'gh run rerun 99',
  ])('flags %s', (c) => expect(isCostly(c)).toBe(true));

  it.each([
    'git status',
    'git commit -m "git push later"',
    'gh pr view 3',
    'npm run check',
    'git pull',
  ])('ignores %s', (c) => expect(isCostly(c)).toBe(false));
});

describe('decide', () => {
  const now = new Date('2026-11-26T10:00:00Z');
  it('allows until the limit and then asks', () => {
    let state: { day: string; count: number } | undefined;
    for (let i = 0; i < 3; i++) {
      const r = decide({ command: 'git push', state, now, limit: 3 });
      expect(r.decision).toBe('allow');
      state = r.state;
    }
    const r = decide({ command: 'git push', state, now, limit: 3 });
    expect(r.decision).toBe('ask');
    expect(r.reason).toMatch(/AGENTS\.md|CI budget/);
  });

  it('does not count non-costly commands', () => {
    const r = decide({
      command: 'git status',
      state: { day: '2026-11-26', count: 99 },
      now,
      limit: 3,
    });
    expect(r.decision).toBe('allow');
    expect(r.state.count).toBe(99);
  });

  it('resets on a new day', () => {
    const r = decide({
      command: 'git push',
      state: { day: '2026-11-25', count: 99 },
      now,
      limit: 3,
    });
    expect(r.decision).toBe('allow');
    expect(r.state).toEqual({ day: '2026-11-26', count: 1 });
  });
});
