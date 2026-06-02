import { describe, expect, it } from 'vitest';
import combobox from './combobox.tsx?raw';
import command from './command-palette.tsx?raw';
import navMenu from './navigation-menu.tsx?raw';
import menubar from './menubar.tsx?raw';
import stepper from './stepper.tsx?raw';

const baseUi: Array<[string, string, RegExp]> = [
  ['combobox', combobox, /@base-ui-components\/react\/combobox/],
  ['navigation-menu', navMenu, /@base-ui-components\/react\/navigation-menu/],
  ['menubar', menubar, /@base-ui-components\/react\/menubar/],
  ['command-palette', command, /@base-ui-components\/react\/dialog/],
];

describe('navigation & menus', () => {
  it.each(baseUi)('%s is built on a Base UI primitive', (_n, src, re) => {
    expect(src).toMatch(re);
  });

  it.each([...baseUi.map(([n, s]) => [n, s] as [string, string]), ['stepper', stepper]])(
    '%s does not import Radix',
    (_n, src) => {
      expect(src).not.toMatch(/@radix-ui/);
    },
  );

  it('command palette wires the ⌘K / Ctrl+K shortcut', () => {
    expect(command).toMatch(/metaKey|ctrlKey/);
    expect(command).toMatch(/['"]k['"]/i);
  });

  it('stepper is dependency-free markup', () => {
    expect(stepper).toMatch(/<ol/);
    expect(stepper).not.toMatch(/@base-ui-components/);
  });
});
