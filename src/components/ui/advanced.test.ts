import { describe, expect, it } from 'vitest';
import toggle from './toggle.tsx?raw';
import toggleGroup from './toggle-group.tsx?raw';
import numberField from './number-field.tsx?raw';
import toolbar from './toolbar.tsx?raw';
import sheet from './sheet.tsx?raw';
import rating from './rating.tsx?raw';
import tagInput from './tag-input.tsx?raw';
import inputOtp from './input-otp.tsx?raw';

const baseUi: Array<[string, string, RegExp]> = [
  ['toggle', toggle, /@base-ui-components\/react\/toggle/],
  ['toggle-group', toggleGroup, /@base-ui-components\/react\/toggle-group/],
  ['number-field', numberField, /@base-ui-components\/react\/number-field/],
  ['toolbar', toolbar, /@base-ui-components\/react\/toolbar/],
  ['sheet', sheet, /@base-ui-components\/react\/dialog/],
];

const composed: Array<[string, string]> = [
  ['rating', rating],
  ['tag-input', tagInput],
  ['input-otp', inputOtp],
];

describe('advanced inputs', () => {
  it.each(baseUi)('%s is built on a Base UI primitive', (_n, src, re) => {
    expect(src).toMatch(re);
  });

  it.each([...baseUi.map(([n, s]) => [n, s] as [string, string]), ...composed])(
    '%s does not import Radix',
    (_n, src) => {
      expect(src).not.toMatch(/@radix-ui/);
    },
  );

  it('composed controls are controlled (value + onValueChange)', () => {
    expect(rating).toMatch(/onValueChange/);
    expect(tagInput).toMatch(/onValueChange/);
    expect(inputOtp).toMatch(/onValueChange/);
  });
});
