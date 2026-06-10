import { describe, it, expect } from 'vitest';
import { shouldPersistQuery } from './queryClient';

/**
 * Regression guard for the production DataCloneError: TanStack v5 dehydrates
 * pending queries by default, and a pending query's dehydrated form carries
 * its in-flight `promise` — which IndexedDB structured clone rejects.
 * `shouldPersistQuery` must therefore exclude anything not settled
 * successfully, even when the query opted into persistence.
 */
describe('shouldPersistQuery', () => {
  const q = (status: string, persist?: boolean) => ({
    state: { status },
    meta: persist === undefined ? undefined : { persist },
  });

  it('persists successful queries that opted in', () => {
    expect(shouldPersistQuery(q('success', true))).toBe(true);
  });

  it('never persists pending queries (DataCloneError regression)', () => {
    expect(shouldPersistQuery(q('pending', true))).toBe(false);
  });

  it('never persists errored queries', () => {
    expect(shouldPersistQuery(q('error', true))).toBe(false);
  });

  it('skips queries that did not opt in via meta.persist', () => {
    expect(shouldPersistQuery(q('success', false))).toBe(false);
    expect(shouldPersistQuery(q('success'))).toBe(false);
  });
});
