/**
 * BlockAppLayoutVariants — preview wrappers for AppLayoutIsland's
 * sidebarVariant options (ROADMAP Epic 27). Kept separate from
 * ShowcaseAppLayout.tsx (the already-shipped, already-tested default/split
 * demos) so previewing the new variants can't regress that file.
 */
import * as React from 'react';
import AppLayoutIsland from './AppLayoutIsland';
import ErrorBoundary from './ErrorBoundary';

function DemoContent({ label }: { label: string }) {
  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold">{label}</h3>
      <p className="text-sm text-muted-foreground">
        Main content region — scrolls independently of the sidebar(s).
      </p>
    </div>
  );
}

const ICON_COLLAPSE_NAV = [
  { id: 'dashboard', label: 'Dashboard', active: true },
  { id: 'projects', label: 'Projects' },
  { id: 'team', label: 'Team' },
  { id: 'settings', label: 'Settings' },
];

export function BlockAppLayoutIconCollapse() {
  return (
    <ErrorBoundary name="BlockAppLayoutIconCollapse">
      <AppLayoutIsland navItems={ICON_COLLAPSE_NAV} sidebarVariant="icon-collapse">
        <DemoContent label="Icon-collapse sidebar" />
      </AppLayoutIsland>
    </ErrorBoundary>
  );
}

const DUAL_PRIMARY_NAV = [
  { id: 'repo', label: 'Repository', active: true },
  { id: 'org', label: 'Organization' },
];

const DUAL_SECONDARY_NAV = [
  { id: 'general', label: 'General', active: true },
  { id: 'members', label: 'Members' },
  { id: 'billing', label: 'Billing' },
  { id: 'webhooks', label: 'Webhooks' },
];

export function BlockAppLayoutDual() {
  return (
    <ErrorBoundary name="BlockAppLayoutDual">
      <AppLayoutIsland
        navItems={DUAL_PRIMARY_NAV}
        sidebarVariant="dual"
        secondaryNavItems={DUAL_SECONDARY_NAV}
        secondaryNavLabel="Settings sections"
      >
        <DemoContent label="Dual sidebar — primary rail + contextual settings nav" />
      </AppLayoutIsland>
    </ErrorBoundary>
  );
}
