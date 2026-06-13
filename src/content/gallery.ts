/**
 * Single source of truth for the /gallery/* route.
 *
 * Each entry describes one component or group on the gallery. The dynamic
 * route at /gallery/[component] consumes this manifest. Visual regression
 * baselines key off the `slug`, so every entry here automatically gets a
 * snapshot at tests/__screenshots__/chromium-{light,dark}/gallery-<slug>.png.
 */

export interface GalleryEntry {
  /** URL slug — appears as /gallery/<slug>. */
  slug: string;
  /** Display name. */
  name: string;
  /** One-line summary shown on the index page. */
  summary: string;
  /**
   * Path to the source file (used to display "Edit on GitHub" link).
   * Relative to the repo root.
   */
  source: string;
  /** Status tag shown as a small badge. */
  status: 'stable' | 'beta' | 'experimental';
  /**
   * Category bucket on the index page.
   */
  category: 'primitives' | 'forms' | 'advanced' | 'compound' | 'overlays' | 'disclosure' | 'feedback' | 'data' | 'charts' | 'motion' | 'pwa' | 'navmenu' | 'extras' | 'gen-ai' | 'inceptor';
  /**
   * Optional install command for shadcn-style components.
   * If omitted, the gallery omits the install section.
   */
  install?: string;
  /**
   * The Showcase* island that renders the rendered example.
   * Must be one of the keys in src/components/gallery/islands.ts.
   */
  island?: string;
}

