import { describe, expect, it } from 'vitest';
import tree from './tree-view.tsx?raw';
import timeline from './timeline.tsx?raw';
import barList from './bar-list.tsx?raw';
import sparkline from './charts/sparkline.tsx?raw';
import gauge from './charts/gauge.tsx?raw';

const all: Array<[string, string]> = [
  ['tree-view', tree],
  ['timeline', timeline],
  ['bar-list', barList],
  ['sparkline', sparkline],
  ['gauge', gauge],
];

describe('extras & data-viz', () => {
  it.each(all)('%s does not import Radix or Tremor package', (_n, src) => {
    expect(src).not.toMatch(/@radix-ui/);
    expect(src).not.toMatch(/@tremor\/react/);
  });

  it('chart variants use Recharts + the SSR-safe mount guard', () => {
    for (const src of [sparkline, gauge]) {
      expect(src).toMatch(/from ['"]recharts['"]/);
      expect(src).toMatch(/useMounted/);
    }
  });

  it('tree view is accessible (role=tree)', () => {
    expect(tree).toMatch(/role="tree"/);
  });
});
