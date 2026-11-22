/**
 * Known-harmless browser console noise for the console-guard fixture.
 * Pure module (no Playwright import) so the patterns are unit-tested in
 * src/tests/console-allowlist.test.ts.
 *
 * Matching runs against `describeConsoleMessage(text, url)`, i.e. the console
 * text plus " @ <source url>": Chrome's network failures ("Failed to load
 * resource: …") carry the URL only in msg.location(), never in the text.
 *
 * Keep the list tight and always add a comment explaining *why* each entry
 * exists.
 */
export const ALLOWLIST: RegExp[] = [
  // GitHub API rate-limits unauthenticated requests (shared CI runner IPs hit
  // it routinely); the dashboard island catches this and degrades gracefully.
  // Only 403/429 and only from api.github.com — anything else still fails.
  /^Failed to load resource: the server responded with a status of (403|429)\b.* @ https:\/\/api\.github\.com\//,
  /api\.github\.com.*rate limit/i,
  // Pagefind emits a 404 for its WASM worker on first load when the search
  // index hasn't been built yet (e.g. in smoke tests that skip `npm run build`).
  /pagefind.*404/i,
  /Failed to load resource.*pagefind/i,
];

/** Console text plus its source URL (when known), as matched and reported. */
export function describeConsoleMessage(text: string, url?: string): string {
  return url ? `${text} @ ${url}` : text;
}

/** Returns true when the message matches a known-harmless allowlist pattern. */
export function isAllowed(message: string): boolean {
  return ALLOWLIST.some((pattern) => pattern.test(message));
}
