/** Type declarations for ci-changes.mjs — consumed by tsc and astro check. */
export const DOCS_ONLY: RegExp[];
export function classify(opts: { eventName: string; draft: boolean; files?: string[] }): {
  heavy: boolean;
  reason: string;
};
