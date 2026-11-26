#!/usr/bin/env node
/**
 * Claude Code PreToolUse hook (opt-in, issue #334): asks for confirmation once
 * more than CI_GUARD_LIMIT (default 5) CI-triggering commands (git push, git -C d push,
 * gh pr create/merge/ready, WRITING gh api calls on pulls/merge/dispatch/rerun routes, gh workflow run, gh run rerun) ran today in this
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

// The command is split on shell separators (including newlines) and each
// segment must START with the costly command, so a string that merely mentions
// "git push" (a commit message) is not counted.
const SEGMENT_SPLIT = /&&|\|\||[;&|(\n]/;
const SIMPLE = [
  /^git\s+(?:-C\s+\S+\s+)?push\b/,
  /^gh\s+pr\s+(?:create|merge|ready)\b/,
  /^gh\s+workflow\s+run\b/,
  /^gh\s+run\s+rerun\b/,
];
const DRY_RUN = /\s(?:--dry-run|-n)(?=\s|$)/;
// `gh api` is read-only by default; it writes with an explicit mutating
// method or with any body flag (which make gh default to POST).
const API_WRITES =
  /(?:\s(?:-X|--method)[\s=]*(?:POST|PUT|PATCH|DELETE)\b|\s(?:-f|-F|--field|--raw-field|--input)\b)/i;
const API_COSTLY_ROUTES = [
  /\/pulls(?=[\s'"?]|$)/, // create a PR
  /\/pulls\/\d+\/(?:merge|update-branch)\b/,
  /\/ccr\/(?:auto_merge|ready_for_review)\b/,
  /\/actions\/workflows\/[^\s/]+\/dispatches\b/,
  /\/actions\/runs\/\d+\/(?:rerun|rerun-failed-jobs)\b/,
];
const API_MUTATIONS = /enablePullRequestAutoMerge|markPullRequestReadyForReview/;

function segmentIsCostly(seg) {
  if (/^git\s/.test(seg)) return SIMPLE[0].test(seg) && !DRY_RUN.test(seg);
  if (SIMPLE.slice(1).some((r) => r.test(seg))) return true;
  if (/^gh\s+api\b/.test(seg)) {
    if (API_MUTATIONS.test(seg)) return true;
    return API_WRITES.test(seg) && API_COSTLY_ROUTES.some((r) => r.test(seg));
  }
  return false;
}

export function isCostly(command) {
  return String(command ?? '')
    .split(SEGMENT_SPLIT)
    .some((seg) => segmentIsCostly(seg.trim()));
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
