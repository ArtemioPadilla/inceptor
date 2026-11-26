#!/usr/bin/env node
/**
 * Claude Code PreToolUse hook (opt-in, issue #334): asks for confirmation once
 * more than CI_GUARD_LIMIT (default 5) CI-triggering commands (git push, git -C d push,
 * gh pr create/merge/ready, gh api pulls/auto-merge, gh workflow run, gh run rerun) ran today in this
 * checkout. Wire it with `.claude/settings.example.json`.
 *
 * Never blocks outright: it answers `ask`, so the human decides. On any
 * error it allows (a broken guard must not wedge the session).
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

// Matches the command at the start or after a shell separator, so a string
// that merely mentions "git push" (a commit message) is not counted.
const COSTLY =
  /(?:^|[;&|(]\s*|&&\s*)(?:git\s+(?:-C\s+\S+\s+)?push\b|gh\s+pr\s+(?:create|merge|ready)\b|gh\s+workflow\s+run\b|gh\s+run\s+rerun\b|gh\s+api\b[^\n]*(?:\/pulls\b|enablePullRequestAutoMerge|markPullRequestReadyForReview))/;

export function isCostly(command) {
  return COSTLY.test(String(command ?? ''));
}

export function decide({ command, state, now = new Date(), limit = 5 }) {
  const day = now.toISOString().slice(0, 10);
  const cur = state && state.day === day ? state : { day, count: 0 };
  if (!isCostly(command)) return { decision: 'allow', state: cur };
  const next = { day, count: cur.count + 1 };
  if (next.count > limit) {
    return {
      decision: 'ask',
      state: next,
      reason:
        `${next.count} CI-triggering commands today (limit ${limit}). Each push/merge/dispatch costs ` +
        'Actions minutes: see "CI budget" in AGENTS.md. Validate locally and batch pushes.',
    };
  }
  return { decision: 'allow', state: next };
}

async function main() {
  try {
    let raw = '';
    for await (const chunk of process.stdin) raw += chunk;
    const input = JSON.parse(raw || '{}');
    if (input.tool_name !== 'Bash') return;
    const dir = join(tmpdir(), 'ci-push-guard');
    const file = join(
      dir,
      createHash('sha1')
        .update(process.env.CLAUDE_PROJECT_DIR || process.cwd())
        .digest('hex') + '.json',
    );
    let state;
    try {
      state = JSON.parse(readFileSync(file, 'utf8'));
    } catch {
      /* first call today */
    }
    const r = decide({
      command: input.tool_input?.command,
      state,
      limit: Number(process.env.CI_GUARD_LIMIT) || 5,
    });
    mkdirSync(dir, { recursive: true });
    writeFileSync(file, JSON.stringify(r.state));
    if (r.decision === 'ask') {
      process.stdout.write(
        JSON.stringify({
          hookSpecificOutput: {
            hookEventName: 'PreToolUse',
            permissionDecision: 'ask',
            permissionDecisionReason: r.reason,
          },
        }),
      );
    }
  } catch {
    /* fail open */
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
