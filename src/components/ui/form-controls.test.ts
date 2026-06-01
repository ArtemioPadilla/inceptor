import { describe, expect, it } from 'vitest';
import select from './select.tsx?raw';
import checkbox from './checkbox.tsx?raw';
import switchSrc from './switch.tsx?raw';
import radio from './radio-group.tsx?raw';
import slider from './slider.tsx?raw';
import textarea from './textarea.tsx?raw';

// Form-control primitives must be built on Base UI (NOT Radix) per CLAUDE.md.
const baseUi: Array<[string, string, RegExp]> = [
  ['select', select, /@base-ui-components\/react\/select/],
  ['checkbox', checkbox, /@base-ui-components\/react\/checkbox/],
  ['switch', switchSrc, /@base-ui-components\/react\/switch/],
  ['radio-group', radio, /@base-ui-components\/react\/radio-group/],
  ['slider', slider, /@base-ui-components\/react\/slider/],
];

describe('form-control primitives', () => {
  it.each(baseUi)('%s is built on the Base UI primitive', (_name, src, re) => {
    expect(src).toMatch(re);
  });

  it.each([
    ['select', select],
    ['checkbox', checkbox],
    ['switch', switchSrc],
    ['radio-group', radio],
    ['slider', slider],
  ])('%s does not import Radix', (_name, src) => {
    expect(src).not.toMatch(/@radix-ui/);
  });

  it('textarea is a themed native control via cn()', () => {
    expect(textarea).toMatch(/textarea/);
    expect(textarea).toMatch(/from ['"]@\/lib\/utils['"]/);
  });

  it('select exposes the shadcn-compatible parts', () => {
    for (const part of ['SelectTrigger', 'SelectContent', 'SelectItem', 'SelectValue']) {
      expect(select).toContain(part);
    }
  });
});
