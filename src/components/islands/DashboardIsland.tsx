import * as React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import QueryProvider from './QueryProvider';
import ErrorBoundary from './ErrorBoundary';
import { KpiCard } from '@/components/ui/kpi-card';
import { Metric } from '@/components/ui/metric';
import { Callout } from '@/components/ui/callout';
import { BarChart, DonutChart } from '@/components/ui/charts';
import { Sparkline } from '@/components/ui/charts/sparkline';
import { Gauge } from '@/components/ui/charts/gauge';
import { BarList } from '@/components/ui/bar-list';
import { DataTable } from '@/components/ui/data-table';
import type { ColumnDef } from '@tanstack/react-table';

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

function useGitHubIssues(state: 'open' | 'closed') {
  return useQuery<GitHubIssue[]>({
    queryKey: ['issues', REPO, state],
    queryFn: async () => {
      const res = await fetch(
        `https://api.github.com/repos/${REPO}/issues?state=${state}&per_page=100`,
      );
      if (!res.ok) throw new Error(`GitHub API ${res.status}`);
      return res.json() as Promise<GitHubIssue[]>;
    },
    // opt-in persistence: this query will be hydrated from idb-keyval on next
    // load so users see data immediately while the network request completes.
    meta: { persist: true },
    staleTime: 60_000,
  });
}

function DashboardInner() {
  const queryClient = useQueryClient();
  const { data: openItems, isLoading: openLoading, error: openError } = useGitHubIssues('open');
  const { data: closedItems, isLoading: closedLoading } = useGitHubIssues('closed');

  if (openError) {
    return (
      <Callout variant="error" title="Could not load issues">
        <p>{(openError as Error).message}</p>
        {/* Invalidating with a partial key refreshes both open + closed queries. */}
        <button
          type="button"
          onClick={() => queryClient.invalidateQueries({ queryKey: ['issues', REPO] })}
          className="mt-3 inline-flex items-center rounded-md border border-destructive/40 bg-destructive/20 px-3 py-1 text-xs font-medium text-destructive hover:bg-destructive/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive"
        >
          Retry
        </button>
      </Callout>
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

  return (
    <div className="space-y-8">
      {/* KPIs */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3" aria-label="Key metrics">
        <KpiCard>
          <Metric value={loading ? '…' : openIssues.length} label="Open issues" />
          <Sparkline
            className="mt-3"
            height={36}
            colorIndex={0}
            data={loading ? emptyTrend : trendFor(openIssues.length)}
          />
        </KpiCard>
        <KpiCard>
          <Metric value={loading ? '…' : openPRs.length} label="Open PRs" />
          <Sparkline
            className="mt-3"
            height={36}
            colorIndex={1}
            data={loading ? emptyTrend : trendFor(openPRs.length)}
          />
        </KpiCard>
        <KpiCard>
          <Metric value={loading ? '…' : authors.size} label="Unique authors" />
          <Sparkline
            className="mt-3"
            height={36}
            colorIndex={2}
            data={loading ? emptyTrend : trendFor(authors.size)}
          />
        </KpiCard>
      </section>

      {/* Charts */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2" aria-label="Issue analytics">
        <KpiCard>
          <h3 className="mb-3 text-sm font-medium text-muted-foreground">
            Issues by label (top 8)
          </h3>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : (
            <BarChart data={byLabel} index="name" series={['count']} height={260} />
          )}
        </KpiCard>
        <KpiCard>
          <h3 className="mb-3 text-sm font-medium text-muted-foreground">Open vs closed</h3>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
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
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : (
            <Gauge value={closeRate} max={100} height={180} label="closed" />
          )}
        </KpiCard>
        <KpiCard>
          <h3 className="mb-3 text-sm font-medium text-muted-foreground">
            Issues by label (top 5)
          </h3>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : topLabels.length > 0 ? (
            <BarList data={topLabels} />
          ) : (
            <p className="text-sm text-muted-foreground">No labelled issues yet.</p>
          )}
        </KpiCard>
      </section>

      {/* Table */}
      <section aria-label="Recent issues">
        <h3 className="mb-3 text-sm font-medium text-muted-foreground">Recent issues</h3>
        <DataTable<GitHubIssue, unknown>
          columns={columns}
          data={recent}
          height="360px"
          estimateRowSize={36}
        />
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
