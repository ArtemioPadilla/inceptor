import { describe, expect, it } from 'vitest';
import breadcrumb from './breadcrumb.tsx?raw';
import pagination from './pagination.tsx?raw';
import alert from './alert.tsx?raw';
import spinner from './spinner.tsx?raw';
import meter from './meter.tsx?raw';
import kbd from './kbd.tsx?raw';
import emptyState from './empty-state.tsx?raw';
import errorState from './error-state.tsx?raw';
import descriptionList from './description-list.tsx?raw';

const all: Array<[string, string]> = [
  ['breadcrumb', breadcrumb],
  ['pagination', pagination],
  ['alert', alert],
  ['spinner', spinner],
  ['meter', meter],
  ['kbd', kbd],
  ['empty-state', emptyState],
  ['error-state', errorState],
  ['description-list', descriptionList],
];

describe('navigation & feedback primitives', () => {
  it.each(all)('%s does not import Radix', (_n, src) => {
    expect(src).not.toMatch(/@radix-ui/);
  });

  it.each(all)('%s themes via cn()', (_n, src) => {
    expect(src).toMatch(/from ['"]@\/lib\/utils['"]/);
  });

  it('meter is built on the Base UI primitive', () => {
    expect(meter).toMatch(/@base-ui-components\/react\/meter/);
  });

  it('semantic roots are used', () => {
    expect(breadcrumb).toMatch(/<nav/);
    expect(descriptionList).toMatch(/<dl/);
    expect(kbd).toMatch(/<kbd/);
    expect(alert).toMatch(/role="alert"/);
    expect(errorState).toMatch(/role="alert"/);
  });
});
