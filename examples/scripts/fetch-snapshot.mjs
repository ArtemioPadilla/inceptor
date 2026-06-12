#!/usr/bin/env node
/**
 * fetch-snapshot.mjs — resilient JSON fetch + snapshot guard
 *
 * HOW TO USE
 * ----------
 *   node examples/scripts/fetch-snapshot.mjs \
 *     --url  https://api.example.com/data \
 *     --out  data/snapshot.json \
 *     --min-items 1
 *
 * Copy this script into scripts/ in your project and adapt the validate()
 * function to your data shape.  The fetch, retry, and guard logic should
 * require little or no change.
 *
 * DESIGN RATIONALE (lessons from mexico-weather + Watchboard)
 * -----------------------------------------------------------
 * 1. Rate limits beat naive retries.
 *    A 429 inside a 2-second exponential loop will always hit the next retry
 *    inside the same rate-limit window.  Fix: honour the Retry-After header
 *    (or wait 60 s if absent) before any retry on 429.
 *
 * 2. Stalled endpoints hang forever.
 *    fetch() has no built-in timeout; a stalled TLS handshake can block a
 *    workflow step for 9+ minutes.  Fix: AbortController + per-attempt
 *    timeout (default 30 s, configurable).
 *
 * 3. Empty responses clobber good snapshots.
 *    An upstream outage that returns '{"features":[]}' or an empty array
 *    commits the blank file; the map/table goes dark until the next run.
 *    Fix: minItems guard — refuses to write a snapshot smaller than the
 *    threshold and exits non-zero so the previous committed snapshot survives.
 *
 * 4. Untracked files never commit with `git diff`.
 *    `git diff --quiet -- file` produces no diff for never-tracked files.
 *    Fix (in the workflow): `git add` BEFORE `git diff --staged --quiet`.
 *    This script handles the fetch; the workflow handles the commit.
 *
 * 5. bash -e exempts if/then bodies.
 *    `if ! git diff --staged --quiet; then push; fi` — a failed push
 *    exits 0 silently under bash errexit.  Fix: use the subshell pattern
 *    `git diff --staged --quiet || ( git commit && git push )` or the
 *    commit-with-retry composite.
 *
 * 6. Outage policy: fail-green vs fail-red.
 *    Hard-failing a cron on a chronically flaky source paints the board red
 *    for days.  This script exits 0 with fetched=false step output when the
 *    upstream is down AND a previous snapshot exists — downstream steps are
 *    gated on the fetched output so nothing regenerates from missing input.
 *    Set --fail-on-error to flip to fail-red if you prefer that policy.
 */

import { writeFileSync, readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

// ── CLI argument parsing (no external deps) ──────────────────────────────────

const args = process.argv.slice(2);

function flag(name) {
  const i = args.indexOf(name);
  return i !== -1;
}

function option(name, defaultValue) {
  const i = args.indexOf(name);
  if (i !== -1 && args[i + 1] !== undefined) return args[i + 1];
  return defaultValue;
}

const URL_ARG = option('--url');
const OUT_ARG = option('--out');
const MIN_ITEMS = parseInt(option('--min-items', '1'), 10);
const MAX_ATTEMPTS = parseInt(option('--attempts', '5'), 10);
const TIMEOUT_MS = parseInt(option('--timeout-ms', '30000'), 10);
const SHRINK_GUARD = parseFloat(option('--shrink-guard', '0.5'));
const FAIL_ON_ERROR = flag('--fail-on-error');

if (!URL_ARG) {
  console.error('Usage: fetch-snapshot.mjs --url <url> --out <path> [--min-items N]');
  process.exit(1);
}
if (!OUT_ARG) {
  console.error('--out <path> is required');
  process.exit(1);
}

const OUT_PATH = resolve(process.cwd(), OUT_ARG);

// ── GitHub Actions step-output helper ────────────────────────────────────────

function setOutput(name, value) {
  const ghOutput = process.env.GITHUB_OUTPUT;
  if (ghOutput) {
    const line = `${name}=${value}\n`;
    writeFileSync(ghOutput, line, { flag: 'a' });
  } else {
    console.log(`::set-output name=${name}::${value}`);
  }
}

// ── Resilient fetch ───────────────────────────────────────────────────────────

/**
 * Fetch JSON from a URL with exponential backoff, Retry-After-aware 429
 * handling, and a hard per-attempt timeout.
 *
 * @param {string} url - The URL to fetch.
 * @param {object} opts
 * @param {number} opts.attempts - Maximum number of attempts (default 5).
 * @param {number} opts.timeoutMs - Per-attempt timeout in ms (default 30000).
 * @returns {Promise<unknown>} Parsed JSON response body.
 * @throws {Error} When all attempts are exhausted.
 */
async function fetchJson(url, { attempts = MAX_ATTEMPTS, timeoutMs = TIMEOUT_MS } = {}) {
  let lastError;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      console.log(`[fetch] Attempt ${attempt}/${attempts}: GET ${url}`);
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);

      if (response.status === 429) {
        // Honour Retry-After header (seconds); fall back to 60 s.
        const retryAfter = parseInt(response.headers.get('retry-after') ?? '60', 10);
        const waitMs = (isNaN(retryAfter) ? 60 : retryAfter) * 1000;
        console.warn(`[fetch] 429 Rate limited — waiting ${waitMs / 1000}s before retry`);
        if (attempt < attempts) await sleep(waitMs);
        lastError = new Error(`HTTP 429 after attempt ${attempt}`);
        continue;
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`[fetch] Success on attempt ${attempt}`);
      return data;
    } catch (err) {
      clearTimeout(timer);
      lastError = err;

      const isAbort = err instanceof Error && err.name === 'AbortError';
      if (isAbort) {
        console.warn(`[fetch] Attempt ${attempt} timed out after ${timeoutMs}ms`);
      } else {
        console.warn(`[fetch] Attempt ${attempt} failed: ${err.message}`);
      }

      if (attempt < attempts) {
        // Exponential backoff: 1 s, 2 s, 4 s … (not for 429 — handled above)
        const backoffMs = Math.min(1000 * 2 ** (attempt - 1), 30_000);
        console.log(`[fetch] Waiting ${backoffMs}ms before retry`);
        await sleep(backoffMs);
      }
    }
  }

  throw lastError ?? new Error('All fetch attempts failed');
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── Snapshot guard ────────────────────────────────────────────────────────────

