/** Type declarations for state.mjs — consumed by tsc and astro check. */
export function readState<T>(path: string, fallback?: T | null): T | null;
export function writeStateAtomic(path: string, value: unknown): void;
export function updateState<T>(
  path: string,
  update: (prev: T | null) => T | undefined | Promise<T | undefined>,
  fallback?: T | null,
): Promise<T | null>;
