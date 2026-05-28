import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import offlineBanner from '../components/islands/OfflineBanner.tsx?raw';
import installButton from '../components/islands/InstallButton.tsx?raw';
import updateToast from '../components/islands/UpdateToast.tsx?raw';

const css = readFileSync(
  fileURLToPath(new URL('../styles/global.css', import.meta.url)),
  'utf-8',
);

describe('tailwindcss-motion', () => {
  it('is registered as a Tailwind v4 @plugin in global.css', () => {
    expect(css).toMatch(/@plugin\s+["']tailwindcss-motion["']/);
  });

  it.each([
    ['OfflineBanner', offlineBanner],
    ['InstallButton', installButton],
    ['UpdateToast', updateToast],
  ])('%s uses motion utilities', (_name, source) => {
    expect(source).toMatch(/motion-(preset-|duration-|ease-|translate-|opacity-)/);
  });
});
