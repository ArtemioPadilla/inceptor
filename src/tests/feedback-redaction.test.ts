// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { buildErrorReportBody, redactUrl } from '@/lib/report-issue';

/**
 * Issue reports (FeedbackFAB, ErrorBoundary, HydrationCanary) are filed as
 * PUBLIC GitHub issues. Query strings and fragments routinely carry secrets —
 * magic-link / OAuth tokens (`#access_token=…`, the Supabase recipe's
 * redirect), password-reset codes, search terms, ids — so reports must keep
 * origin + path only.
 */
describe('redactUrl', () => {
  it('drops query and fragment values from absolute URLs', () => {
    expect(
      redactUrl('https://app.example/auth/callback?code=abc&next=/x#access_token=SECRET'),
    ).toBe('https://app.example/auth/callback?[redacted]#[redacted]');
  });

  it('leaves clean URLs untouched', () => {
    expect(redactUrl('https://app.example/docs/')).toBe('https://app.example/docs/');
  });

  it('handles relative request URLs captured by the network log', () => {
    expect(redactUrl('/api/search?q=my+private+query')).toBe('/api/search?[redacted]');
  });

  it('never throws and never echoes an unparseable input with a query', () => {
    expect(redactUrl('::not a url?token=1')).toBe('::not a url?[redacted]');
    expect(redactUrl('')).toBe('');
  });
});

describe('buildErrorReportBody', () => {
  afterEach(() => window.history.replaceState({}, '', '/'));

  it('reports the current URL without its query or fragment', () => {
    window.history.replaceState({}, '', '/reset-password?token=SECRET#access_token=SECRET2');
    const body = buildErrorReportBody({ error: new Error('boom') });
    expect(body).not.toContain('SECRET');
    expect(body).toContain('/reset-password?[redacted]#[redacted]');
  });
});

describe('FeedbackFAB diagnostics', () => {
  const fab = readFileSync(join(process.cwd(), 'src/components/common/FeedbackFAB.astro'), 'utf8');

  it('never puts the raw location.href into the diagnostics', () => {
    expect(fab).not.toMatch(/url:\s*location\.href/);
    expect(fab).toMatch(/url:\s*redact\(location\.href\)/);
  });

  it('redacts captured network request URLs', () => {
    expect(fab).toMatch(/url:\s*redact\(urlStr\)/);
  });
});

describe('other issue-report entry points', () => {
  it('AIChatDemo thumbs-down report redacts the URL', () => {
    const src = readFileSync(join(process.cwd(), 'src/components/islands/AIChatDemo.tsx'), 'utf8');
    expect(src).not.toMatch(/URL: \$\{window\.location\.href\}/);
    expect(src).toContain('redactUrl(window.location.href)');
  });
});
