import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import islandSrc from './GlobalSearch.tsx?raw';

// Source-level guards for the GlobalSearch island (#143 — global ⌘K search).
// These tests assert structural properties of the implementation so regressions
// are caught before a deploy. They run in Node (no DOM needed) by reading the
// source text as a Vite raw import (fast, no browser required).

const readRoot = (p: string) =>
  readFileSync(new URL(`../../../${p}`, import.meta.url), 'utf-8');

const headerSrc = readRoot('src/components/common/SiteHeader.astro');

describe('GlobalSearch island — source guards', () => {
  // ── 1. File existence & basic structure ──────────────────────────────────
  it('exists and is non-empty', () => {
    expect(islandSrc.length).toBeGreaterThan(0);
  });

  it('exports a default component', () => {
    expect(islandSrc).toMatch(/export default function GlobalSearch/);
  });

  // ── 2. CommandPalette composition ────────────────────────────────────────
  it('imports CommandPalette from @/components/ui/command-palette', () => {
    expect(islandSrc).toMatch(/from ['"]@\/components\/ui\/command-palette['"]/);
    expect(islandSrc).toContain('CommandPalette');
  });

  it('renders CommandPalette in JSX', () => {
    expect(islandSrc).toMatch(/<CommandPalette/);
  });

  // ── 3. BASE_URL-aware Pagefind import pattern ────────────────────────────
  // The same pattern used in DocsSearch.astro: build the URL at runtime using
  // BASE_URL and a Function constructor to bypass Vite static analysis.
  it('uses BASE_URL to build the Pagefind URL', () => {
    expect(islandSrc).toContain('BASE_URL');
    expect(islandSrc).toContain('_pagefind');
    expect(islandSrc).toContain('pagefind.js');
  });

  it('uses a Function constructor to bypass Vite static analysis for the Pagefind import', () => {
    // The pattern: new Function('u', 'return import(u)') avoids bundler interception.
    expect(islandSrc).toMatch(/new Function\(/);
  });

  // ── 4. Static nav commands ───────────────────────────────────────────────
  it('defines 5 static nav commands (Home, Gallery, Demos, Docs, Blog)', () => {
    expect(islandSrc).toContain("label: 'Home'");
    expect(islandSrc).toContain("label: 'Gallery'");
    expect(islandSrc).toContain("label: 'Demos'");
    expect(islandSrc).toContain("label: 'Docs'");
    expect(islandSrc).toContain("label: 'Blog'");
  });

  // ── 5. ⌘K conflict avoidance with DocsSearch ────────────────────────────
  // GlobalSearch must not intercept ⌘K when docs-search-input is present.
  it('yields ⌘K to DocsSearch when docs-search-input element exists on the page', () => {
    expect(islandSrc).toContain('docs-search-input');
    expect(islandSrc).toMatch(/getElementById\(['"]docs-search-input['"]\)/);
  });

  // ── 6. Graceful degradation in dev ──────────────────────────────────────
  it('has a catch block that sets a degradation note when Pagefind is unavailable', () => {
    expect(islandSrc).toMatch(/catch/);
    expect(islandSrc).toContain('production builds');
  });

  // ── 7. shortcut disabled to avoid double-registration ───────────────────
  it('passes shortcut={false} to CommandPalette to avoid double ⌘K binding', () => {
    expect(islandSrc).toMatch(/shortcut=\{false\}/);
  });

  // ── 8. ErrorBoundary wrapping ────────────────────────────────────────────
  it('wraps the inner component in ErrorBoundary', () => {
    expect(islandSrc).toMatch(/from ['"]\.\/ErrorBoundary['"]/);
    expect(islandSrc).toMatch(/<ErrorBoundary/);
  });

  // ── 9. Forbidden imports ─────────────────────────────────────────────────
  it('does not import from framer-motion', () => {
    expect(islandSrc).not.toMatch(/from ['"]framer-motion['"]/);
  });

  it('does not import from @radix-ui', () => {
    expect(islandSrc).not.toMatch(/from ['"]@radix-ui\//);
  });
});

describe('SiteHeader — GlobalSearch integration guards', () => {
  it('imports GlobalSearch from @/components/islands/GlobalSearch', () => {
    expect(headerSrc).toMatch(/from ['"]@\/components\/islands\/GlobalSearch['"]/);
  });

  it('mounts GlobalSearch with client:idle', () => {
    // client:idle ensures the island does not block first paint
    expect(headerSrc).toMatch(/<GlobalSearch\s+client:idle\s*\/>/);
  });
});
