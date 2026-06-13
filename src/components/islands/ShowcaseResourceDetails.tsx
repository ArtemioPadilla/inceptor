/**
 * ShowcaseResourceDetails — demo wrapper for DetailsPageSimple and DetailsPageWithTabs.
 * Used by src/pages/showcase/resource-details.astro.
 */

import * as React from 'react';
import DetailsPageSimple from './DetailsPageSimple';
import DetailsPageWithTabs from './DetailsPageWithTabs';
import ErrorBoundary from './ErrorBoundary';

export function ShowcaseDetailsSimple() {
  return (
    <ErrorBoundary name="ShowcaseDetailsSimple">
      <DetailsPageSimple
        title="api-service-prod"
        status="running"
        summaryBlocks={[
          { label: 'Region', value: 'us-east-1' },
          { label: 'Uptime', value: '14d 6h' },
          { label: 'CPU', value: '12%' },
          { label: 'Memory', value: '1.4 GB' },
        ]}
        relatedItems={[
          { id: 'vpc-01', label: 'vpc-01 (VPC)', meta: '10.0.0.0/16' },
          { id: 'sg-web', label: 'sg-web (Security Group)', meta: 'inbound 443, 80' },
          { id: 'iam-role', label: 'ec2-service-role (IAM)', meta: 'ReadOnly' },
        ]}
        actions={
          <button
            type="button"
            className="rounded-md bg-destructive px-3 py-1.5 text-xs font-medium
                       text-destructive-foreground hover:bg-destructive/90
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Terminate
          </button>
        }
      />
    </ErrorBoundary>
  );
}

export function ShowcaseDetailsTabbed() {
  return (
    <ErrorBoundary name="ShowcaseDetailsTabbed">
      <DetailsPageWithTabs
        title="web-frontend-prod"
        status="running"
        summaryBlocks={[
          { label: 'Framework', value: 'Astro 5' },
          { label: 'Build', value: '#1,482' },
          { label: 'Deploy time', value: '43s' },
          { label: 'CDN nodes', value: '38' },
        ]}
        defaultTab="overview"
        tabs={[
          {
            id: 'overview',
            label: 'Overview',
            content: (
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>Last deployed 2 hours ago by <strong>artemio</strong>.</p>
                <p>Serving 1,234 requests/min on 38 edge nodes.</p>
                <p>Custom domain: <code>app.inceptor.dev</code></p>
              </div>
            ),
          },
          {
            id: 'logs',
            label: 'Logs',
            content: (
              <div className="font-mono text-xs bg-muted rounded-md p-4 space-y-1 overflow-x-auto">
                <p><span className="text-muted-foreground">2026-06-13 00:40:01</span>{' '}
                  <span className="text-green-600 dark:text-green-400">INFO</span>{' '}
                  Build #1482 deployed</p>
                <p><span className="text-muted-foreground">2026-06-13 00:40:03</span>{' '}
                  <span className="text-green-600 dark:text-green-400">INFO</span>{' '}
                  Health check passed (200 OK)</p>
                <p><span className="text-muted-foreground">2026-06-13 00:41:15</span>{' '}
                  <span className="text-yellow-600 dark:text-yellow-400">WARN</span>{' '}
                  Cache miss rate 18%</p>
              </div>
            ),
          },
          {
            id: 'config',
            label: 'Config',
            content: (
              <dl className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                {[
                  ['Node version', '22.x'],
                  ['Build command', 'npm run build'],
                  ['Output dir', 'dist/'],
                  ['Environment', 'Production'],
                ].map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-muted-foreground">{k}</dt>
                    <dd className="font-medium">{v}</dd>
                  </div>
                ))}
              </dl>
            ),
          },
        ]}
        actions={
          <button
            type="button"
            className="rounded-md border border-border px-3 py-1.5 text-xs font-medium
                       hover:bg-accent hover:text-accent-foreground
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Redeploy
          </button>
        }
      />
    </ErrorBoundary>
  );
}

export function ShowcaseDetailsLoading() {
  return <DetailsPageSimple loading={true} title="Resource" />;
}

export function ShowcaseDetailsEmpty() {
  return <DetailsPageSimple empty={true} emptyMessage="No resource selected." />;
}

export function ShowcaseDetailsError() {
  return (
    <DetailsPageSimple
      error="Failed to load resource: 404 Not Found"
      onRetry={() => {}}
    />
  );
}
