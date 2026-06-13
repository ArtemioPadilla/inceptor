import * as React from 'react';
import { Flashbar, type FlashItem } from '@/components/ui/flashbar';
import { InfoIcon, CircleAlertIcon, CircleCheckIcon, InboxIcon, WifiOffIcon } from 'lucide-react';

import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  Pagination,
  PaginationContent,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from '@/components/ui/pagination';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';
import { Meter } from '@/components/ui/meter';
import { Kbd } from '@/components/ui/kbd';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { DescriptionList, DescriptionItem } from '@/components/ui/description-list';
import { Button } from '@/components/ui/button';
import ErrorBoundary from './ErrorBoundary';

export default function ShowcaseFeedback() {
  const [page, setPage] = React.useState(2);
  return (
    <ErrorBoundary name="ShowcaseFeedback">
      <div className="grid max-w-xl gap-8">
        {/* Breadcrumb */}
        <section className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Breadcrumb</p>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="#">Gallery</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="#">Feedback</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </section>

        {/* Alert */}
        <section className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Alert</p>
          <Alert>
            <InfoIcon />
            <AlertTitle>Heads up</AlertTitle>
            <AlertDescription>A persistent inline banner for important context.</AlertDescription>
          </Alert>
          <Alert variant="success">
            <CircleCheckIcon />
            <AlertTitle>Saved</AlertTitle>
            <AlertDescription>Your changes were saved successfully.</AlertDescription>
          </Alert>
          <Alert variant="destructive">
            <CircleAlertIcon />
            <AlertTitle>Something went wrong</AlertTitle>
            <AlertDescription>Check your connection and try again.</AlertDescription>
          </Alert>
        </section>

        {/* Meter */}
        <section className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Meter</p>
          <Meter value={72} label="Disk usage" />
        </section>

        {/* Spinner + Kbd */}
        <section className="flex flex-wrap items-center gap-6">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Spinner</p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Spinner /> Loading…
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Kbd</p>
            <p className="text-sm text-muted-foreground">
              Press <Kbd>⌘</Kbd> <Kbd>K</Kbd> to search
            </p>
          </div>
        </section>

        {/* Pagination */}
        <section className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Pagination</p>
          <Pagination>
            <PaginationContent>
              <PaginationPrevious onClick={() => setPage((p) => Math.max(1, p - 1))} />
              {[1, 2, 3].map((n) => (
                <PaginationLink key={n} isActive={n === page} onClick={() => setPage(n)}>
                  {n}
                </PaginationLink>
              ))}
              <PaginationEllipsis />
              <PaginationLink onClick={() => setPage(12)}>12</PaginationLink>
              <PaginationNext onClick={() => setPage((p) => p + 1)} />
            </PaginationContent>
          </Pagination>
        </section>

        {/* Description list */}
        <section className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Description list</p>
          <DescriptionList className="rounded-lg border border-border px-4">
            <DescriptionItem term="Plan">Pro</DescriptionItem>
            <DescriptionItem term="Seats">12 of 20</DescriptionItem>
            <DescriptionItem term="Renews">2026-07-01</DescriptionItem>
          </DescriptionList>
        </section>

        {/* Empty state */}
        <section className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Empty state</p>
          <EmptyState
            icon={<InboxIcon />}
            title="No issues yet"
            description="When you file your first issue it'll show up here."
            action={<Button size="sm">New issue</Button>}
          />
        </section>

        {/* Error state */}
        <section className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Error state</p>
          <ErrorState
            icon={<WifiOffIcon />}
            title="Failed to load issues"
            hint="Check your connection and try again. GitHub API allows 60 requests/hour unauthenticated."
            action={<Button size="sm" variant="outline">Retry</Button>}
          />
        </section>

        {/* Flashbar — page-level stacked notifications */}
        <section className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Flashbar</p>
          <FlashbarDemo />
        </section>
      </div>
    </ErrorBoundary>
  );
}

function FlashbarDemo() {
  const [items, setItems] = React.useState<FlashItem[]>([
    { id: 'a', type: 'success', content: '3 elementos guardados.' },
    { id: 'b', type: 'error', content: 'No se pudo eliminar 1 elemento.', action: { label: 'Reintentar', onClick: () => {} } },
    { id: 'c', type: 'info', content: 'Una nueva versión está disponible.' },
  ]);
  return <Flashbar items={items} onDismiss={(id) => setItems((x) => x.filter((i) => i.id !== id))} />;
}
