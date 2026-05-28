import * as React from 'react';

import { Callout } from '@/components/ui/callout';
import { Divider } from '@/components/ui/divider';
import { KpiCard } from '@/components/ui/kpi-card';
import { Metric } from '@/components/ui/metric';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Tracker, type TrackerBlock } from '@/components/ui/tracker';
import ErrorBoundary from './ErrorBoundary';

// Sample uptime data for the Tracker — 30 days, mostly green with a few
// outages and a degraded period.
const UPTIME_DATA: TrackerBlock[] = [
  ...Array.from({ length: 22 }, (_, i) => ({
    key: i,
    color: 'primary' as const,
    tooltip: `Day ${i + 1}: Operational`,
  })),
  { key: 22, color: 'warning', tooltip: 'Day 23: Degraded performance' },
  { key: 23, color: 'warning', tooltip: 'Day 24: Degraded performance' },
  { key: 24, color: 'destructive', tooltip: 'Day 25: Outage' },
  ...Array.from({ length: 5 }, (_, i) => ({
    key: 25 + i,
    color: 'primary' as const,
    tooltip: `Day ${26 + i}: Operational`,
  })),
];

// ShowcaseKpis demonstrates all six Tremor Raw KPI primitives together.
// Wrapped in one island so the whole composition hydrates as a unit.
export default function ShowcaseKpis() {
  return (
    <ErrorBoundary name="ShowcaseKpis">
    <div className="space-y-6">
      {/* KpiCard + Metric row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard>
          <p className="text-sm text-muted-foreground mb-1">Monthly Revenue</p>
          <Metric
            value="$42,800"
            delta={{ value: 12.3, trend: 'up' }}
            label="vs. last month"
          />
        </KpiCard>

        <KpiCard>
          <p className="text-sm text-muted-foreground mb-1">Active Users</p>
          <Metric
            value="3,204"
            delta={{ value: 2.1, trend: 'down' }}
            label="vs. last month"
          />
        </KpiCard>

        <KpiCard>
          <p className="text-sm text-muted-foreground mb-1">Uptime</p>
          <Metric
            value="99.7%"
            delta={{ value: 0.1, trend: 'neutral' }}
            label="30-day average"
          />
        </KpiCard>
      </div>

      {/* ProgressBar examples */}
      <KpiCard>
        <p className="text-sm font-semibold text-foreground mb-4">Storage usage</p>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Documents</span>
              <span>68%</span>
            </div>
            <ProgressBar value={68} label="Documents storage at 68%" />
          </div>
          <div>
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Media</span>
              <span>34%</span>
            </div>
            <ProgressBar value={34} label="Media storage at 34%" />
          </div>
          <div>
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Backups</span>
              <span>91%</span>
            </div>
            <ProgressBar value={91} label="Backups storage at 91%" />
          </div>
        </div>
      </KpiCard>

      {/* Tracker */}
      <KpiCard>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-foreground">Service uptime — last 30 days</p>
          <p className="text-xs text-muted-foreground">96.7%</p>
        </div>
        <Tracker data={UPTIME_DATA} />
        <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-full bg-primary" />
            Operational
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-full bg-[oklch(0.7_0.18_70)]" />
            Degraded
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-full bg-destructive" />
            Outage
          </span>
        </div>
      </KpiCard>

      <Divider>Callout variants</Divider>

      {/* Callout variants */}
      <div className="space-y-3">
        <Callout title="Information" variant="default">
          This is a default callout with neutral styling.
        </Callout>
        <Callout title="Success" variant="success">
          Your changes have been saved successfully.
        </Callout>
        <Callout title="Warning" variant="warning">
          Storage is approaching its limit. Consider upgrading your plan.
        </Callout>
        <Callout title="Error" variant="error">
          Failed to connect to the data source. Check your credentials.
        </Callout>
      </div>

      {/* Divider examples */}
      <div className="space-y-4">
        <Divider />
        <Divider>or continue with</Divider>
        <Divider />
      </div>
    </div>
    </ErrorBoundary>
  );
}
