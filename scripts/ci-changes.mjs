#!/usr/bin/env node
/**
 * `changes` gate for the heavy CI jobs (issue #334).
 *
 * Prints `heavy=true|false` to $GITHUB_OUTPUT. FAIL-SAFE: it only says `false`
 * when it can prove the heavy jobs are unnecessary (draft PR, or a diff made
 * solely of files no test/build reads). Anything unknown, empty or erroring
 * is `true`, and the workflow additionally treats a failed/absent output as
 * "run" (`!= 'false'`), so a bug here can only cost minutes, never skip checks.
 *
 * DOCS_ONLY is a deliberately short allowlist: CLAUDE.md, README.md,
 * CONTRIBUTING.md, AGENTS.md and docs/COMPONENTS.md are read by unit tests,
 * so editing them still runs the full CI. Extend it per project.
 */
import { appendFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

export const DOCS_ONLY = [
  /^docs\/decisions\//,
  /^docs\/superpowers\//,
  /^\.github\/ISSUE_TEMPLATE\//,
  /^(SETUP|ROADMAP|SECURITY|CODE_OF_CONDUCT|INTEGRATION-PLAN)\.md$/,
  /^LICENSE$/,
];

export function classify({ eventName, draft, files }) {
  if (eventName !== 'pull_request') return { heavy: true, reason: `${eventName}: always full CI` };
  if (draft) return { heavy: false, reason: 'draft PR: cheap checks only until ready_for_review' };
  if (!Array.isArray(files) || files.length === 0)
    return { heavy: true, reason: 'no file list: fail-safe' };
  if (files.every((f) => DOCS_ONLY.some((re) => re.test(f)))) {
    return { heavy: false, reason: 'docs-only diff' };
  }
  return { heavy: true, reason: 'code or test-read files changed' };
}

function main() {
  const { GITHUB_EVENT_NAME: eventName, GITHUB_OUTPUT, PR_DRAFT, BASE_REF } = process.env;
  let files;
  try {
    if (eventName === 'pull_request') {
      files = execFileSync('git', ['diff', '--name-only', `origin/${BASE_REF}...HEAD`], {
        encoding: 'utf8',
      })
        .split('\n')
        .filter(Boolean);
    }
  } catch (err) {
    console.log(
      `::warning::changes gate could not diff (${err instanceof Error ? err.message : err}); running full CI`,
    );
  }
  const { heavy, reason } = classify({ eventName, draft: PR_DRAFT === 'true', files });
  console.log(`heavy=${heavy} (${reason})`);
  if (GITHUB_OUTPUT) appendFileSync(GITHUB_OUTPUT, `heavy=${heavy}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
