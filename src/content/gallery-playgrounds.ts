/**
 * Per-slug live-editor snippets for the /gallery/<slug> detail pages
 * (ROADMAP Epic 16 — "<Playground> live prop editing"). Keyed by the same
 * `slug` used in `gallery.ts`, mirroring `gallery-recipes.ts`'s pattern.
 *
 * Proof-of-concept scope: wired into a handful of simple, self-contained
 * gallery entries (Button/Badge live in `primitives`, Alert lives in
 * `feedback`, Skeleton lives in `disclosure`) rather than every component —
 * see `src/lib/playground-scope.ts` for the fixed scope these snippets run
 * against. If a slug is absent here, the detail page simply doesn't render
 * a "Live playground" section.
 */

export interface GalleryPlayground {
  /** Initial code shown in the editor — a single JSX expression, or
   * multi-statement code ending in an explicit `render(<Element />)` call. */
  code: string;
}

export const galleryPlaygrounds: Record<string, GalleryPlayground> = {
  primitives: {
    code: `<Button variant="outline">Click me</Button>`,
  },
  feedback: {
    code: `<Alert>
  <AlertTitle>Heads up</AlertTitle>
  <AlertDescription>Edit this snippet — try a different variant prop.</AlertDescription>
</Alert>`,
  },
  disclosure: {
    code: `<Skeleton className="h-4 w-40" />`,
  },
};
