import * as React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import QueryProvider from './QueryProvider';
import ErrorBoundary from './ErrorBoundary';
import { KpiCard } from '@/components/ui/kpi-card';
import { Metric } from '@/components/ui/metric';
import { Callout } from '@/components/ui/callout';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart, DonutChart } from '@/components/ui/charts';
import { Sparkline } from '@/components/ui/charts/sparkline';
import { Gauge } from '@/components/ui/charts/gauge';
import { BarList } from '@/components/ui/bar-list';
import { DataTable } from '@/components/ui/data-table';
import type { ColumnDef } from '@tanstack/react-table';
import { githubIssuesUrl } from '@/lib/api';

// The repo whose GitHub Issues drive the live data on the dashboard.
const REPO = 'ArtemioPadilla/inceptor';

interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  html_url: string;
  state: 'open' | 'closed';
  user: { login: string };
  labels: { id: number; name: string; color: string }[];
  created_at: string;
  // pull_request key exists only when the item is a PR, not an issue.
  pull_request?: { url: string };
}

/**
 * Structured error thrown by the queryFn when the GitHub API returns a
 * non-2xx status. We attach `status` and `rateLimitReset` so the error
 * display component can render actionable copy instead of a raw message.
 *
 * We avoid using an `interface` here because this type never crosses a
 * network / storage / worker boundary — it stays in-memory within the island.
 */
class GitHubApiError extends Error {
  readonly status: number;
  /** Unix epoch seconds from X-RateLimit-Reset, or undefined if header absent. */
  readonly rateLimitReset: number | undefined;

  constructor(status: number, rateLimitReset: number | undefined) {
    super(`GitHub API ${status}`);
    this.name = 'GitHubApiError';
    this.status = status;
    this.rateLimitReset = rateLimitReset;
  }
}

/** Compute "resets in ~N min" from a Unix epoch seconds timestamp. */
function resetMinutes(epochSeconds: number): number {
  const diffMs = epochSeconds * 1000 - Date.now();
  return Math.max(1, Math.ceil(diffMs / 60_000));
}

function useGitHubIssues(state: 'open' | 'closed') {
  return useQuery<GitHubIssue[]>({
    queryKey: ['issues', REPO, state],
    queryFn: async () => {
      const res = await fetch(githubIssuesUrl(REPO, state, 100));
      if (!res.ok) {
        // Parse the rate-limit reset epoch from the header when present.
        // The header value is a Unix timestamp in seconds (string).
        const resetHeader = res.headers.get('X-RateLimit-Reset');
        const rateLimitReset = resetHeader ? parseInt(resetHeader, 10) : undefined;
        throw new GitHubApiError(res.status, rateLimitReset);
      }
      return res.json() as Promise<GitHubIssue[]>;
    },
    // opt-in persistence: this query will be hydrated from idb-keyval on next
    // load so users see data immediately while the network request completes.
    meta: { persist: true },
    staleTime: 60_000,
  });
}

/** Skeleton row group for the table loading state — three placeholder rows. */
function TableSkeleton() {
  return (
    <div role="status" className="space-y-2 py-2" aria-label="Loading recent issues">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-9 w-full" />
      ))}
    </div>
  );
}

/** Skeleton block for chart loading state. */
function ChartSkeleton({ height = 260 }: { height?: number }) {
  return <Skeleton className="w-full rounded-lg" style={{ height }} />;
}

/** Skeleton for a KPI metric + sparkline */
function KpiSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-8 w-20" />
      <Skeleton className="h-4 w-24" />
      <Skeleton className="mt-3 h-9 w-full" />
    </div>
  );
}

/**
 * Dedicated error card for rate-limit errors (HTTP 403 / 429).
 *
 * GitHub's unauthenticated API is capped at 60 requests per hour per IP.
 * This card explains the situation and surfaces the reset time when the
 * X-RateLimit-Reset header was available.
 */
function RateLimitErrorCard({
  error,
  onRetry,
}: {
  error: GitHubApiError;
  onRetry: () => void;
}) {
  // Compute reset minutes at render time, not at throw time, so the countdown
  // reflects how long the user has already been on the page.
  const minsUntilReset =
    error.rateLimitReset !== undefined ? resetMinutes(error.rateLimitReset) : null;

  return (
    <div
      role="alert"
      className="rounded-lg border border-amber-500/40 bg-amber-500/5 p-5 space-y-3"
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 text-amber-500" aria-hidden="true">⚠</span>
        <div className="flex-1 space-y-1">
          <p className="font-semibold text-foreground">GitHub rate limit reached</p>
          <p className="text-sm text-muted-foreground">
            The GitHub API allows{' '}
            <strong className="text-foreground">60 requests per hour</strong> for
            unauthenticated clients. This page has exhausted that quota.
            {minsUntilReset !== null && (
              <span>
                {' '}
                The limit resets in approximately{' '}
                <strong className="text-foreground">~{minsUntilReset} min</strong>.
              </span>
            )}
          </p>
          <p className="text-xs text-muted-foreground">
            To remove the cap, configure a{' '}
            <code className="font-mono">PUBLIC_API_BASE</code> backend proxy — see{' '}
            <a
              href="/docs/building/backend/"
              className="underline underline-offset-4 hover:text-foreground"
            >
              the backend guide
            </a>
            .
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-700 dark:text-amber-400 hover:bg-amber-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
      >
        Retry
      </button>
    </div>
  );
}

