import { describe, it, expect } from 'vitest';
import { detectLocale, localizedPath, t, LOCALES, DEFAULT_LOCALE } from '../i18n';

describe('i18n', () => {
  describe('detectLocale', () => {
    it('returns the default locale for unprefixed paths', () => {
      expect(detectLocale('/')).toBe('en');
      expect(detectLocale('/gallery')).toBe('en');
      expect(detectLocale('/docs/start-here/quick-start')).toBe('en');
    });

    it('detects an explicit locale prefix', () => {
      expect(detectLocale('/es')).toBe('es');
      expect(detectLocale('/es/')).toBe('es');
      expect(detectLocale('/es/about')).toBe('es');
    });

    it('does not match partial matches like /espresso', () => {
      expect(detectLocale('/espresso')).toBe('en');
    });
  });

  describe('localizedPath', () => {
    it('strips the prefix when switching to the default locale', () => {
      expect(localizedPath('/es/about', 'en')).toBe('/about');
      expect(localizedPath('/es', 'en')).toBe('/');
    });

    it('adds the prefix when switching to a non-default locale', () => {
      expect(localizedPath('/about', 'es')).toBe('/es/about');
      expect(localizedPath('/', 'es')).toBe('/es');
    });

    it('round-trips between locales without losing the path', () => {
      const original = '/gallery/button';
      const inEs = localizedPath(original, 'es');
      const backToEn = localizedPath(inEs, 'en');
      expect(backToEn).toBe(original);
    });
  });

  describe('t', () => {
    it('resolves a dot-path key in the requested locale', () => {
      expect(t('en', 'nav.home')).toBe('Home');
      expect(t('es', 'nav.home')).toBe('Inicio');
    });

    it('falls back to the default locale when a key is missing', () => {
      // Force a missing key by asking for one we know is not in the dictionaries
      const missing = t('es', 'nav.nonexistent');
      // We expect the raw key back (or the default-locale value if it existed)
      expect(missing).toBe('nav.nonexistent');
    });
  });

  describe('module shape', () => {
    it('exposes the configured locale list', () => {
      expect(LOCALES).toContain('en');
      expect(LOCALES).toContain('es');
      expect(DEFAULT_LOCALE).toBe('en');
    });
  });
});
