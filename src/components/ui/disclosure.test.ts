import { describe, expect, it } from 'vitest';
import accordion from './accordion.tsx?raw';
import collapsible from './collapsible.tsx?raw';
import avatar from './avatar.tsx?raw';
import scrollArea from './scroll-area.tsx?raw';
import separator from './separator.tsx?raw';
import skeleton from './skeleton.tsx?raw';
import aspectRatio from './aspect-ratio.tsx?raw';

const baseUi: Array<[string, string, RegExp]> = [
  ['accordion', accordion, /@base-ui-components\/react\/accordion/],
  ['collapsible', collapsible, /@base-ui-components\/react\/collapsible/],
  ['avatar', avatar, /@base-ui-components\/react\/avatar/],
  ['scroll-area', scrollArea, /@base-ui-components\/react\/scroll-area/],
  ['separator', separator, /@base-ui-components\/react\/separator/],
];

describe('disclosure & layout primitives', () => {
  it.each(baseUi)('%s is built on the Base UI primitive', (_n, src, re) => {
    expect(src).toMatch(re);
  });

  it.each([...baseUi, ['skeleton', skeleton], ['aspect-ratio', aspectRatio]] as [string, string][])(
    '%s does not import Radix',
    (_n, src) => {
      expect(src).not.toMatch(/@radix-ui/);
    },
  );

  it('skeleton + aspect-ratio are dependency-free markup via cn()', () => {
    expect(skeleton).toMatch(/animate-pulse/);
    expect(aspectRatio).toMatch(/aspectRatio/);
  });
});
