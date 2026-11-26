/** Type declarations for ci-budget.mjs — consumed by tsc and astro check. */
export const DEFAULT_LIMIT: number;
export const OVERRIDE_LABEL: string;
export function evaluateBudget(opts: {
  eventName: string;
  repo: string;
  token: string;
  prNumber?: number;
  limit: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- injectable fetch stub in tests
  fetchImpl?: (url: string, init?: any) => Promise<any>;
  now?: Date;
  apiUrl?: string;
}): Promise<{ code: number; messages: { level: string; text: string }[] }>;
