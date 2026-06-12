import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, readFileSync, existsSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { readState, writeStateAtomic, updateState } from '../../scripts/state.mjs';

// Atomic state helpers (#166 deferred scope) — the crash-safe
// read-modify-write primitives used by scheduled bot workflows.
let dir: string;
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'state-'));
});
afterEach(() => rmSync(dir, { recursive: true, force: true }));

describe('state helpers', () => {
  it('readState returns the fallback for missing or corrupt files', () => {
    expect(readState(join(dir, 'nope.json'), { a: 1 })).toEqual({ a: 1 });
    writeStateAtomic(join(dir, 'bad.json'), 'x');
    // corrupt it manually
    const p = join(dir, 'corrupt.json');
    writeStateAtomic(p, {});
    writeFileSync(p, '{not json');
    expect(readState(p, null)).toBeNull();
  });

  it('writeStateAtomic round-trips JSON and leaves no temp file', () => {
    const p = join(dir, 'nested/state.json');
    writeStateAtomic(p, { runs: 2 });
    expect(JSON.parse(readFileSync(p, 'utf8'))).toEqual({ runs: 2 });
    expect(existsSync(`${p}.tmp-${process.pid}`)).toBe(false);
  });

  it('updateState applies the updater over the previous value', async () => {
    const p = join(dir, 'counter.json');
    await updateState(p, (s: { runs?: number } | null) => ({ runs: (s?.runs ?? 0) + 1 }));
    const next = await updateState(p, (s: { runs: number } | null) => ({ runs: (s?.runs ?? 0) + 1 }));
    expect(next).toEqual({ runs: 2 });
  });

  it('updateState returning undefined aborts the write (idempotent no-op)', async () => {
    const p = join(dir, 'noop.json');
    writeStateAtomic(p, { v: 1 });
    const out = await updateState(p, () => undefined);
    expect(out).toEqual({ v: 1 });
    expect(JSON.parse(readFileSync(p, 'utf8'))).toEqual({ v: 1 });
  });
});
