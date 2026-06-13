/**
 * AppLayoutIsland — reusable service-shell pattern for Inceptor.
 *
 * Provides:
 *   - Left navigation area (SideNav)
 *   - Top utilities area (TopBar)
 *   - Main content region with responsive breakpoints
 *   - Optional split panel / drawer for contextual details
 *
 * Astro island constraints:
 *   - All event listeners and ResizeObservers are cleaned up on unmount.
 *   - No createContext for cross-island state — Nano Stores only.
 *   - No @radix-ui, no framer-motion.
 *
 * Usage:
 *   <AppLayoutIsland client:load
 *     navItems={[{ id: 'home', label: 'Home', icon: <HomeIcon /> }]}
 *     topActions={<Button>Action</Button>}
 *     splitPanelContent={<Details />}
 *   >
 *     <main content here />
 *   </AppLayoutIsland>
 */

import * as React from 'react';
import { cn } from '@/lib/utils';
import ErrorBoundary from './ErrorBoundary';

// ── Types ────────────────────────────────────────────────────────────────────

export interface NavItem {
  id: string;
  label: string;
  /** Optional lucide-react icon element. */
  icon?: React.ReactNode;
  href?: string;
  /** Defaults to false. */
  active?: boolean;
}

export interface AppLayoutProps {
  /** Navigation items rendered in the left sidebar. */
  navItems?: NavItem[];
  /** Content rendered in the top-right utilities strip. */
  topActions?: React.ReactNode;
  /** Main page content. */
  children?: React.ReactNode;
  /** When provided, the split panel region is available and can be toggled. */
  splitPanelContent?: React.ReactNode;
  /** Initially open state for the split panel. Defaults to false. */
  defaultSplitOpen?: boolean;
  /** Logo / branding node shown in the top-left. */
  logo?: React.ReactNode;
  /** aria-label for the nav landmark. Defaults to "Main navigation". */
  navLabel?: string;
  /** Called when a nav item is clicked. */
  onNavSelect?: (id: string) => void;
}

// ── Subcomponents ────────────────────────────────────────────────────────────

function NavItemButton({
  item,
  onSelect,
}: {
  item: NavItem;
  onSelect?: (id: string) => void;
}) {
  const Tag = item.href ? 'a' : 'button';

  return (
    <Tag
      {...(item.href
        ? { href: item.href }
        : {
            type: 'button' as const,
            onClick: () => onSelect?.(item.id),
          })}
      aria-current={item.active ? 'page' : undefined}
      className={cn(
        'flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        item.active
          ? 'bg-accent text-accent-foreground'
          : 'text-sidebar-foreground hover:bg-accent hover:text-accent-foreground',
      )}
    >
      {item.icon && (
        <span className="size-4 shrink-0" aria-hidden="true">
          {item.icon}
        </span>
      )}
      <span className="truncate">{item.label}</span>
    </Tag>
  );
}

function SideNav({
  items,
  label,
  onSelect,
  className,
}: {
  items: NavItem[];
  label: string;
  onSelect?: (id: string) => void;
  className?: string;
}) {
  return (
    <nav
      aria-label={label}
      className={cn(
        'flex flex-col gap-1 p-3 bg-sidebar border-r border-sidebar-border',
        className,
      )}
    >
      <ul className="flex flex-col gap-0.5">
        {items.map((item) => (
          <li key={item.id}>
            <NavItemButton item={item} onSelect={onSelect} />
          </li>
        ))}
      </ul>
    </nav>
  );
}

function TopBar({
  logo,
  actions,
  onMenuToggle,
  isMobileNavOpen,
  hasSplitPanel,
  isSplitOpen,
  onSplitToggle,
  hamburgerRef,
}: {
  logo?: React.ReactNode;
  actions?: React.ReactNode;
  onMenuToggle: () => void;
  isMobileNavOpen: boolean;
  hasSplitPanel: boolean;
  isSplitOpen: boolean;
  onSplitToggle: () => void;
  hamburgerRef?: React.RefObject<HTMLButtonElement | null>;
}) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-sidebar-border bg-sidebar px-4">
      {/* Mobile hamburger + logo */}
      <div className="flex items-center gap-3">
        <button
          ref={hamburgerRef}
          type="button"
          aria-label={isMobileNavOpen ? 'Close navigation' : 'Open navigation'}
          aria-expanded={isMobileNavOpen}
          aria-controls="mobile-sidenav"
          onClick={onMenuToggle}
          className={cn(
            'flex size-8 items-center justify-center rounded-md md:hidden',
            'text-sidebar-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          )}
        >
          {/* Hamburger icon (CSS-only, no lucide dependency) */}
          <span className="flex flex-col gap-1" aria-hidden="true">
            <span className="block h-0.5 w-5 rounded-full bg-current" />
            <span className="block h-0.5 w-5 rounded-full bg-current" />
            <span className="block h-0.5 w-5 rounded-full bg-current" />
          </span>
        </button>
        {logo ?? (
          <span className="text-sm font-semibold text-sidebar-foreground">
            Inceptor
          </span>
        )}
      </div>

      {/* Actions strip */}
      <div className="flex items-center gap-2">
        {actions}
        {hasSplitPanel && (
          <button
            type="button"
            aria-label={isSplitOpen ? 'Close details panel' : 'Open details panel'}
            aria-expanded={isSplitOpen}
            aria-controls="split-panel"
            onClick={onSplitToggle}
            className={cn(
              'flex size-8 items-center justify-center rounded-md text-xs font-medium',
              'text-sidebar-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              isSplitOpen && 'bg-accent text-accent-foreground',
            )}
          >
            {/* Simple panel icon */}
            <span aria-hidden="true" className="flex gap-0.5">
              <span className="block h-4 w-2.5 rounded-sm border-2 border-current" />
              <span className="block h-4 w-1.5 rounded-sm border-2 border-current opacity-60" />
            </span>
          </button>
        )}
      </div>
    </header>
  );
}

