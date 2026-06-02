/**
 * English dictionary. Adding a key here implicitly widens the shared
 * `Dictionary` type (`typeof en`), so other locales must add the same key
 * to satisfy it. That's the type-safe equivalent of "translation completeness".
 */
export const en = {
  nav: {
    home: 'Home',
    gallery: 'Gallery',
    demos: 'Demos',
    docs: 'Docs',
    blog: 'Blog',
    switchLanguage: 'Español',
  },
  home: {
    title: 'Ship faster. Ship principled.',
    tagline:
      'An Astro + React scaffold for Inceptor with built-in ethics, accessibility, and TDD guardrails.',
    ctaPrimary: 'Browse the gallery',
    ctaSecondary: 'Read the docs',
  },
  gallery: {
    title: 'Component gallery',
    tagline:
      'Browse the full set of shadcn-on-Base-UI primitives and themed charts, each rendered as an Astro island.',
    cta: 'Open the gallery',
  },
  docsLanding: {
    title: 'Documentation',
    tagline:
      'Guides, conventions, and architecture decisions for building on the Inceptor scaffold.',
    cta: 'Read the docs',
  },
  footer: {
    builtWith: 'Built with Astro, Tailwind, shadcn, and Claude Code',
    license: 'MIT licensed',
  },
};