/** Generic error fallback for non-rate-limit failures. */
function GenericErrorCard({
  error,
  onRetry,
}: {
  error: Error;
  onRetry: () => void;
}) {
  return (
    <Callout variant="error" title="Could not load issues">
      <p>{error.message}</p>
      {/* Invalidating with a partial key refreshes both open + closed queries. */}
      <button
        type="button"
        onClick={onRetry}
        className="mt-3 inline-flex items-center rounded-md border border-destructive/40 bg-destructive/20 px-3 py-1 text-xs font-medium text-destructive hover:bg-destructive/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive"
      >
        Retry
      </button>
    </Callout>
  );
}

function DashboardInner() {
  const queryClient = useQueryClient();
  const { data: openItems, isLoading: openLoading, error: openError } = useGitHubIssues('open');
  const { data: closedItems, isLoading: closedLoading } = useGitHubIssues('closed');

  const handleRetry = () => {
    queryClient.invalidateQueries({ queryKey: ['issues', REPO] });
  };

  if (openError) {
    const isRateLimit =
      openError instanceof GitHubApiError &&
      (openError.status === 403 || openError.status === 429);

    return isRateLimit ? (
      <RateLimitErrorCard error={openError as GitHubApiError} onRetry={handleRetry} />
    ) : (
      <GenericErrorCard error={openError as Error} onRetry={handleRetry} />
    );
  }

  const open = openItems ?? [];
  const closed = closedItems ?? [];

  // GitHub's /issues endpoint returns both issues and PRs. Split on the
  // presence of `pull_request` to derive separate KPI values.
  const openIssues = open.filter((i) => !i.pull_request);
  const openPRs = open.filter((i) => Boolean(i.pull_request));
  const authors = new Set([...open, ...closed].map((i) => i.user.login));

  // Count labels across all issues (not PRs). Truncate to top 8 for readability.
  const labelCounts = new Map<string, number>();
  [...open, ...closed]
    .filter((i) => !i.pull_request)
    .forEach((i) =>
      i.labels.forEach((l) => labelCounts.set(l.name, (labelCounts.get(l.name) ?? 0) + 1)),
    );
  const byLabel = Array.from(labelCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, count]) => ({ name, count }));

  // Open vs closed breakdown — issues only (PRs excluded for clean semantics).
  const closedIssuesCount = closed.filter((i) => !i.pull_request).length;
  const stateData = [
    { name: 'open', value: openIssues.length },
    { name: 'closed', value: closedIssuesCount },
  ];

  // Issue close rate — share of all (non-PR) issues that are closed. Guarded
  // against a zero denominator so the gauge never produces NaN on empty data.
  const totalIssues = openIssues.length + closedIssuesCount;
  const closeRate = totalIssues > 0 ? Math.round((closedIssuesCount / totalIssues) * 100) : 0;

  // Top 5 labels for the BarList (BarListDatum uses { name, value }).
  const topLabels = byLabel
    .slice(0, 5)
    .map(({ name, count }) => ({ name, value: count }));

  // Synthetic 7-point trend for the KPI sparklines: a smooth ease-in ramp that
  // lands on the real current value. Purely illustrative (GitHub's REST list
  // endpoint carries no time-series), but stable across renders and resilient
  // to a zero/empty total. Falls back to a flat zero line while loading.
  const trendFor = (total: number): number[] =>
    Array.from({ length: 7 }, (_, i) => Math.round((total * (i + 1) ** 2) / 49));
  const emptyTrend = [0, 0, 0, 0, 0, 0, 0];

  // Most-recently-opened issues for the table. Sorted descending by created_at.
  const recent: GitHubIssue[] = [...open, ...closed]
    .filter((i) => !i.pull_request)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 10);

  const columns: ColumnDef<GitHubIssue>[] = [
    {
      accessorKey: 'number',
      header: '#',
      size: 60,
      cell: (info) => `#${info.getValue<number>()}`,
    },
    {
      accessorKey: 'title',
      header: 'Title',
      size: 360,
      cell: (info) => (
        <a
          href={info.row.original.html_url}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline"
        >
          {info.getValue<string>()}
        </a>
      ),
    },
    {
      accessorKey: 'user',
      header: 'Author',
      size: 120,
      cell: (info) => info.getValue<GitHubIssue['user']>().login,
    },
    {
      accessorKey: 'state',
      header: 'State',
      size: 80,
    },
    {
      accessorKey: 'created_at',
      header: 'Opened',
      size: 100,
      // ISO date string — slice to YYYY-MM-DD for compact display.
      cell: (info) => info.getValue<string>().slice(0, 10),
    },
  ];

  const loading = openLoading || closedLoading;

  // Empty state check — only shown after a successful load (not while loading).
  // Both counts being 0 means the repo genuinely has no issues yet.
  const bothEmpty = !loading && openIssues.length === 0 && closedIssuesCount === 0;

  return (
    <div className="space-y-8">
      {/* KPIs — Skeleton while loading, real values after */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3" aria-label="Key metrics">
        <KpiCard>
          {loading ? (
            <KpiSkeleton />
          ) : (
            <>
              <Metric value={openIssues.length} label="Open issues" />
              {/* Celebratory inbox-zero sublabel when there are no open issues
                  after a successful load. Distinct from the loading state
                  (skeleton) and from a genuine error. */}
              {openIssues.length === 0 && (
                <span className="mt-0.5 text-xs text-emerald-700 dark:text-emerald-300 font-medium">
                  🎉 inbox zero
                </span>
              )}
              <Sparkline
                className="mt-3"
                height={36}
                colorIndex={0}
                data={trendFor(openIssues.length)}
              />
            </>
          )}
        </KpiCard>
        <KpiCard>
          {loading ? (
            <KpiSkeleton />
          ) : (
            <>
              <Metric value={openPRs.length} label="Open PRs" />
              <Sparkline
                className="mt-3"
                height={36}
                colorIndex={1}
                data={trendFor(openPRs.length)}
              />
            </>
          )}
        </KpiCard>
        <KpiCard>
          {loading ? (
            <KpiSkeleton />
          ) : (
            <>
              <Metric value={authors.size} label="Unique authors" />
              <Sparkline
                className="mt-3"
                height={36}
                colorIndex={2}
                data={loading ? emptyTrend : trendFor(authors.size)}
              />
            </>
          )}
        </KpiCard>
      </section>

      {/* Charts */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2" aria-label="Issue analytics">
        <KpiCard>
          <h3 className="mb-3 text-sm font-medium text-muted-foreground">
            Issues by label (top 8)
          </h3>
          {loading ? (
            <ChartSkeleton height={260} />
          ) : byLabel.length === 0 ? (
            // Genuine empty state after successful load
            <p className="py-8 text-center text-sm text-muted-foreground">No labelled issues yet.</p>
          ) : (
            <BarChart data={byLabel} index="name" series={['count']} height={260} />
          )}
        </KpiCard>
        <KpiCard>
          <h3 className="mb-3 text-sm font-medium text-muted-foreground">Open vs closed</h3>
          {loading ? (
            <ChartSkeleton height={260} />
          ) : bothEmpty ? (
            // Both open and closed are 0 — genuine empty, show a friendly message
            <p className="py-8 text-center text-sm text-muted-foreground">
              No issues yet — all clear!
            </p>
          ) : (
            <DonutChart data={stateData} height={260} />
          )}
        </KpiCard>
      </section>

      {/* Derived metrics: close-rate gauge + top labels */}
      <section
        className="grid grid-cols-1 gap-6 lg:grid-cols-2"
        aria-label="Derived metrics"
      >
        <KpiCard>
          <h3 className="mb-3 text-sm font-medium text-muted-foreground">
            Issue close rate
          </h3>
          {loading ? (
            <ChartSkeleton height={180} />
          ) : bothEmpty ? (
            <p className="py-4 text-center text-sm text-muted-foreground">No data yet.</p>
          ) : (
            <Gauge value={closeRate} max={100} height={180} label="closed" />
          )}
        </KpiCard>
        <KpiCard>
          <h3 className="mb-3 text-sm font-medium text-muted-foreground">
            Issues by label (top 5)
          </h3>
          {loading ? (
            <ChartSkeleton height={180} />
          ) : topLabels.length > 0 ? (
            <BarList data={topLabels} />
          ) : (
            <p className="text-sm text-muted-foreground">No labelled issues yet.</p>
          )}
        </KpiCard>
      </section>

      {/* Table — Skeleton rows while loading, real table once data arrives.
          We intentionally do NOT render the DataTable while loading because
          the table's own empty state ("No results") would show while 0 rows
          are available, conflating loading with empty. */}
      <section aria-label="Recent issues">
        <h3 className="mb-3 text-sm font-medium text-muted-foreground">Recent issues</h3>
        {loading ? (
          <TableSkeleton />
        ) : (
          <DataTable<GitHubIssue, unknown>
            columns={columns}
            data={recent}
            height="360px"
            estimateRowSize={36}
          />
        )}
      </section>
    </div>
  );
}

// DashboardIsland wraps DashboardInner in its own isolated QueryProvider so
// its cache (including idb-keyval persistence) is scoped to this island and
// does not collide with other QueryProviders on the page.
export default function DashboardIsland() {
  return (
    <QueryProvider idbKey="tanstack-query-cache-dashboard">
      <ErrorBoundary name="Dashboard">
        <DashboardInner />
      </ErrorBoundary>
    </QueryProvider>
  );
}
