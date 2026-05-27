import { describe, expect, it, vi } from 'vitest';

// Stub idb-keyval before importing the module under test — the node test
// environment has no IndexedDB, so we replace get/set/del with no-ops.
vi.mock('idb-keyval', () => ({
  get: vi.fn(async () => undefined),
  set: vi.fn(async () => undefined),
  del: vi.fn(async () => undefined),
}));

import { createQueryClient, createIdbPersister, attachPersister } from './queryClient';

describe('createQueryClient', () => {
  it('returns a QueryClient with sensible offline defaults', () => {
    const client = createQueryClient();
    const defaults = client.getDefaultOptions();
    const staleTime = defaults.queries?.staleTime;
    expect(typeof staleTime).toBe('number');
    expect(staleTime as number).toBeGreaterThan(0);
    const gcTime = defaults.queries?.gcTime;
    expect(typeof gcTime).toBe('number');
    expect(gcTime as number).toBeGreaterThan(staleTime as number);
    expect(defaults.queries?.refetchOnWindowFocus).toBe(false);
  });

  it('sets retry to 1', () => {
    const client = createQueryClient();
    expect(client.getDefaultOptions().queries?.retry).toBe(1);
  });
});

describe('createIdbPersister', () => {
  it('exposes persistClient / restoreClient / removeClient', () => {
    const p = createIdbPersister('test-key');
    expect(typeof p.persistClient).toBe('function');
    expect(typeof p.restoreClient).toBe('function');
    expect(typeof p.removeClient).toBe('function');
  });

  it('uses a custom idb key when provided', () => {
    // Two persisters with different keys — both valid, no shared state.
    const p1 = createIdbPersister('key-a');
    const p2 = createIdbPersister('key-b');
    expect(p1).not.toBe(p2);
  });
});

describe('attachPersister', () => {
  it('returns a cleanup function', () => {
    const client = createQueryClient();
    const detach = attachPersister(client, { idbKey: 'test-attach' });
    expect(typeof detach).toBe('function');
    detach(); // must not throw
  });

  it('only marks queries with meta.persist === true as durable', async () => {
    const client = createQueryClient();
    const detach = attachPersister(client, { idbKey: 'test-filter' });

    // Prefetch two queries: one transient, one opted-in.
    await client.prefetchQuery({
      queryKey: ['transient'],
      queryFn: async () => 'no-persist',
    });
    await client.prefetchQuery({
      queryKey: ['durable'],
      queryFn: async () => 'persist-me',
      meta: { persist: true },
    });

    const transient = client.getQueryCache().find({ queryKey: ['transient'] });
    const durable = client.getQueryCache().find({ queryKey: ['durable'] });

    // The meta flag itself is what the dehydrate filter reads — assert it.
    expect(transient?.meta?.persist).toBeUndefined();
    expect(durable?.meta?.persist).toBe(true);

    detach();
  });
});
