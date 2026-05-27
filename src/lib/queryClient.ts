import { QueryClient } from '@tanstack/react-query';
import {
  persistQueryClient,
  type Persister,
} from '@tanstack/query-persist-client-core';
import { get, set, del } from 'idb-keyval';

const IDB_PERSIST_KEY = 'tanstack-query-cache';

/**
 * idb-keyval-backed Persister. Stores the whole TanStack Query cache as one
 * JSON-serializable object under a single key in IndexedDB.
 */
export function createIdbPersister(idbKey: string = IDB_PERSIST_KEY): Persister {
  return {
    persistClient: async (client) => {
      await set(idbKey, client);
    },
    restoreClient: async () => {
      return (await get(idbKey)) ?? undefined;
    },
    removeClient: async () => {
      await del(idbKey);
    },
  };
}

/**
 * Creates a QueryClient + (optionally) wires it up to persistence.
 *
 * Persistence is OPT-IN at the query level: a query opts in by setting
 *   useQuery({ queryKey, queryFn, meta: { persist: true } })
 * The dehydrate filter below excludes queries without that meta flag, so
 * the persister never touches transient queries (avatars, search-as-you-type,
 * one-off pings) that would just bloat the cache.
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Sensible offline-first defaults — long staleTime so cached data is
        // shown immediately on revisit; tweak per query if needed.
        staleTime: 5 * 60 * 1000,
        gcTime: 24 * 60 * 60 * 1000,
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  });
}

/**
 * Attach the idb-keyval persister to a QueryClient. Returns a cleanup function
 * that detaches and removes the persisted cache.
 *
 * Only queries with `meta.persist === true` are written to disk.
 */
export function attachPersister(
  client: QueryClient,
  options?: { idbKey?: string },
): () => void {
  const persister = createIdbPersister(options?.idbKey);
  const [unsubscribe] = persistQueryClient({
    queryClient: client,
    persister,
    maxAge: 24 * 60 * 60 * 1000, // 24h
    dehydrateOptions: {
      shouldDehydrateQuery: (query) =>
        Boolean(query.meta && (query.meta as { persist?: boolean }).persist),
    },
  });
  return unsubscribe;
}
