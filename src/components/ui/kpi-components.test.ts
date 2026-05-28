import { describe, expect, it } from 'vitest';

import kpiCard from './kpi-card.tsx?raw';
import metric from './metric.tsx?raw';
import progressBar from './progress-bar.tsx?raw';
import tracker from './tracker.tsx?raw';
import callout from './callout.tsx?raw';
import divider from './divider.tsx?raw';

// Asserts that none of the Tremor Raw primitives accidentally introduce
// a dependency on @tremor/react (the npm package — copy-paste only).
const TREMOR_FORBIDDEN = /@tremor\/react/;

describe.each([
  ['KpiCard', kpiCard],
  ['Metric', metric],
  ['ProgressBar', progressBar],
  ['Tracker', tracker],
  ['Callout', callout],
  ['Divider', divider],
] as const)('%s component', (name, source) => {
  it('does not import @tremor/react', () => {
    expect(source).not.toMatch(TREMOR_FORBIDDEN);
  });

  it('imports cn from @/lib/utils', () => {
    expect(source).toMatch(/from\s+['"]@\/lib\/utils['"]/);
  });

  it('exports a named component', () => {
    // Matches `export const Name` or `export { Name }`
    expect(source).toMatch(new RegExp(`export.*\\b${name}\\b`));
  });
});
