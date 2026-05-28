import { describe, expect, it } from 'vitest';
import css from '../styles/global.css?raw';
import baseLayout from '../layouts/BaseLayout.astro?raw';
import index from '../pages/index.astro?raw';
import showcase from '../pages/showcase.astro?raw';
import data from '../pages/data.astro?raw';
import dashboard from '../pages/dashboard.astro?raw';

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
    [index, showcase, data, dashboard].forEach((src) => {
      expect(src).toMatch(/view-transition-name:\s*page-title/);
    });
  });
});
