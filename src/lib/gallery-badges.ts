import type { GalleryEntry } from '@/content/gallery';

/**
 * Maps a gallery entry's `status` to the same ✅/🔵/🧪 glyph legend already
 * used in `docs/component-catalog.md` (ROADMAP Epic 16 — "extend the
 * existing stability glyphs ... onto each component's /gallery detail
 * page"). Single-sourced here so `scripts/gen-component-catalog.ts` and
 * `src/pages/gallery/[component].astro` never drift on the mapping.
 */
export function stabilityGlyph(status: GalleryEntry['status']): string {
  if (status === 'stable') return '✅';
  if (status === 'beta') return '🔵';
  return '🧪';
}

/** Default hydration directive assumed when a gallery entry doesn't set one. */
export const DEFAULT_HYDRATION_DIRECTIVE = 'client:visible' as const;

/**
 * Resolves the hydration directive to show as a badge on the gallery detail
 * page. Falls back to `client:visible` — the directive every gallery demo
 * island already uses in `[component].astro` — so existing entries that
 * never set `hydration` still get an accurate badge without a manifest-wide
 * backfill (ROADMAP Epic 16 explicitly allows this backward-compatible
 * default instead of requiring every entry to be updated).
 */
export function getHydrationDirective(entry: Pick<GalleryEntry, 'hydration'>): string {
  return entry.hydration ?? DEFAULT_HYDRATION_DIRECTIVE;
}
