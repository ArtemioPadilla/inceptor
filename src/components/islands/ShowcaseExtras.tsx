import * as React from 'react';

import { TreeView, type TreeNode } from '@/components/ui/tree-view';
import { Timeline } from '@/components/ui/timeline';
import { BarList } from '@/components/ui/bar-list';
import { Sparkline } from '@/components/ui/charts/sparkline';
import { Gauge } from '@/components/ui/charts/gauge';
import ErrorBoundary from './ErrorBoundary';

const TREE: TreeNode[] = [
  {
    id: 'src',
    label: 'src',
    children: [
      {
        id: 'components',
        label: 'components',
        children: [
          { id: 'ui', label: 'ui' },
          { id: 'islands', label: 'islands' },
        ],
      },
      { id: 'pages', label: 'pages' },
    ],
  },
  { id: 'astro', label: 'astro.config.mjs' },
];

const TRAFFIC = [
  { name: '/gallery', value: 1840 },
  { name: '/docs', value: 1210 },
  { name: '/demos', value: 760 },
  { name: '/blog', value: 320 },
];

export default function ShowcaseExtras() {
  return (
    <ErrorBoundary name="ShowcaseExtras">
      <div className="grid max-w-xl gap-8">
        <section className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tree view</p>
          <TreeView data={TREE} defaultExpanded={['src', 'components']} className="rounded-lg border border-border p-2" />
        </section>

        <section className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Timeline</p>
          <Timeline
            items={[
              { title: 'Issue filed', time: '09:14', description: 'FeedbackFAB pre-filled diagnostics.' },
              { title: 'PR opened', time: '09:41', description: 'forja implemented, centinela validated.' },
              { title: 'Merged & deployed', time: '10:02', description: 'Issue closed automatically.' },
            ]}
          />
        </section>

        <section className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Bar list</p>
          <BarList data={TRAFFIC} valueFormatter={(v) => v.toLocaleString()} />
        </section>

        <section className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Sparkline</p>
            <Sparkline data={[4, 7, 3, 9, 6, 11, 8, 14, 10, 16]} />
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Gauge</p>
            <Gauge value={72} label="uptime" height={140} />
          </div>
        </section>
      </div>
    </ErrorBoundary>
  );
}
