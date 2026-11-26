/** Type declarations for ci-push-guard.mjs — consumed by tsc and astro check. */
export type GuardState = { day: string; count: number };
export function isCostly(command: string): boolean;
export function decide(opts: { command: string; state?: GuardState; now?: Date; limit?: number }): {
  decision: 'allow' | 'ask';
  state: GuardState;
  reason?: string;
};
