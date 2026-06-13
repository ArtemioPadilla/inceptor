/**
 * ShowcaseAppLayout — demo wrapper for AppLayoutIsland.
 * Used by src/pages/showcase/app-layout.astro.
 */

import * as React from 'react';
import AppLayoutIsland from './AppLayoutIsland';
import ErrorBoundary from './ErrorBoundary';

function DemoContent() {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Dashboard</h3>
      <p className="text-sm text-muted-foreground">
        This is the main content region. It scrolls independently.
        The left nav and top bar stay fixed.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {['Revenue', 'Users', 'Requests'].map((kpi) => (
          <div key={kpi} className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">{kpi}</p>
            <p className="mt-1 text-2xl font-bold">—</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function SplitPanelDetails() {
  return (
    <div className="p-4 space-y-3">
      <h3 className="text-sm font-semibold">Resource details</h3>
      <dl className="space-y-2 text-xs">
        {[
          ['Name', 'api-service-prod'],
          ['Region', 'us-east-1'],
          ['Status', 'Running'],
          ['Uptime', '14d 6h'],
        ].map(([k, v]) => (
          <div key={k} className="flex justify-between">
            <dt className="text-muted-foreground">{k}</dt>
            <dd className={`font-medium ${k === 'Status' ? 'text-green-600 dark:text-green-400' : ''}`}>
              {v}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function ResourceListContent() {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Resources</h3>
      <p className="text-sm text-muted-foreground">
        Select a resource to populate the details panel. Toggle the panel with the button in the top bar.
      </p>
      <ul className="space-y-2">
        {['api-service-prod', 'web-frontend-prod', 'db-primary'].map((name) => (
          <li
            key={name}
            className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-2 text-sm"
          >
            <span className="font-medium">{name}</span>
            <span className="text-xs text-green-600 dark:text-green-400">Running</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const DEFAULT_NAV = [
  { id: 'dashboard', label: 'Dashboard', active: true },
  { id: 'projects', label: 'Projects' },
  { id: 'team', label: 'Team' },
  { id: 'settings', label: 'Settings' },
];

const SPLIT_NAV = [
  { id: 'resources', label: 'Resources', active: true },
  { id: 'logs', label: 'Logs' },
  { id: 'alerts', label: 'Alerts' },
];

export function ShowcaseAppLayoutDefault() {
  return (
    <ErrorBoundary name="ShowcaseAppLayoutDefault">
      <AppLayoutIsland navItems={DEFAULT_NAV}>
        <DemoContent />
      </AppLayoutIsland>
    </ErrorBoundary>
  );
}

export function ShowcaseAppLayoutSplit() {
  return (
    <ErrorBoundary name="ShowcaseAppLayoutSplit">
      <AppLayoutIsland
        navItems={SPLIT_NAV}
        defaultSplitOpen={true}
        splitPanelContent={<SplitPanelDetails />}
      >
        <ResourceListContent />
      </AppLayoutIsland>
    </ErrorBoundary>
  );
}
