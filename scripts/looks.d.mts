/** Type declarations for looks.mjs — consumed by tsc and astro check. */
export interface Look {
  summary: string;
  display: { pkg: string; family?: string; file?: string; stack?: string };
  blocks: string[];
  assets: string[];
}
export const LOOKS: Record<'editorial' | 'bold' | 'product', Look>;
export function fontPackages(look: string): string[];
export function lookCss(css: string, look: string, displayFaces?: string): string;
export function landing(look: string, options: { name: string; lang: string }): string;
