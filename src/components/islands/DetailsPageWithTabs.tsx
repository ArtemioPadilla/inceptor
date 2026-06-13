/**
 * DetailsPageWithTabs — resource details blueprint (tabbed variant).
 *
 * Extends DetailsPageSimple with a tabbed information architecture.
 * Tabs share selected-tab state across TabsList and TabsContent, so the whole
 * composition lives in one React tree (CLAUDE.md compound-component gotcha).
 *
 * No @radix-ui, no framer-motion, no context API for cross-island state.
 */

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ErrorBoundary from './ErrorBoundary';
import { statusVariant, type DetailsPageSimpleProps } from './DetailsPageSimple';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface TabDefinition {
  /** Unique tab id (used as value). */
  id: string;
  /** Displayed tab label. */
  label: string;
  /** Tab panel content. */
  content: React.ReactNode;
}

export interface DetailsPageWithTabsProps extends Omit<DetailsPageSimpleProps, 'relatedItems'> {
  /** Tabs to render in the tabbed section. */
  tabs?: TabDefinition[];
  /** Default active tab id. Defaults to first tab. */
  defaultTab?: string;
}

// ── Status helpers (imported from DetailsPageSimple to avoid duplication) ─────

// statusVariant is re-exported from DetailsPageSimple above.
// The local STATUS_VARIANT constant has been removed.

// ── Skeleton ──────────────────────────────────────────────────────────────────

function TabbedDetailsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse" aria-label="Loading resource details" aria-busy="true">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-5 w-20" />
        </div>
        <Skeleton className="h-9 w-24" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-border bg-card p-4 space-y-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-5 w-24" />
          </div>
        ))}
      </div>
      {/* Tab bar skeleton */}
      <div className="flex gap-2 border-b border-border pb-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-20" />
        ))}
      </div>
      <Skeleton className="h-32 w-full" />
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function TabbedDetailsEmpty({ message }: { message: string }) {
  return (
    <div
      className="flex flex-col items-center justify-center py-16 text-center gap-3"
      role="status"
    >
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

// ── Error state ───────────────────────────────────────────────────────────────

function TabbedDetailsError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div
      className="flex flex-col items-center justify-center py-16 text-center gap-3"
      role="alert"
    >
      <p className="text-sm font-medium text-destructive">Failed to load resource</p>
      <p className="text-xs text-muted-foreground">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className={cn(
            'rounded-md border border-border px-3 py-1.5 text-xs font-medium',
            'hover:bg-accent hover:text-accent-foreground',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          )}
        >
          Retry
        </button>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

function DetailsPageWithTabsInner({
  title = 'Resource',
  status,
  actions,
  summaryBlocks = [],
  loading = false,
  error,
  onRetry,
  empty = false,
  emptyMessage = 'No resource data found.',
  label = 'Resource details',
  tabs = [],
  defaultTab,
}: DetailsPageWithTabsProps) {
  const firstTabId = tabs[0]?.id ?? '';
  const [activeTab, setActiveTab] = React.useState(defaultTab ?? firstTabId);

  if (loading) return <TabbedDetailsSkeleton />;
  if (error) return <TabbedDetailsError message={error} onRetry={onRetry} />;
  if (empty) return <TabbedDetailsEmpty message={emptyMessage} />;

  return (
    <article aria-label={label} className="space-y-6">
      {/* Headline + status/actions */}
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
          {status && (
            <Badge variant={statusVariant(status)} className="capitalize">
              {status}
            </Badge>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </header>

      {/* Summary blocks */}
      {summaryBlocks.length > 0 && (
        <section aria-label="Summary">
          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {summaryBlocks.map((block) => (
              <div
                key={block.label}
                className="rounded-lg border border-border bg-card p-4"
              >
                <dt className="text-xs text-muted-foreground">{block.label}</dt>
                <dd className="mt-1 text-base font-semibold">{block.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {/* Tabbed information architecture */}
      {tabs.length > 0 && (
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList aria-label={`${title} sections`}>
            {tabs.map((tab) => (
              <TabsTrigger key={tab.id} value={tab.id}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {tabs.map((tab) => (
            <TabsContent
              key={tab.id}
              value={tab.id}
              // Accessible: each panel is labelled by its trigger via compound component
              className="mt-4"
            >
              {tab.content}
            </TabsContent>
          ))}
        </Tabs>
      )}
    </article>
  );
}

export default function DetailsPageWithTabs(props: DetailsPageWithTabsProps) {
  return (
    <ErrorBoundary name="DetailsPageWithTabs">
      <DetailsPageWithTabsInner {...props} />
    </ErrorBoundary>
  );
}
