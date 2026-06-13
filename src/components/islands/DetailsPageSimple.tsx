/**
 * DetailsPageSimple — resource details blueprint (simple variant).
 *
 * Renders a headline, status/actions strip, summary blocks, related-data
 * section. Handles loading, empty, and error states via props.
 *
 * No @radix-ui, no framer-motion, no React.createContext for cross-island state.
 */

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import ErrorBoundary from './ErrorBoundary';

// ── Types ────────────────────────────────────────────────────────────────────

export interface SummaryBlock {
  label: string;
  value: React.ReactNode;
}

export interface RelatedItem {
  id: string;
  label: string;
  meta?: string;
  href?: string;
}

export type ResourceStatus = 'running' | 'stopped' | 'error' | 'pending' | string;

export interface DetailsPageSimpleProps {
  /** Resource headline / name. */
  title?: string;
  /** Human-readable status label. */
  status?: ResourceStatus;
  /** Action buttons rendered in the header strip. */
  actions?: React.ReactNode;
  /** Summary stat blocks (label + value pairs). */
  summaryBlocks?: SummaryBlock[];
  /** Related data items shown in the related section. */
  relatedItems?: RelatedItem[];
  /** When true, renders the skeleton loading state. */
  loading?: boolean;
  /** When provided, renders the error state with this message. */
  error?: string;
  /** Callback to retry after an error. */
  onRetry?: () => void;
  /** When true, renders the empty state. */
  empty?: boolean;
  /** Override empty state message. */
  emptyMessage?: string;
  /** aria-label for the details region. */
  label?: string;
}

// ── Status helpers ────────────────────────────────────────────────────────────

export const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  running: 'default',
  stopped: 'secondary',
  error: 'destructive',
  pending: 'outline',
};

export function statusVariant(status: ResourceStatus): 'default' | 'secondary' | 'destructive' | 'outline' {
  return STATUS_VARIANT[status] ?? 'outline';
}

// ── Skeleton loading state ────────────────────────────────────────────────────

function SimpleDetailsSkeleton() {
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
      <div className="space-y-2">
        <Skeleton className="h-5 w-32" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function SimpleDetailsEmpty({ message }: { message: string }) {
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

function SimpleDetailsError({ message, onRetry }: { message: string; onRetry?: () => void }) {
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

function DetailsPageSimpleInner({
  title = 'Resource',
  status,
  actions,
  summaryBlocks = [],
  relatedItems = [],
  loading = false,
  error,
  onRetry,
  empty = false,
  emptyMessage = 'No resource data found.',
  label = 'Resource details',
}: DetailsPageSimpleProps) {
  if (loading) return <SimpleDetailsSkeleton />;
  if (error) return <SimpleDetailsError message={error} onRetry={onRetry} />;
  if (empty) return <SimpleDetailsEmpty message={emptyMessage} />;

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

      {/* Related data */}
      {relatedItems.length > 0 && (
        <section aria-label="Related data">
          <h3 className="text-sm font-semibold mb-2">Related</h3>
          <ul className="space-y-1">
            {relatedItems.map((item) => {
              const Tag = item.href ? 'a' : 'span';
              return (
                <li
                  key={item.id}
                  className="flex items-center justify-between rounded-md border border-border bg-card px-4 py-2 text-sm"
                >
                  <Tag
                    {...(item.href
                      ? {
                          href: item.href,
                          className:
                            'font-medium underline underline-offset-4 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded',
                        }
                      : { className: 'font-medium' })}
                  >
                    {item.label}
                  </Tag>
                  {item.meta && (
                    <span className="text-xs text-muted-foreground">{item.meta}</span>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </article>
  );
}

export default function DetailsPageSimple(props: DetailsPageSimpleProps) {
  return (
    <ErrorBoundary name="DetailsPageSimple">
      <DetailsPageSimpleInner {...props} />
    </ErrorBoundary>
  );
}
