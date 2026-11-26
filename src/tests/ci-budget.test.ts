import { describe, expect, it, vi } from 'vitest';
import { evaluateBudget } from '../../scripts/ci-budget.mjs';

/**
 * Issue #334 — the daily CI budget breaker. Hard rules under test:
 *  - fails CLOSED (code 1) only when confidently over the threshold;
 *  - fails OPEN (code 0 + warning) on any API error;
 *  - the `ci:override` label bypasses it;
 *  - never runs for push/schedule/dispatch events (merges must deploy).
 */
const NOW = new Date('2026-11-26T12:00:00Z');

function api(opts: {
  total?: number;
  labels?: string[];
  runsStatus?: number;
  labelsStatus?: number;
}) {
  return vi.fn(async (url: string) => {
    if (url.includes('/actions/runs')) {
      const status = opts.runsStatus ?? 200;
      return { ok: status === 200, status, json: async () => ({ total_count: opts.total ?? 0 }) };
    }
    const status = opts.labelsStatus ?? 200;
    return {
      ok: status === 200,
      status,
      json: async () => (opts.labels ?? []).map((name) => ({ name })),
    };
  });
}

const base = {
  eventName: 'pull_request',
  repo: 'o/r',
  token: 't',
  prNumber: 7,
  limit: 100,
  now: NOW,
};

describe('evaluateBudget', () => {
  it('passes under the threshold with a single API call', async () => {
    const fetchImpl = api({ total: 10 });
    const r = await evaluateBudget({ ...base, fetchImpl });
    expect(r.code).toBe(0);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('asks only for runs created in the last 24h', async () => {
    const fetchImpl = api({ total: 1 });
    await evaluateBudget({ ...base, fetchImpl });
    const url = decodeURIComponent(String(fetchImpl.mock.calls[0]?.[0]));
    expect(url).toContain('/repos/o/r/actions/runs');
    expect(url).toContain('created=>=2026-11-25T12:00:00Z');
    expect(url).toContain('per_page=1');
    // only PR-event runs: pushes, Dependabot and issue_comment runs are not what the breaker meters
    expect(url).toContain('event=pull_request');
  });

  it('fails closed with an ::error:: when over the threshold', async () => {
    const r = await evaluateBudget({ ...base, fetchImpl: api({ total: 101 }) });
    expect(r.code).toBe(1);
    expect(r.messages.some((m) => m.level === 'error' && m.text.includes('ci:override'))).toBe(
      true,
    );
  });

  it('is not over at exactly the threshold', async () => {
    expect((await evaluateBudget({ ...base, fetchImpl: api({ total: 100 }) })).code).toBe(0);
  });

  it('ci:override label bypasses the breaker with a warning', async () => {
    const r = await evaluateBudget({
      ...base,
      fetchImpl: api({ total: 500, labels: ['ci:override'] }),
    });
    expect(r.code).toBe(0);
    expect(r.messages.some((m) => m.level === 'warning')).toBe(true);
  });

  it('fails open with a warning when the runs API errors', async () => {
    const r = await evaluateBudget({ ...base, fetchImpl: api({ runsStatus: 500 }) });
    expect(r.code).toBe(0);
    expect(r.messages.some((m) => m.level === 'warning')).toBe(true);
  });

  it('fails open when fetch throws', async () => {
    const fetchImpl = vi.fn(async () => {
      throw new Error('network');
    });
    expect((await evaluateBudget({ ...base, fetchImpl })).code).toBe(0);
  });

  it('fails open when the label lookup errors while over budget', async () => {
    const r = await evaluateBudget({ ...base, fetchImpl: api({ total: 500, labelsStatus: 403 }) });
    expect(r.code).toBe(0);
    expect(r.messages.some((m) => m.level === 'warning')).toBe(true);
  });

  it('fails open on a garbage response', async () => {
    const fetchImpl = vi.fn(async () => ({ ok: true, status: 200, json: async () => ({}) }));
    expect((await evaluateBudget({ ...base, fetchImpl })).code).toBe(0);
  });

  it.each(['push', 'schedule', 'workflow_dispatch'])('never runs on %s', async (eventName) => {
    const fetchImpl = api({ total: 9999 });
    const r = await evaluateBudget({ ...base, eventName, fetchImpl });
    expect(r.code).toBe(0);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('falls back to the default limit on a bad value', async () => {
    const r = await evaluateBudget({ ...base, limit: Number.NaN, fetchImpl: api({ total: 5 }) });
    expect(r.code).toBe(0);
  });
});