/**
 * Count the items in a data payload.
 * Supports: array root, { items: [] }, { features: [] }, { data: [] }.
 * Falls back to Object.keys length for plain objects.
 *
 * @param {unknown} data - Parsed JSON payload.
 * @returns {number} Item count.
 */
function countItems(data) {
  if (Array.isArray(data)) return data.length;
  if (data && typeof data === 'object') {
    for (const key of ['items', 'features', 'data', 'results', 'records']) {
      if (Array.isArray(data[key])) return data[key].length;
    }
    return Object.keys(data).length;
  }
  return 0;
}

/**
 * Validate the fetched payload and refuse to write it if the item count is
 * below minItems or has shrunk by more than shrinkGuard relative to the
 * previous snapshot.  Exits 1 so the previous committed snapshot survives.
 *
 * TODO: extend this function with Zod or project-specific schema checks.
 *
 * @param {unknown} data - Fetched + parsed payload.
 * @param {string} outPath - Destination file (used to read the previous snapshot).
 * @param {object} opts
 * @param {number} opts.minItems - Minimum item count.
 * @param {number} opts.shrinkGuard - Maximum fractional shrink (0–1).
 */
function writeSnapshotOrDie(data, outPath, { minItems = MIN_ITEMS, shrinkGuard = SHRINK_GUARD } = {}) {
  const count = countItems(data);
  console.log(`[guard] Item count: ${count} (min: ${minItems})`);

  if (count < minItems) {
    console.error(
      `[guard] REFUSED: payload has ${count} item(s), below minimum of ${minItems}. ` +
        'Previous snapshot preserved.'
    );
    setOutput('fetched', 'false');
    process.exit(1);
  }

  if (existsSync(outPath)) {
    try {
      const prev = JSON.parse(readFileSync(outPath, 'utf-8'));
      const prevCount = countItems(prev);
      if (prevCount > 0) {
        const fraction = (prevCount - count) / prevCount;
        if (fraction > shrinkGuard) {
          console.error(
            `[guard] REFUSED: payload shrank by ${(fraction * 100).toFixed(1)}% ` +
              `(${prevCount} → ${count}), exceeds ${(shrinkGuard * 100).toFixed(0)}% guard. ` +
              'Previous snapshot preserved.'
          );
          setOutput('fetched', 'false');
          process.exit(1);
        }
      }
    } catch {
      // Previous file is unreadable/invalid — skip shrink check
      console.warn('[guard] Previous snapshot unreadable — skipping shrink check');
    }
  }

  // All guards passed — write the snapshot
  writeFileSync(outPath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
  console.log(`[guard] Written to ${outPath}`);
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  let data;
  try {
    data = await fetchJson(URL_ARG);
  } catch (err) {
    console.error(`[fetch] All attempts failed: ${err.message}`);
    setOutput('fetched', 'false');

    if (FAIL_ON_ERROR) {
      // fail-red policy: surface the error, paint cron red
      process.exit(1);
    } else {
      // fail-green policy: keep previous snapshot, gate downstream steps
      // via the fetched=false output so they don't regenerate from missing data
      console.log('[main] fail-green policy: exiting 0 with fetched=false');
      process.exit(0);
    }
  }

  writeSnapshotOrDie(data, OUT_PATH);
  setOutput('fetched', 'true');
  console.log('[main] Done. fetched=true');
}

main().catch((err) => {
  console.error('[main] Unexpected error:', err);
  process.exit(1);
});
