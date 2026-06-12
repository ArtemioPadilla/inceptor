/**
 * Atomic state helpers for bot/scheduled workflows (#166 — deferred scope).
 *
 * Scheduled jobs that persist JSON state in the repo (snapshots, counters,
 * caches) race against concurrent pushes. These helpers make the
 * read-modify-write step crash-safe and idempotent; pair them with the
 * `.github/actions/commit-with-retry` composite (which handles the push
 * race) and a `concurrency: main-commits` group (which serializes writers).
 *
 * Usage (inside a workflow step):
 *   node -e "import('./scripts/state.mjs').then(async ({updateState}) => {
 *     await updateState('data/counter.json', (s) => ({ runs: (s?.runs ?? 0) + 1 }));
 *   })"
 */
import { readFileSync, writeFileSync, renameSync, existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

/** Read JSON state; returns `fallback` (default null) when absent/corrupt. */
export function readState(path, fallback = null) {
  try {
    if (!existsSync(path)) return fallback;
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    // Corrupt state must not crash the job — the updater decides how to heal.
    return fallback;
  }
}

/**
 * Atomic write: serialize to a sibling temp file, then rename over the
 * target. rename(2) is atomic on POSIX, so readers never observe a torn
 * file even if the process dies mid-write.
 */
export function writeStateAtomic(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  const tmp = `${path}.tmp-${process.pid}`;
  writeFileSync(tmp, JSON.stringify(value, null, 2) + '\n', 'utf8');
  renameSync(tmp, path);
}

/**
 * Read-modify-write in one call. `update(prev)` receives the current state
 * (or null) and returns the next state; returning `undefined` aborts the
 * write (no-op), which keeps callers idempotent on "nothing changed".
 */
export async function updateState(path, update, fallback = null) {
  const prev = readState(path, fallback);
  const next = await update(prev);
  if (next === undefined) return prev;
  writeStateAtomic(path, next);
  return next;
}
