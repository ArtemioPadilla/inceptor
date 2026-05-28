import type { en } from './en';

/**
 * Spanish dictionary — must structurally satisfy the English shape. Adding a
 * key to `en.ts` produces a type error here until the Spanish version is
 * provided. That's by design.
 */
export const es: typeof en = {
  nav: {
    home: 'Inicio',
    gallery: 'Galería',
    demos: 'Demos',
    docs: 'Documentación',
    blog: 'Blog',
    switchLanguage: 'English',
  },
  home: {
    title: 'Lanza más rápido. Lanza con principios.',
    tagline:
      'Un scaffold de Astro + React para desarrollo guiado por issues, con ética, accesibilidad y TDD integrados.',
    ctaPrimary: 'Ver la galería',
    ctaSecondary: 'Leer la documentación',
  },
  footer: {
    builtWith: 'Hecho con Astro, Tailwind, shadcn y Claude Code',
    license: 'Licencia MIT',
  },
};
