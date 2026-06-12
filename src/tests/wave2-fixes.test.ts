import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

// Source-level guards for Wave 2 (trust & polish) of docs/AUDIT-2026-06.md §4, §5.
// Each assertion pins a specific code-level property so regressions are caught
// at the test layer before a deploy.

const read = (p: string) => readFileSync(new URL(`../../${p}`, import.meta.url), 'utf-8');

describe('audit wave 2 — trust & polish', () => {

  // ── 1. SiteFooter ────────────────────────────────────────────────────────
  describe('SiteFooter', () => {
    it('exists as a component file', () => {
      // If this throws the file is missing
      const footer = read('src/components/common/SiteFooter.astro');
      expect(footer.length).toBeGreaterThan(0);
    });

    it('is imported and rendered from BaseLayout', () => {
      const layout = read('src/layouts/BaseLayout.astro');
      expect(layout).toContain("import SiteFooter from '../components/common/SiteFooter.astro'");
      expect(layout).toContain('<SiteFooter />');
    });

    it('uses withBase() for all internal links', () => {
      const footer = read('src/components/common/SiteFooter.astro');
      // Every href that points to an internal path must go through withBase.
      // We assert the helper is imported and called.
      expect(footer).toContain("import { withBase } from '@/lib/href'");
      expect(footer).toMatch(/withBase\(/);
    });

    it('contains a GitHub link', () => {
      const footer = read('src/components/common/SiteFooter.astro');
      expect(footer).toContain('github.com/ArtemioPadilla/inceptor');
    });

    it('contains an MIT license note', () => {
      const footer = read('src/components/common/SiteFooter.astro');
      expect(footer.toLowerCase()).toContain('mit');
    });

    it('contains a "Built with Inceptor" credit', () => {
      const footer = read('src/components/common/SiteFooter.astro');
      expect(footer).toContain('Built with');
      expect(footer).toContain('Inceptor');
    });

    it('contains EN and ES language switcher links', () => {
      const footer = read('src/components/common/SiteFooter.astro');
      expect(footer).toContain('hreflang="en"');
      expect(footer).toContain('hreflang="es"');
    });
  });

  // ── 2. BaseLayout head plumbing ─────────────────────────────────────────
  describe('BaseLayout', () => {
    it('derives canonical URL from Astro.site + Astro.url.pathname', () => {
      const layout = read('src/layouts/BaseLayout.astro');
      expect(layout).toContain('Astro.site');
      expect(layout).toContain('Astro.url.pathname');
      expect(layout).toContain('rel="canonical"');
    });

    it('emits hreflang alternates when the alternates prop is provided', () => {
      const layout = read('src/layouts/BaseLayout.astro');
      expect(layout).toContain('alternates');
      expect(layout).toContain('rel="alternate"');
      expect(layout).toContain('hreflang');
    });

    it('contains color-scheme meta tag', () => {
      const layout = read('src/layouts/BaseLayout.astro');
      expect(layout).toContain('name="color-scheme"');
      expect(layout).toContain('light dark');
    });

    it('has a skip-to-content link as the first interactive element in body', () => {
      const layout = read('src/layouts/BaseLayout.astro');
      // The skip link must target #main-content and carry sr-only classes
      expect(layout).toContain('href="#main-content"');
      expect(layout).toContain('sr-only');
      // It must appear before SiteHeader in the source (body order)
      const skipIdx = layout.indexOf('href="#main-content"');
      const headerIdx = layout.indexOf('<SiteHeader />');
      expect(skipIdx).toBeLessThan(headerIdx);
    });
  });

  // ── 3. global.css ────────────────────────────────────────────────────────
  describe('global.css', () => {
    it('has color-scheme: light on :root / .light', () => {
      const css = read('src/styles/global.css');
      // color-scheme: light must appear inside the :root, .light block
      expect(css).toContain('color-scheme: light');
    });

    it('has color-scheme: dark on .dark', () => {
      const css = read('src/styles/global.css');
      expect(css).toContain('color-scheme: dark');
    });

    it('defines --destructive-foreground in both light and dark scopes', () => {
      const css = read('src/styles/global.css');
      // The token must appear at least twice (light + dark declarations)
      const occurrences = (css.match(/--destructive-foreground:/g) ?? []).length;
      expect(occurrences).toBeGreaterThanOrEqual(2);
    });

    it('maps --color-destructive-foreground in the @theme inline block', () => {
      const css = read('src/styles/global.css');
      expect(css).toContain('--color-destructive-foreground: var(--destructive-foreground)');
    });
  });

  // ── 4. index.astro — no hardcoded stats ──────────────────────────────────
  describe('index.astro stats', () => {
    it('does not hardcode the old "439" test count', () => {
      const page = read('src/pages/index.astro');
      expect(page).not.toContain("'439'");
      expect(page).not.toContain('"439"');
    });

    it('does not hardcode the old "60" pages count', () => {
      const page = read('src/pages/index.astro');
      // The string '60' as a standalone stat value should be gone;
      // it may still appear as part of e.g. line comments so we test for
      // the specific stat literal form used in the old code.
      expect(page).not.toContain("value: '60'");
      expect(page).not.toContain('value: "60"');
    });

    it('computes pageCount via import.meta.glob at build time', () => {
      const page = read('src/pages/index.astro');
      expect(page).toContain('import.meta.glob');
      expect(page).toContain('pageCount');
    });

    it('computes testFileCount via import.meta.glob at build time', () => {
      const page = read('src/pages/index.astro');
      expect(page).toContain('testFileCount');
    });

    it('passes alternates prop to BaseLayout for hreflang', () => {
      const page = read('src/pages/index.astro');
      expect(page).toContain('alternates={alternates}');
    });
  });

  // ── 5. FeedbackFAB — panel centered (native <dialog> top-layer) ──────────
  describe('FeedbackFAB dialog centering', () => {
    it('dialog relies on native top-layer centering (m-auto), not corner pinning', () => {
      const fab = read('src/components/common/FeedbackFAB.astro');
      // Corner-pinning with fixed/bottom/right fights the UA stylesheet's
      // `inset: 0` and stretches the panel to the top-left (live bug,
      // user-reported). The dialog must center via margin:auto instead.
      expect(fab).toContain('m-auto');
      const dialogTag = fab.slice(fab.indexOf('<dialog'), fab.indexOf('</header>'));
      expect(dialogTag).not.toMatch(/fixed bottom-\d+ right-\d+/);
      expect(dialogTag).not.toContain('m-0"');
    });
  });

  // ── 6. SiteHeader language switcher ────────────────────────────────────
  describe('SiteHeader language switcher', () => {
    it('contains EN and ES toggle links', () => {
      const header = read('src/components/common/SiteHeader.astro');
      expect(header).toContain('hreflang="en"');
      expect(header).toContain('hreflang="es"');
    });

    it('uses withBase() for the switcher hrefs', () => {
      const header = read('src/components/common/SiteHeader.astro');
      // Both links must go through withBase for subpath correctness
      const matches = header.match(/withBase\(['"]\//g) ?? [];
      // At minimum: home /, /es/, and any nav links
      expect(matches.length).toBeGreaterThanOrEqual(2);
    });
  });

  // ── 7. es/index.astro ────────────────────────────────────────────────────
  // Updated for ES parity: /es/ is now a full translation matching the EN home
  // structure (hero + stats + loop + kit), not a minimal pattern-demo page.
  describe('es/index.astro', () => {
    it('has correct capital-I Inceptor branding in the title', () => {
      const page = read('src/pages/es/index.astro');
      // Must contain 'Inceptor' (capital I) — the old lowercase "inceptor — ES"
      // title was one of the audit findings (§4.6). The new full title is
      // "Inceptor — scaffold de desarrollo guiado por issues".
      expect(page).toContain('Inceptor —');
      expect(page).not.toContain('"inceptor — ES"');
    });

    it('passes alternates prop for hreflang', () => {
      const page = read('src/pages/es/index.astro');
      expect(page).toContain('alternates={alternates}');
    });

    it('is a full-parity page with hero, stats strip, loop section, and kit grid', () => {
      const page = read('src/pages/es/index.astro');
      // Hero section markers
      expect(page).toContain('home.ctaPrimary');
      expect(page).toContain('home.ctaSecondary');
      // Stats strip
      expect(page).toContain('home.statPages');
      expect(page).toContain('StatusBadgeStrip');
      // Loop section
      expect(page).toContain('home.loopHeading');
      // Kit grid
      expect(page).toContain('home.kitHeading');
      expect(page).toContain('galleryManifest');
    });
  });

  // ── 8. DashboardIsland — Skeleton usage ──────────────────────────────────
  describe('DashboardIsland', () => {
    it('imports Skeleton from the ui library', () => {
      const island = read('src/components/islands/DashboardIsland.tsx');
      expect(island).toContain("from '@/components/ui/skeleton'");
    });

    it('does not render the DataTable while loading', () => {
      const island = read('src/components/islands/DashboardIsland.tsx');
      // The loading guard must come before DataTable render — we assert
      // that 'loading' check precedes the DataTable component usage.
      const loadingIdx = island.indexOf('loading ? (');
      const tableIdx = island.indexOf('<DataTable');
      expect(loadingIdx).toBeLessThan(tableIdx);
    });

    it('shows a friendly empty state for open vs closed when both are 0', () => {
      const island = read('src/components/islands/DashboardIsland.tsx');
      // After a successful load with no issues, a friendly message shows
      expect(island).toContain('bothEmpty');
    });

    it('no longer uses bare "…" string for metric loading placeholder', () => {
      const island = read('src/components/islands/DashboardIsland.tsx');
      // The old code used: value={loading ? '…' : someCount}
      expect(island).not.toContain("'…'");
    });

    it('no longer uses bare "Loading…" paragraph placeholders', () => {
      const island = read('src/components/islands/DashboardIsland.tsx');
      expect(island).not.toContain('>Loading…<');
    });
  });
});

