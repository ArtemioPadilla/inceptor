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

describe('gallery/[component].astro — props API section (#139)', () => {
  it('imports extractPropsForSource from component-docs', () => {
    expect(component).toMatch(/extractPropsForSource/);
    expect(component).toContain('component-docs');
  });

  it('derives repoRoot via fileURLToPath + import.meta.url (build-time only)', () => {
    // The extractor call is in the Astro frontmatter — confirmed by checking the
    // pattern used to resolve the repository root directory.
    expect(component).toContain('fileURLToPath');
    expect(component).toContain('import.meta.url');
    expect(component).toMatch(/repoRoot/);
  });

  it('renders the Props API section conditionally (only when propsTables.length > 0)', () => {
    // The section must be gated so components with no extractable Props interfaces
    // (e.g., directory sources that yield 0 rows) do not render an empty table block.
    expect(component).toMatch(/propsTables\.length\s*>\s*0/);
  });

  it('renders a table with Name / Type / Default / Description columns', () => {
    expect(component).toContain('Prop');
    expect(component).toContain('Type');
    expect(component).toContain('Default');
    expect(component).toContain('Description');
  });

  it('includes the props-api section id for anchor navigation', () => {
    expect(component).toContain('id="props-api"');
  });

  it('shows full type in title attribute for truncated types', () => {
    // Long type unions are truncated to MAX_TYPE_LEN (60 chars); the full type
    // is available in the `title` attribute so users can hover to see it.
    expect(component).toContain('prop.fullType');
    expect(component).toContain('title=');
  });

  it('marks optional props with an opt label', () => {
    expect(component).toContain('prop.optional');
    expect(component).toContain('opt');
  });

  it('does not use client:* directives on the props section (build-time only)', () => {
    // The entire Props API extraction runs in the Astro frontmatter at build time.
    // The resulting HTML is static — no islands needed.
    // We already have the test that checks client:load is absent, but we also
    // want to confirm no client:visible was accidentally added inside the props section.
    // The component source uses client:visible only for Showcase islands (before props section).
    const propsIdx = component.indexOf('Props API');
    const clientAfterProps = component.slice(propsIdx).match(/client:(visible|load|idle)/);
    expect(clientAfterProps).toBeNull();
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
    for (const cat of ['primitives', 'compound', 'data', 'charts', 'motion', 'pwa', 'inceptor']) {
      expect(manifestSrc).toContain(`'${cat}'`);
    }
  });
});
