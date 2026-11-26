#!/usr/bin/env node
/**
 * Daily CI budget breaker (issue #334).
 *
 * Counts the workflow runs created in the last 24h with ONE REST call
 * (`GET /repos/{repo}/actions/runs?per_page=1` -> total_count) and fails the
 * calling job when the count is confidently over CI_DAILY_RUN_LIMIT.
 *
 * Why it FAILS instead of skipping: a job skipped by `if` reports success and
 * satisfies a required status check, so a "skip when over budget" breaker
 * would let PRs merge unchecked. Every required job runs this as its first
 * step so the check goes red instead.
 *
 * Fail-open on purpose: any API/parse error only warns. A broken breaker must
 * never block the team. Fail-closed only when the number is known and over.
 *
 * Needs only GITHUB_TOKEN with `actions: read` (+ `pull-requests: read` for
 * the label lookup, done only when already over the limit).
 * Never runs for push/schedule/dispatch: merges to main must still deploy.
 */
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export const DEFAULT_LIMIT = 200;
export const OVERRIDE_LABEL = 'ci:override';

export async function evaluateBudget({
  eventName,
  repo,
  token,
  prNumber,
  limit,
  fetchImpl = fetch,
  now = new Date(),
  apiUrl = 'https://api.github.com',
}) {
  const messages = [];
  const say = (level, text) => messages.push({ level, text });
  const open = (text) => {
    say('warning', `CI budget breaker failed open: ${text}`);
    return { code: 0, messages };
  };

  if (eventName !== 'pull_request') {
    say('notice', `CI budget breaker only applies to pull_request (got ${eventName}); skipping.`);
    return { code: 0, messages };
  }
  const max = Number.isFinite(limit) && limit > 0 ? limit : DEFAULT_LIMIT;
  const headers = {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${token}`,
    'X-GitHub-Api-Version': '2022-11-28',
  };
  const since = new Date(now.getTime() - 24 * 3600 * 1000).toISOString().replace(/\.\d+Z$/, 'Z');

  let total;
  try {
    const res = await fetchImpl(
      `${apiUrl}/repos/${repo}/actions/runs?created=${encodeURIComponent(`>=${since}`)}&per_page=1`,
      { headers },
    );
    if (!res.ok) return open(`runs API answered HTTP ${res.status}`);
    total = (await res.json()).total_count;
  } catch (err) {
    return open(`runs API unreachable (${err instanceof Error ? err.message : String(err)})`);
  }
  if (!Number.isInteger(total)) return open('runs API returned no total_count');

  if (total <= max) {
    say('notice', `CI budget OK: ${total}/${max} workflow runs in the last 24h.`);
    return { code: 0, messages };
  }

  // Over the limit: only now spend a second call to look for the override.
  try {
    const res = await fetchImpl(`${apiUrl}/repos/${repo}/issues/${prNumber}/labels?per_page=100`, {
      headers,
    });
    if (!res.ok) return open(`label lookup answered HTTP ${res.status}`);
    const labels = await res.json();
    if (Array.isArray(labels) && labels.some((l) => l?.name === OVERRIDE_LABEL)) {
      say(
        'warning',
        `CI budget exceeded (${total}/${max}) but the "${OVERRIDE_LABEL}" label bypasses the breaker.`,
      );
      return { code: 0, messages };
    }
  } catch (err) {
    return open(`label lookup unreachable (${err instanceof Error ? err.message : String(err)})`);
  }

  say(
    'error',
    `CI budget exceeded: ${total} workflow runs in the last 24h (limit ${max}, CI_DAILY_RUN_LIMIT). ` +
      `Stop pushing; see docs/runbooks/ci-cost.md. A maintainer can bypass with the "${OVERRIDE_LABEL}" label.`,
  );
  return { code: 1, messages };
}

async function main() {
  const env = process.env;
  let prNumber;
  try {
    prNumber = JSON.parse(readFileSync(env.GITHUB_EVENT_PATH, 'utf8')).pull_request?.number;
  } catch {
    /* no payload: the label lookup is then skipped by fail-open below */
  }
  const { code, messages } = await evaluateBudget({
    eventName: env.GITHUB_EVENT_NAME,
    repo: env.GITHUB_REPOSITORY,
    token: env.GITHUB_TOKEN,
    prNumber,
    limit: Number(env.CI_DAILY_RUN_LIMIT || DEFAULT_LIMIT),
    apiUrl: env.GITHUB_API_URL || undefined,
  });
  for (const m of messages) console.log(`::${m.level}::${m.text}`);
  process.exit(code);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
