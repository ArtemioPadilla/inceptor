import { describe, expect, it } from 'vitest';
import index from '../pages/gallery/index.astro?raw';
import component from '../pages/gallery/[component].astro?raw';
import manifestSrc from '../content/gallery.ts?raw';

// These tests verify that the /gallery routes are wired correctly by
// inspecting the raw source. They guard against accidental removal of
// island imports or hydration directives during refactors.

describe('gallery/index.astro', () => {
  it('uses BaseLayout', () => {
    expect(index).toMatch(/from\s+['"]\.\.\/\.\.\/layouts\/BaseLayout\.astro['"]/);
  });

  it('imports the gallery manifest + category helpers', () => {
    expect(index).toMatch(/galleryManifest/);
    expect(index).toMatch(/categoryLabels/);
    expect(index).toMatch(/categoryOrder/);
    expect(index).toMatch(/getByCategory/);
  });

  it('renders a link into /gallery/<slug>/ for each entry', () => {
    expect(index).toMatch(/\/gallery\/\$\{[^}]+\.slug\}\//);
  });
});

describe('gallery/[component].astro', () => {
  it('uses BaseLayout', () => {
    expect(component).toMatch(/from\s+['"]\.\.\/\.\.\/layouts\/BaseLayout\.astro['"]/);
  });

  it('statically imports every Showcase island (Astro can analyze hydration)', () => {
    const islands = [
      'ShowcaseSimples',
      'ShowcaseDialog',
      'ShowcaseDropdown',
      'ShowcaseTabs',
      'ShowcaseToast',
      'ShowcaseForm',
      'ShowcaseDataTable',
      'ShowcaseKpis',
      'ShowcaseCharts',
      'MotionDemo',
      'ShowcasePWA',
      'ShowcaseErrorBoundary',
    ];
    for (const name of islands) {
      expect(component).toMatch(new RegExp(`import\\s+${name}\\s+from`));
    }
  });

  it('renders both light and dark columns with the same island', () => {
    // The dark column lives in a `<div class="dark ...">` wrapper.
    expect(component).toMatch(/class="dark /);
    // client:visible is used (compound components stay zero-JS until scrolled to).
    expect(component).toMatch(/client:visible/);
  });

  it('does not use client:load', () => {
    expect(component).not.toMatch(/client:load/);
  });

  it('uses getStaticPaths from the manifest', () => {
    expect(component).toMatch(/getStaticPaths/);
    expect(component).toMatch(/galleryManifest\.map/);
  });
});

describe('gallery manifest', () => {
  it('declares the GalleryEntry interface', () => {
    expect(manifestSrc).toMatch(/interface\s+GalleryEntry/);
  });

  it('lists at least 10 components', () => {
    // A coarse guard against accidental manifest deletion. Tightens once
    // Epic 16 stretch goals add more entries.
    const matches = manifestSrc.match(/slug:\s*'/g) ?? [];
    expect(matches.length).toBeGreaterThanOrEqual(10);
  });

  it('includes every required category', () => {
    for (const cat of ['primitives', 'compound', 'data', 'charts', 'motion', 'pwa', 'idd']) {
      expect(manifestSrc).toContain(`'${cat}'`);
    }
  });
});
