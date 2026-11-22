import { describe, expect, it } from 'vitest';
import { describeConsoleMessage, isAllowed } from '../../tests/fixtures/console-allowlist';

/**
 * The smoke suite's console guard had an allowlist entry for GitHub API rate
 * limits (`/api\.github\.com.*rate limit/i`) that could never match: Chrome
 * reports a failed fetch as "Failed to load resource: the server responded
 * with a status of 403 ()" — the URL lives in msg.location(), not the text.
 * So /demos/dashboard/ failed CI whenever the shared runner IP was
 * rate-limited, on PRs that didn't touch it.
 */
const chrome403 = (status: string) =>
  `Failed to load resource: the server responded with a status of 403 ${status}`;

describe('console allowlist', () => {
  it('allows a GitHub API rate-limit 403 (CI form and local form)', () => {
    for (const status of ['()', '(Forbidden)']) {
      const msg = describeConsoleMessage(
        chrome403(status),
        'https://api.github.com/repos/o/r/issues?state=open',
      );
      expect(isAllowed(msg)).toBe(true);
    }
  });

  it('allows a 429 from the GitHub API too', () => {
    const msg = describeConsoleMessage(
      'Failed to load resource: the server responded with a status of 429 ()',
      'https://api.github.com/repos/o/r',
    );
    expect(isAllowed(msg)).toBe(true);
  });

  it('still fails on a 403 from any other origin', () => {
    const msg = describeConsoleMessage(chrome403('()'), 'https://example.org/api/data');
    expect(isAllowed(msg)).toBe(false);
  });

  it('still fails on a GitHub API 500 or a 404 for our own assets', () => {
    expect(
      isAllowed(
        describeConsoleMessage(
          'Failed to load resource: the server responded with a status of 500 ()',
          'https://api.github.com/repos/o/r',
        ),
      ),
    ).toBe(false);
    expect(
      isAllowed(
        describeConsoleMessage(
          'Failed to load resource: the server responded with a status of 404 ()',
          'http://localhost:4321/_astro/missing.js',
        ),
      ),
    ).toBe(false);
  });

  it('keeps the existing pagefind entries working', () => {
    expect(
      isAllowed(
        describeConsoleMessage(
          'Failed to load resource: the server responded with a status of 404 ()',
          'http://localhost:4321/_pagefind/pagefind.js',
        ),
      ),
    ).toBe(true);
  });

  it('includes the source URL so failures say which resource broke', () => {
    expect(describeConsoleMessage('boom', 'https://x.test/a.js')).toBe(
      'boom @ https://x.test/a.js',
    );
    expect(describeConsoleMessage('boom', '')).toBe('boom');
  });
});
