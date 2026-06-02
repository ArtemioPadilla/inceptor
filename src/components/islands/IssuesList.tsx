import * as React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import QueryProvider from './QueryProvider';
import ErrorBoundary from './ErrorBoundary';
import { githubIssuesUrl } from '@/lib/api';

interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  html_url: string;
  state: 'open' | 'closed';
  user: { login: string; avatar_url: string };
  labels: { id: number; name: string; color: string }[];
  created_at: string;
  // The GitHub issues endpoint returns PRs alongside issues; the presence of
  // this field is the canonical way to distinguish them.
  pull_request?: { url: string };
}

const REPO = 'ArtemioPadilla/inceptor';

function IssuesListInner() {
  const queryClient = useQueryClient();
  const queryKey = ['issues', REPO, 'open'] as const;

  const { data, isLoading, error } = useQuery<GitHubIssue[]>({
    queryKey,
    queryFn: async () => {
      const res = await fetch(githubIssuesUrl(REPO, 'open', 30));
      if (!res.ok) throw new Error(`GitHub API ${res.status}`);
      const json = (await res.json()) as GitHubIssue[];
      // Filter out PRs (the issues API includes them with .pull_request)
      return json.filter((item) => !item.pull_request);
    },
    // Opt-in to IndexedDB persistence — data survives hard reloads and is
    // served from the persisted cache before the network round-trip completes.
    meta: { persist: true },
    staleTime: 60_000,
  });

  if (isLoading) return <IssuesSkeleton />;
  if (error) return (
    <IssuesError
      message={(error as Error).message}
      onRetry={() => queryClient.invalidateQueries({ queryKey })}
    />
  );
  if (!data || data.length === 0) return <IssuesEmpty />;

  return (
    <ul className="space-y-3" aria-label={`Open issues for ${REPO}`}>
      {data.map((issue) => (
        <li
          key={issue.id}
          className="rounded-lg border border-border bg-card p-4 text-card-foreground"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <a
                href={issue.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium hover:underline"
              >
                #{issue.number} · {issue.title}
              </a>
              <p className="mt-1 text-xs text-muted-foreground">
                opened by{' '}
                <span className="font-medium text-foreground">{issue.user.login}</span>
              </p>
            </div>
            {issue.labels.length > 0 && (
              <ul className="flex flex-wrap gap-1.5" aria-label="labels">
                {issue.labels.map((label) => (
                  <li key={label.id}>
                    <span
                      className="inline-block rounded-full border border-border px-2 py-0.5 text-[10px] font-medium"
                      style={{
                        backgroundColor: `#${label.color}20`,
                        borderColor: `#${label.color}40`,
                      }}
                    >
                      {label.name}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

function IssuesSkeleton() {
  return (
    <ul className="space-y-3" aria-busy="true" aria-live="polite">
      {[0, 1, 2].map((i) => (
        <li
          key={i}
          className="h-20 animate-pulse rounded-lg border border-border bg-muted/40"
        />
      ))}
    </ul>
  );
}

function IssuesError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div
      className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
      role="alert"
    >
      <p>Could not load issues: {message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-2 inline-flex items-center rounded-md border border-destructive/40 bg-destructive/20 px-3 py-1 text-xs font-medium text-destructive hover:bg-destructive/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive"
      >
        Retry
      </button>
    </div>
  );
}

function IssuesEmpty() {
  return (
    <p className="rounded-lg border border-border bg-card px-4 py-6 text-center text-sm text-muted-foreground">
      No open issues.
    </p>
  );
}

/**
 * Self-contained island: fetches open GitHub issues for this repo and renders
 * them with loading/error/empty states. Wraps its own QueryProvider so it can
 * be dropped onto any page without a parent provider.
 *
 * Uses a dedicated idbKey so its IndexedDB bucket does not collide with other
 * demos (e.g. QueryDemo uses the default key).
 */
export default function IssuesList() {
  return (
    <QueryProvider idbKey="tanstack-query-cache-issues">
      <ErrorBoundary name="IssuesList">
        <IssuesListInner />
      </ErrorBoundary>
    </QueryProvider>
  );
}
