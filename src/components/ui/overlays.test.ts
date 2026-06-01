import { describe, expect, it } from 'vitest';
import tooltip from './tooltip.tsx?raw';
import popover from './popover.tsx?raw';
import alertDialog from './alert-dialog.tsx?raw';
import hoverCard from './hover-card.tsx?raw';
import contextMenu from './context-menu.tsx?raw';

const overlays: Array<[string, string, RegExp]> = [
  ['tooltip', tooltip, /@base-ui-components\/react\/tooltip/],
  ['popover', popover, /@base-ui-components\/react\/popover/],
  ['alert-dialog', alertDialog, /@base-ui-components\/react\/alert-dialog/],
  ['hover-card', hoverCard, /@base-ui-components\/react\/preview-card/],
  ['context-menu', contextMenu, /@base-ui-components\/react\/context-menu/],
];

describe('overlay primitives', () => {
  it.each(overlays)('%s is built on the Base UI primitive', (_n, src, re) => {
    expect(src).toMatch(re);
  });

  it.each(overlays)('%s does not import Radix', (_n, src) => {
    expect(src).not.toMatch(/@radix-ui/);
  });

  it.each(overlays)('%s renders through a Portal', (_n, src) => {
    expect(src).toMatch(/\.Portal/);
  });
});
