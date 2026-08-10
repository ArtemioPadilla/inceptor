import { describe, expect, it } from 'vitest';
import { stabilityGlyph, getHydrationDirective } from './gallery-badges';

// ROADMAP Epic 16 — "Inline maturity/hydration badges" on /gallery/[component]
// detail pages. These two pure functions are the testable core of that
// feature; the Astro page just calls them (see gallery-page.test.ts for the
// source-inspection assertions on the wiring itself).

describe('stabilityGlyph', () => {
  it('maps stable to the checkmark glyph used in docs/component-catalog.md', () => {
    expect(stabilityGlyph('stable')).toBe('✅');
  });

  it('maps beta to the blue-circle glyph', () => {
    expect(stabilityGlyph('beta')).toBe('🔵');
  });

  it('maps experimental to the test-tube glyph', () => {
    expect(stabilityGlyph('experimental')).toBe('🧪');
  });
});

describe('getHydrationDirective', () => {
  it('returns the entry hydration value when set', () => {
    expect(getHydrationDirective({ hydration: 'client:idle' })).toBe('client:idle');
  });

  it('falls back to client:visible when hydration is omitted (backward-compatible default)', () => {
    expect(getHydrationDirective({})).toBe('client:visible');
  });

  it('falls back to client:visible when hydration is explicitly undefined', () => {
    expect(getHydrationDirective({ hydration: undefined })).toBe('client:visible');
  });
});
