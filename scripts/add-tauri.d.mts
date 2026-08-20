/** Type declarations for add-tauri.mjs — consumed by tsc and astro check. */
export function deriveNames(name: string): { slug: string; libName: string };
export function isValidIdentifier(identifier: string): boolean;
export function substitutePlaceholders(text: string, vars: Record<string, string>): string;
export function mergePackageJson(
  existing: Record<string, any>,
  snippet: Record<string, any>,
): { merged: Record<string, any>; warnings: string[] };
export function appendGitignoreSnippet(existing: string, snippet: string): string;
export function main(argv?: string[]): void;
