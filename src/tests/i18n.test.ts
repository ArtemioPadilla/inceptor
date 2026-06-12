import { describe, it, expect } from 'vitest';
import { detectLocale, localizedPath, t, LOCALES, DEFAULT_LOCALE, collectLeafKeys, dictionaries } from '../i18n';

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

  // ── Key parity (issue #176) ────────────────────────────────────────────────
  // English is the structural source of truth. Every non-English locale must
  // carry exactly the same leaf keys — no more, no fewer. A missing key is a
  // compile error in es.ts (typeof en constraint), and a *narrower* shape is
  // blocked here at runtime so stale translations get caught in CI too.
  describe('key parity', () => {
    const enKeys = collectLeafKeys(dictionaries['en']).sort();

    it('es contains every key that en contains', () => {
      const esKeys = collectLeafKeys(dictionaries['es']).sort();
      const missingInEs = enKeys.filter((k) => !esKeys.includes(k));
      expect(missingInEs, `Keys in en but missing in es: ${missingInEs.join(', ')}`).toEqual([]);
    });

    it('en contains every key that es contains (no orphan es keys)', () => {
      const esKeys = collectLeafKeys(dictionaries['es']).sort();
      const extraInEs = esKeys.filter((k) => !enKeys.includes(k));
      expect(extraInEs, `Keys in es but missing in en: ${extraInEs.join(', ')}`).toEqual([]);
    });

    it('collectLeafKeys produces flat dot-paths', () => {
      const keys = collectLeafKeys({ nav: { home: 'Home', switchLanguage: 'Español' } });
      expect(keys).toContain('nav.home');
      expect(keys).toContain('nav.switchLanguage');
    });
  });
});