export const galleryManifest: GalleryEntry[] = [
  // Primitives — single-element components from src/components/ui/
  {
    slug: 'primitives',
    name: 'Primitives',
    summary:
      'Button, Input, Label, Card, Table, Badge — every primitive in one place, every variant on screen.',
    source: 'src/components/ui/',
    status: 'stable',
    category: 'primitives',
    install: 'npx shadcn@latest add button input label card table badge --yes',
    island: 'ShowcaseSimples',
  },
  // Form controls — Base UI input primitives
  {
    slug: 'form-controls',
    name: 'Form controls',
    summary:
      'Select, Checkbox, Radio group, Switch, Slider, Textarea — every input on Base UI primitives.',
    source: 'src/components/ui/',
    status: 'stable',
    category: 'forms',
    install: 'npx shadcn@latest add select checkbox radio-group switch slider textarea --yes',
    island: 'ShowcaseFormControls',
  },
  // Advanced inputs — Base UI + composed controls
  {
    slug: 'advanced',
    name: 'Advanced inputs',
    summary:
      'Toggle, Toggle group, Number field, Toolbar, Sheet, Rating, Tag input, Input OTP.',
    source: 'src/components/ui/',
    status: 'stable',
    category: 'advanced',
    island: 'ShowcaseAdvanced',
  },
  // Compound components — shared internal state, single-island only
  {
    slug: 'dialog',
    name: 'Dialog',
    summary: 'Modal dialog on Base UI primitive — accessible, dismissible by ESC + backdrop.',
    source: 'src/components/ui/dialog.tsx',
    status: 'stable',
    category: 'compound',
    island: 'ShowcaseDialog',
  },
  {
    slug: 'dropdown-menu',
    name: 'Dropdown menu',
    summary: 'Anchored menu on Base UI Menu primitive with align/side props.',
    source: 'src/components/ui/dropdown-menu.tsx',
    status: 'stable',
    category: 'compound',
    island: 'ShowcaseDropdown',
  },
  {
    slug: 'tabs',
    name: 'Tabs',
    summary: 'Tabbed panels on Base UI Tabs primitive.',
    source: 'src/components/ui/tabs.tsx',
    status: 'stable',
    category: 'compound',
    island: 'ShowcaseTabs',
  },
  {
    slug: 'toast',
    name: 'Toast',
    summary: 'Transient notification using Base UI Toast primitive + createToastManager.',
    source: 'src/components/ui/toast.tsx',
    status: 'stable',
    category: 'compound',
    island: 'ShowcaseToast',
  },
  {
    slug: 'form',
    name: 'Form',
    summary:
      'Compound form on Base UI Field + react-hook-form + Zod. Single island because compound state.',
    source: 'src/components/ui/form.tsx',
    status: 'stable',
    category: 'compound',
    island: 'ShowcaseForm',
  },
  // Navigation & menus — combobox/command/nav-menu/menubar/stepper
  {
    slug: 'navigation',
    name: 'Navigation & menus',
    summary: 'Combobox, Command palette (⌘K), Navigation menu, Menubar, Stepper.',
    source: 'src/components/ui/',
    status: 'stable',
    category: 'navmenu',
    island: 'ShowcaseNav',
  },
  // Overlays — anchored/portal popups on Base UI
  {
    slug: 'overlays',
    name: 'Overlays',
    summary:
      'Tooltip, Popover, Alert dialog, Hover card, Context menu — all on Base UI portals.',
    source: 'src/components/ui/',
    status: 'stable',
    category: 'overlays',
    install: 'npx shadcn@latest add tooltip popover alert-dialog hover-card context-menu --yes',
    island: 'ShowcaseOverlays',
  },
  // Disclosure & layout — accordion/collapsible/avatar/skeleton/scroll/ratio
  {
    slug: 'disclosure',
    name: 'Disclosure & layout',
    summary:
      'Accordion, Collapsible, Avatar, Skeleton, Separator, Scroll area, Aspect ratio.',
    source: 'src/components/ui/',
    status: 'stable',
    category: 'disclosure',
    install:
      'npx shadcn@latest add accordion collapsible avatar skeleton separator scroll-area aspect-ratio --yes',
    island: 'ShowcaseDisclosure',
  },
  // Navigation & feedback — breadcrumb/pagination/alert/spinner/meter/empty/error…
  {
    slug: 'feedback',
    name: 'Navigation & feedback',
    summary:
      'Breadcrumb, Pagination, Alert, Spinner, Meter, Kbd, Description list, Empty state, Error state.',
    source: 'src/components/ui/',
    status: 'stable',
    category: 'feedback',
    island: 'ShowcaseFeedback',
  },
  // Data — TanStack Table / Virtual
  {
    slug: 'data-table',
    name: 'DataTable',
    summary:
      'Generic <DataTable> on TanStack Table + Virtual. Sort, filter, column visibility, resizing, virtualization, URL state sync.',
    source: 'src/components/ui/data-table.tsx',
    status: 'stable',
    category: 'data',
    island: 'ShowcaseDataTable',
  },
  // Charts — Recharts + KPIs
  {
    slug: 'kpis',
    name: 'KPI primitives',
    summary:
      'Tremor-Raw-style: KpiCard, Metric, ProgressBar, Tracker, Callout, Divider. CSS-var-themed, dark-mode-flip.',
    source: 'src/components/ui/',
    status: 'stable',
    category: 'charts',
    island: 'ShowcaseKpis',
  },
  {
    slug: 'charts',
    name: 'Charts',
    summary:
      'Themed Recharts wrappers (Line, Bar, Area, Donut). Colors come from --chart-1..5 CSS vars.',
    source: 'src/components/ui/charts/',
    status: 'stable',
    category: 'charts',
    island: 'ShowcaseCharts',
  },
  // Motion
  {
    slug: 'motion',
    name: 'Motion (lazy)',
    summary:
      'LazyMotion + domAnimation pattern with strict mode. Motion code is in a separate lazy chunk.',
    source: 'src/components/islands/MotionDemo.tsx',
    status: 'stable',
    category: 'motion',
    island: 'MotionDemo',
  },
  // PWA
  {
    slug: 'pwa',
    name: 'PWA prompts',
    summary:
      'InstallButton + UpdateToast — driven by virtual:pwa-register events through Nano Stores.',
    source: 'src/components/islands/',
    status: 'stable',
    category: 'pwa',
    island: 'ShowcasePWA',
  },
  // Extras & data-viz — tree/timeline/bar-list/sparkline/gauge
  {
    slug: 'extras',
    name: 'Extras & data-viz',
    summary: 'Tree view, Timeline, Bar list, Sparkline, Gauge.',
    source: 'src/components/ui/',
    status: 'stable',
    category: 'extras',
    island: 'ShowcaseExtras',
  },
  // Generative AI — agent-native UI primitives (#204)
  {
    slug: 'gen-ai',
    name: 'Generative AI',
    summary:
      'Chat thread, prompt input, streaming + thinking states, AI output label (disclosure), and response feedback.',
    source: 'src/components/ui/ai/',
    status: 'stable',
    category: 'gen-ai',
    island: 'ShowcaseAI',
  },
  // Inceptor
  {
    slug: 'error-boundary',
    name: 'ErrorBoundary',
    summary:
      'Throw an error inside an island — get a pre-filled GitHub issue with stack trace, component path, URL, and UA.',
    source: 'src/components/islands/ErrorBoundary.tsx',
    status: 'stable',
    category: 'inceptor',
    island: 'ShowcaseErrorBoundary',
  },
];

export function getByCategory(category: GalleryEntry['category']): GalleryEntry[] {
  return galleryManifest.filter((e) => e.category === category);
}

export const categoryLabels: Record<GalleryEntry['category'], string> = {
  primitives: 'Primitives',
  forms: 'Form controls',
  advanced: 'Advanced inputs',
  navmenu: 'Navigation & menus',
  compound: 'Compound components',
  overlays: 'Overlays',
  disclosure: 'Disclosure & layout',
  feedback: 'Feedback & status',
  data: 'Data',
  charts: 'KPIs & charts',
  motion: 'Motion',
  pwa: 'PWA',
  extras: 'Extras & data-viz',
  'gen-ai': 'Generative AI',
  inceptor: 'Inceptor reporting',
};

export const categoryOrder: GalleryEntry['category'][] = [
  'primitives',
  'forms',
  'advanced',
  'navmenu',
  'compound',
  'overlays',
  'disclosure',
  'feedback',
  'data',
  'charts',
  'motion',
  'pwa',
  'extras',
  'inceptor',
];
