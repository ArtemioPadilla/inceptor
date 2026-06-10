/**
 * Coverage enumeration test — reports which gallery entries yield Props tables.
 * This is a smoke test, not a contract test; it just ensures the extractor runs
 * without throwing for every gallery entry.
 */

import * as path from 'node:path';
import { describe, expect, it } from 'vitest';
import { galleryManifest } from '../content/gallery';
import { extractPropsForSource } from '../lib/component-docs';

const REPO_ROOT = path.resolve(__dirname, '../../');

describe('component-docs coverage — all gallery entries', () => {
  it('extractPropsForSource never throws for any gallery entry', () => {
    for (const entry of galleryManifest) {
      const tables = extractPropsForSource(entry.source, REPO_ROOT);
      // Must return an array (never throw)
      expect(Array.isArray(tables), `${entry.slug} should return an array`).toBe(true);
    }
  });

  it('at least 3 gallery entries yield at least one Props table', () => {
    // Ensures the extractor is actually working, not silently returning [] everywhere.
    const entriesWithTables = galleryManifest.filter((entry) => {
      const tables = extractPropsForSource(entry.source, REPO_ROOT);
      return tables.length > 0;
    });
    // data-table, form, dialog, and others have explicit Props interfaces
    expect(entriesWithTables.length).toBeGreaterThanOrEqual(3);
  });

  it('data-table entry yields a DataTableProps table', () => {
    const entry = galleryManifest.find((e) => e.slug === 'data-table')!;
    expect(entry).toBeDefined();
    const tables = extractPropsForSource(entry.source, REPO_ROOT);
    const dt = tables.find((t) => t.interfaceName === 'DataTableProps');
    expect(dt).toBeDefined();
    expect(dt!.props.length).toBeGreaterThan(3);
  });
});
