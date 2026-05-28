import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// ?raw import of CSS files returns '' under Vitest's node environment because
// the Tailwind Vite plugin chain is not present in the test runner.
// Reading from disk with readFileSync bypasses that limitation.
const css = readFileSync(
  fileURLToPath(new URL('../styles/global.css', import.meta.url)),
  'utf-8',
);

import baseLayout from '../layouts/BaseLayout.astro?raw';
import index from '../pages/index.astro?raw';
import gallery from '../pages/gallery/index.astro?raw';
import demos from '../pages/demos/index.astro?raw';
import data from '../pages/demos/data.astro?raw';
import dashboard from '../pages/demos/dashboard.astro?raw';

describe('@view-transition setup', () => {
  it('declares @view-transition { navigation: auto; }', () => {
    expect(css).toMatch(/@view-transition\s*\{[^}]*navigation:\s*auto/);
  });

  it('honors prefers-reduced-motion', () => {
    expect(css).toMatch(/prefers-reduced-motion:\s*reduce/);
    expect(css).toMatch(/::view-transition-old\(root\)/);
  });

  it('annotates the body element with view-transition-name', () => {
    expect(baseLayout).toMatch(/view-transition-name:\s*body-bg/);
  });

  it('uses a consistent page-title transition-name on each route', () => {
    [index, gallery, demos, data, dashboard].forEach((src) => {
      expect(src).toMatch(/view-transition-name:\s*page-title/);
    });
  });
});
