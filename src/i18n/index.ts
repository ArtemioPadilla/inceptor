import { en } from './en';
import { es } from './es';

/**
 * The English dictionary is the structural source of truth — adding a key
 * to `en.ts` widens this type. Other locales must satisfy it (see `es.ts`).
 */
export type Dictionary = typeof en;

export const dictionaries: Record<'en' | 'es', Dictionary> = { en, es };
export type Locale = keyof typeof dictionaries;

export const DEFAULT_LOCALE: Locale = 'en';
export const LOCALES: readonly Locale[] = ['en', 'es'] as const;

/**
 * Detect locale from a URL pathname. Returns `'en'` when no `/<locale>/` prefix
 * matches — that mirrors `prefixDefaultLocale: false` in astro.config.mjs.
 */
export function detectLocale(pathname: string): Locale {
  const match = pathname.match(/^\/(en|es)(?:\/|$)/);
  return (match?.[1] as Locale) ?? DEFAULT_LOCALE;
}

/**
 * Translate a dot-path key against the chosen locale's dictionary, falling back
 * to English if the key is missing in the target locale (typical i18n behavior:
 * never render an empty string).
 */
export function t(locale: Locale, key: string): string {
  const lookup = (dict: Dictionary): string | undefined => {
    const parts = key.split('.');
    let cur: unknown = dict;
    for (const part of parts) {
      if (cur && typeof cur === 'object' && part in cur) {
        cur = (cur as Record<string, unknown>)[part];
      } else {
        return undefined;
      }
    }
    return typeof cur === 'string' ? cur : undefined;
  };
  return lookup(dictionaries[locale]) ?? lookup(dictionaries[DEFAULT_LOCALE]) ?? key;
}

/**
 * Produce the equivalent URL for a different locale, used by the language
 * switcher. `/about` ↔ `/es/about`; `/es/about` → `/about` with locale=`en`.
 */
export function localizedPath(pathname: string, target: Locale): string {
  const stripped = pathname.replace(/^\/(en|es)(?=\/|$)/, '') || '/';
  if (target === DEFAULT_LOCALE) return stripped;
  return stripped === '/' ? `/${target}` : `/${target}${stripped}`;
}
