import * as React from 'react';
import { CommandPalette } from '@/components/ui/command-palette';
import type { CommandItem } from '@/components/ui/command-palette';
import ErrorBoundary from './ErrorBoundary';

// ─── Pagefind type shim ──────────────────────────────────────────────────────
// Pagefind is a postbuild artifact loaded at runtime via a dynamic import that
// bypasses Vite's static analysis (same Function-constructor pattern as
// DocsSearch.astro). We type it loosely here because the module shape is only
// guaranteed at runtime.
interface PagefindResult {
  data: () => Promise<{
    url: string;
    excerpt: string;
    meta?: { title?: string };
  }>;
}

interface PagefindModule {
  init?: () => Promise<void>;
  search: (query: string) => Promise<{ results: PagefindResult[] } | null>;
}

// ─── Static nav commands (always visible, filtered by query) ─────────────────
const NAV_COMMANDS: CommandItem[] = [
  {
    label: 'Home',
    hint: 'Go to home',
    onSelect: () => { window.location.href = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '') + '/'; },
  },
  {
    label: 'Gallery',
    hint: 'Browse UI components',
    onSelect: () => { window.location.href = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '') + '/gallery/'; },
  },
  {
    label: 'Demos',
    hint: 'Interactive demos',
    onSelect: () => { window.location.href = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '') + '/demos/'; },
  },
  {
    label: 'Docs',
    hint: 'Documentation',
    onSelect: () => { window.location.href = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '') + '/docs/'; },
  },
  {
    label: 'Blog',
    hint: 'News & updates',
    onSelect: () => { window.location.href = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '') + '/blog/'; },
  },
];

// ─── Inner implementation ─────────────────────────────────────────────────────

function GlobalSearchInner() {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [pagefindItems, setPagefindItems] = React.useState<CommandItem[]>([]);
  const [pagefindNote, setPagefindNote] = React.useState<string | null>(null);

  // Pagefind module is loaded lazily on first open to avoid blocking initial
  // page load. We use the same BASE_URL-aware dynamic import pattern from
  // DocsSearch.astro: a Function constructor to bypass Vite's static analysis
  // so the bundler never sees the literal /_pagefind/pagefind.js string.
  const pagefindRef = React.useRef<PagefindModule | null>(null);
  const loadAttemptedRef = React.useRef(false);

  async function ensurePagefind(): Promise<PagefindModule | null> {
    if (pagefindRef.current) return pagefindRef.current;
    if (loadAttemptedRef.current) return null;
    loadAttemptedRef.current = true;

    try {
      const base = import.meta.env.BASE_URL.replace(/\/$/, '');
      const url = [base, '/_pagefind', '/pagefind.js'].join('');
      // new Function() bypasses Vite's static import analysis — intentional so
      // the bundler never sees the literal /_pagefind/pagefind.js path.
      const dyn = new Function('u', 'return import(u)');
      const mod = (await dyn(url)) as PagefindModule;
      await mod.init?.();
      pagefindRef.current = mod;
      return mod;
    } catch {
      // In dev the Pagefind bundle doesn't exist yet — graceful degradation.
      setPagefindNote('Full-text search is available in production builds.');
      return null;
    }
  }

  // Open on ⌘K / Ctrl+K, but only when DocsSearch is NOT on the page.
  // DocsSearch binds ⌘K to focus its sidebar input; yielding to it avoids
  // a confusing double-intercept on /docs/ pages.
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== 'k') return;
      // If the docs sidebar search input exists, let DocsSearch handle it.
      if (document.getElementById('docs-search-input')) return;
      e.preventDefault();
      setOpen((o) => !o);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  // Lazily pre-load Pagefind when the dialog opens for the first time, then
  // run search whenever the query changes.
  React.useEffect(() => {
    if (!open) return;

    let cancelled = false;

    async function run() {
      const pf = await ensurePagefind();
      if (!pf || cancelled) return;

      if (!query || query.length < 2) {
        if (!cancelled) setPagefindItems([]);
        return;
      }

      const result = await pf.search(query);
      if (cancelled) return;

      if (!result || result.results.length === 0) {
        setPagefindItems([]);
        return;
      }

      const top = result.results.slice(0, 8);
      const resolved = await Promise.all(
        top.map(async (r) => {
          const data = await r.data();
          const item: CommandItem = {
            label: data.meta?.title ?? data.url,
            hint: data.excerpt.replace(/<[^>]*>/g, '').slice(0, 60),
            onSelect: () => { window.location.href = data.url; },
          };
          return item;
        }),
      );

      if (!cancelled) setPagefindItems(resolved);
    }

    void run();

    return () => { cancelled = true; };
  }, [open, query]);

  // Build the combined item list: filtered nav commands + pagefind results.
  // Nav commands are filtered inline by the CommandPalette via its own query
  // state — but we also need to pass pagefind results in. To avoid fighting the
  // CommandPalette's internal filter we merge both lists and pass the full set;
  // CommandPalette will filter all of them by label.
  //
  // Pagefind results are prefixed with a section separator label so they're
  // visually distinct.
  const allItems = React.useMemo<CommandItem[]>(() => {
    const base: CommandItem[] = [...NAV_COMMANDS];

    if (pagefindNote) {
      base.push({ label: pagefindNote });
    }

    if (pagefindItems.length > 0) {
      base.push(...pagefindItems);
    }

    return base;
  }, [pagefindItems, pagefindNote]);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      // Reset pagefind results when closing so next open is clean.
      setQuery('');
      setPagefindItems([]);
    }
  }

  return (
    <>
      {/* Trigger button rendered in the header via a portal isn't possible from
          an island; instead the header imports this island and renders it as a
          button via the `triggerRef` pattern. GlobalSearch manages its own open
          state and exposes a trigger button for the header to use. */}
      <button
        type="button"
        id="global-search-trigger"
        aria-label="Open global search (⌘K)"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:text-primary font-mono"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <span className="hidden sm:inline">Search</span>
        <kbd className="hidden sm:inline-flex h-4 select-none items-center gap-0.5 rounded border border-border bg-muted px-1 text-[0.6rem] font-mono text-muted-foreground">
          ⌘K
        </kbd>
      </button>

      {/* The whole dialog composition lives in this one island — compound-
          component rule: all Base UI Dialog parts must share a single React
          root. CommandPalette handles the dialog internally. */}
      <CommandPalette
        items={allItems}
        placeholder="Search pages or type a command…"
        // We manage open state here so we can control the ⌘K binding and also
        // reset pagefind results on close. Disable the built-in ⌘K inside
        // CommandPalette to avoid double-registration.
        shortcut={false}
        open={open}
        onOpenChange={handleOpenChange}
      />
    </>
  );
}

/**
 * GlobalSearch island — site-wide ⌘K search palette.
 *
 * Searches the entire Pagefind index (all pages: docs, gallery, demos, blog)
 * plus 5 static nav commands. Mounted in BaseLayout with `client:idle` so
 * every page gets it without blocking first paint.
 *
 * Conflict avoidance: on /docs/ pages, DocsSearch.astro registers its own ⌘K
 * listener to focus the sidebar input. GlobalSearch yields to it by checking
 * for the `docs-search-input` element before intercepting the keystroke.
 */
export default function GlobalSearch() {
  return (
    <ErrorBoundary name="GlobalSearch">
      <GlobalSearchInner />
    </ErrorBoundary>
  );
}
