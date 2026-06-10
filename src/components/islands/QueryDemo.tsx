import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { repoStatsUrl } from '@/lib/api';
import QueryProvider from './QueryProvider';
import ErrorBoundary from './ErrorBoundary';

/** Canonical repo slug. Reads PUBLIC_REPO_SLUG when set (fork-friendly). */
const REPO = (import.meta.env.PUBLIC_REPO_SLUG as string | undefined) ?? 'ArtemioPadilla/inceptor';

interface RepoInfo {
  description: string | null;
  stargazers_count: number;
  open_issues_count: number;
}

function RepoStatsInner() {
  const { data, isLoading, error } = useQuery<RepoInfo>({
    queryKey: ['repo', 'inceptor'],
    queryFn: async () => {
      // Route through repoStatsUrl() so a self-hosted backend proxy is used
      // when PUBLIC_API_BASE is set, avoiding GitHub's 60 req/h unauthenticated cap.
      const res = await fetch(repoStatsUrl(REPO));
      if (!res.ok) throw new Error(`GitHub API ${res.status}`);
      return res.json() as Promise<RepoInfo>;
    },
    // Opt-in to IndexedDB persistence — data survives hard reloads and comes
    // back from the persisted cache before the network round-trip completes.
    meta: { persist: true },
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading repo stats…</p>;
  if (error) return <p className="text-sm text-destructive">Error: {(error as Error).message}</p>;
  if (!data) return null;

  return (
    <div className="rounded-md border border-border bg-card px-4 py-3 text-sm text-card-foreground">
      <p className="font-medium">{data.description ?? 'No description'}</p>
      <p className="mt-1 text-xs text-muted-foreground">
        ★ {data.stargazers_count} · {data.open_issues_count} open issues
      </p>
    </div>
  );
}

/**
 * Self-contained demo island: wraps its own QueryProvider so the demo can be
 * dropped onto any page without a parent provider. The query is opted-in to
 * IndexedDB persistence via meta.persist.
 *
 * Wrapped in ErrorBoundary so a flaky GitHub API call or render error
 * surfaces as a pre-filled GitHub issue rather than blanking the section.
 */
function QueryDemoInner() {
  return (
    // Dedicated idbKey avoids cache-key collisions with other islands that also
    // use the default "tanstack-query-cache" key.
    <QueryProvider idbKey="tanstack-query-cache-demo">
      <RepoStatsInner />
    </QueryProvider>
  );
}

export default function QueryDemo() {
  return (
    <ErrorBoundary name="QueryDemo">
      <QueryDemoInner />
    </ErrorBoundary>
  );
}
