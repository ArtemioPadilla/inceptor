import { describe, it, expect } from 'vitest';
import { formatDate } from '../lib/format-date';

/**
 * Unit tests for the locale-aware date formatter (issue #186).
 *
 * We pin the test date to 2026-06-09 UTC. `Intl.DateTimeFormat` interprets a
 * bare `Date` in the local timezone, so we construct with a UTC timestamp to
 * keep results consistent across machines and CI.
 */
const DATE = new Date('2026-06-09T12:00:00Z'); // noon UTC — avoids day-boundary edge cases

describe('formatDate', () => {
  it('formats in English by default', () => {
    const result = formatDate(DATE, 'en');
    // en-US long dateStyle: "June 9, 2026"
    expect(result).toMatch(/June/);
    expect(result).toMatch(/2026/);
  });

  it('formats in Spanish with month name in Spanish', () => {
    const result = formatDate(DATE, 'es');
    // es-419 long dateStyle: "9 de junio de 2026"
    expect(result).toMatch(/junio/i);
    expect(result).toMatch(/2026/);
  });

  it('accepts custom Intl options', () => {
    const result = formatDate(DATE, 'en', { year: 'numeric', month: 'short' });
    expect(result).toMatch(/Jun/);
    expect(result).toMatch(/2026/);
  });

  it('returns a non-empty string for all supported locales', () => {
    const locales = ['en', 'es'] as const;
    for (const locale of locales) {
      expect(formatDate(DATE, locale).length).toBeGreaterThan(0);
    }
  });
});