// ── Main export ──────────────────────────────────────────────────────────────

export default function AppLayoutIsland(props: AppLayoutProps) {
  return (
    <ErrorBoundary name="AppLayoutIsland">
      <AppLayoutInner {...props} />
    </ErrorBoundary>
  );
}

function AppLayoutInner({
  navItems = [],
  topActions,
  children,
  splitPanelContent,
  defaultSplitOpen = false,
  logo,
  navLabel = 'Main navigation',
  onNavSelect,
}: AppLayoutProps) {
  const [isMobileNavOpen, setIsMobileNavOpen] = React.useState(false);
  const [isSplitOpen, setIsSplitOpen] = React.useState(defaultSplitOpen);
  const hasSplitPanel = splitPanelContent !== undefined;

  // Refs for focus management
  const drawerRef = React.useRef<HTMLDivElement>(null);
  const hamburgerRef = React.useRef<HTMLButtonElement>(null);

  // Track viewport width to auto-close mobile nav on resize to >= md (768px).
  React.useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');

    function handleChange(e: MediaQueryListEvent) {
      if (e.matches) {
        setIsMobileNavOpen(false);
      }
    }

    mq.addEventListener('change', handleChange);
    return () => {
      mq.removeEventListener('change', handleChange);
    };
  }, []);

  // When mobile nav opens, move focus into the drawer.
  React.useEffect(() => {
    if (isMobileNavOpen && drawerRef.current) {
      const focusable = drawerRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      focusable[0]?.focus();
    } else if (!isMobileNavOpen && hamburgerRef.current) {
      // Return focus to hamburger when drawer closes.
      hamburgerRef.current.focus();
    }
  }, [isMobileNavOpen]);

  // Close mobile nav on Escape; implement focus trap while drawer is open.
  React.useEffect(() => {
    if (!isMobileNavOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setIsMobileNavOpen(false);
        return;
      }
      // Focus trap inside drawer
      if (e.key === 'Tab' && drawerRef.current) {
        const focusable = Array.from(
          drawerRef.current.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
        );
        if (focusable.length === 0) return;
        const first = focusable[0]!;
        const last = focusable[focusable.length - 1]!;
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMobileNavOpen]);

  return (
    /* Shell occupies full viewport height; parent is responsible for mounting
       this island inside a full-height container. */
    <div
      className="flex h-full min-h-0 overflow-hidden"
      data-testid="app-layout-shell"
    >
      {/* ── Desktop SideNav ─────────────────────────────────────── */}
      <SideNav
        items={navItems}
        label={navLabel}
        onSelect={onNavSelect}
        className="hidden w-64 shrink-0 md:flex"
      />

      {/* ── Mobile SideNav overlay ──────────────────────────────── */}
      {isMobileNavOpen && (
        <>
          {/* Backdrop */}
          <div
            aria-hidden="true"
            className="fixed inset-0 z-40 bg-black/40 md:hidden"
            onClick={() => setIsMobileNavOpen(false)}
          />
          {/* Drawer */}
          <div
            ref={drawerRef}
            id="mobile-sidenav"
            role="dialog"
            aria-modal="true"
            aria-label={navLabel}
            className="fixed inset-y-0 left-0 z-50 w-64 shadow-xl md:hidden"
          >
            <SideNav
              items={navItems}
              label={navLabel}
              onSelect={(id) => {
                setIsMobileNavOpen(false);
                onNavSelect?.(id);
              }}
              className="h-full w-full"
            />
          </div>
        </>
      )}

      {/* ── Right side: TopBar + content ────────────────────────── */}
      <div className="flex flex-1 flex-col min-w-0">
        <TopBar
          logo={logo}
          actions={topActions}
          onMenuToggle={() => setIsMobileNavOpen((v) => !v)}
          isMobileNavOpen={isMobileNavOpen}
          hasSplitPanel={hasSplitPanel}
          isSplitOpen={isSplitOpen}
          onSplitToggle={() => setIsSplitOpen((v) => !v)}
          hamburgerRef={hamburgerRef}
        />

        {/* ── Content + optional split panel ────────────────────── */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Main region */}
          <main
            id="main-content"
            tabIndex={-1}
            className="flex-1 min-w-0 overflow-y-auto p-6 focus-visible:outline-none"
          >
            {children}
          </main>

          {/* Split panel */}
          {hasSplitPanel && isSplitOpen && (
            <aside
              id="split-panel"
              aria-label="Details panel"
              className={cn(
                'w-full border-t border-border bg-card overflow-y-auto',
                // On lg+ screens: side-by-side split
                'lg:w-96 lg:border-t-0 lg:border-l',
              )}
            >
              {splitPanelContent}
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
