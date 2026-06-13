/**
 * Sidebar configuration for the /docs/* route.
 *
 * Each section is an object with a label and an array of pages or sub-groups.
 * Pages reference content-collection slugs (paths under src/content/docs/
 * without the .md / .mdx extension).
 *
 * Single source of truth — used by:
 *   - src/components/docs/DocsSidebar.astro
 *   - src/components/docs/DocsBreadcrumb.astro
 *   - src/pages/docs/[...slug].astro (for next/prev navigation)
 */

export interface DocsLink {
  label: string;
  slug: string;
}

export interface DocsGroup {
  label: string;
  items: DocsLink[];
}

export const docsSidebar: DocsGroup[] = [
  {
    label: 'Start here',
    items: [
      { label: 'Documentation home', slug: '' },
      { label: 'Quick start', slug: 'start-here/quick-start' },
      { label: 'What you get', slug: 'start-here/what-you-get' },
      { label: 'The 60-second Inceptor tour', slug: 'start-here/inceptor-tour' },
    ],
  },
  {
    label: 'Stack',
    items: [
      { label: 'Overview', slug: 'stack/overview' },
      { label: 'Forbidden imports', slug: 'stack/forbidden-imports' },
    ],
  },
  {
    label: 'How we work',
    items: [
      { label: 'Inceptor', slug: 'how-we-work/inceptor' },
      { label: 'Shape Up cadence', slug: 'how-we-work/shape-up' },
      { label: 'TDD with trailers', slug: 'how-we-work/tdd' },
      { label: 'Spec-DD with Zod', slug: 'how-we-work/spec-dd' },
      { label: 'Orchestration', slug: 'how-we-work/orchestration' },
      { label: 'Sub-agents', slug: 'how-we-work/sub-agents' },
    ],
  },
  {
    label: 'Ethics & UX',
    items: [
      { label: 'Persuasive-tech framework', slug: 'ethics-ux/framework' },
      { label: 'The 8-item checklist', slug: 'ethics-ux/checklist' },
      { label: 'UX quality bar', slug: 'ethics-ux/quality-bar' },
      { label: 'Stakeholder Analysis', slug: 'ethics-ux/stakeholder-analysis' },
    ],
  },
  {
    label: 'Building',
    items: [
      { label: 'Adding a component', slug: 'building/adding-a-component' },
      { label: 'Hydration directives', slug: 'building/hydration' },
      { label: 'Compound-component gotcha', slug: 'building/compound-components' },
      { label: 'Theming & dark mode', slug: 'building/theming' },
      { label: 'Testing — Vitest + Playwright', slug: 'building/testing' },
      { label: 'Visual regression', slug: 'building/visual-regression' },
      { label: 'Self-hosted backend', slug: 'building/backend' },
    ],
  },
  {
    label: 'Patterns',
    items: [
      { label: 'Overview', slug: 'patterns' },
      { label: 'Listing', slug: 'patterns/listing' },
      { label: 'Create flow', slug: 'patterns/create-flow' },
      { label: 'Details page', slug: 'patterns/details-page' },
      { label: 'Delete with confirmation', slug: 'patterns/delete-confirm' },
      { label: 'Empty, error & loading states', slug: 'patterns/states' },
    ],
  },
  {
    label: 'Reference',
    items: [
      { label: 'Commands cheatsheet', slug: 'reference/commands' },
      { label: 'File structure', slug: 'reference/file-structure' },
      { label: 'Environment variables', slug: 'reference/env-vars' },
    ],
  },
  {
    label: 'Decisions',
    items: [
      { label: 'Template', slug: 'decisions/template' },
      { label: '0001 — Shape Up over Scrum', slug: 'decisions/0001-shape-up-over-scrum' },
      { label: '0002 — Base UI over Radix', slug: 'decisions/0002-base-ui-over-radix' },
      { label: '0003 — Centinela verdict tokens', slug: 'decisions/0003-centinela-verdict-tokens' },
      { label: '0004 — Custom /docs route', slug: 'decisions/0004-custom-docs-route' },
      { label: '0005 — Base UI component library', slug: 'decisions/0005-base-ui-component-library' },
      { label: '0003 — Starlight for the docs site (superseded)', slug: 'decisions/0003-starlight-for-docs' },
    ],
  },
  {
    label: 'History',
    items: [
      { label: 'Integration plan (v1.0)', slug: 'history/integration-plan' },
      { label: 'Roadmap', slug: 'history/roadmap' },
    ],
  },
];

/** Flattened list of all docs pages in sidebar order — used for prev/next. */
export const docsOrder: DocsLink[] = docsSidebar.flatMap((g) => g.items);
