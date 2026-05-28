import { describe, expect, it } from 'vitest';
import { serializeToUrlParams, parseFromUrlParams } from './use-data-table-url-state';

describe('serializeToUrlParams', () => {
  it('round-trips a typical state', () => {
    const state = {
      globalFilter: 'foo',
      sorting: [{ id: 'name', desc: true }],
      columnVisibility: { email: false },
      columnSizing: { name: 180 },
    };
    const params = serializeToUrlParams(state, undefined);
    const parsed = parseFromUrlParams(params, undefined);
    expect(parsed).toEqual({
      globalFilter: 'foo',
      sorting: [{ id: 'name', desc: true }],
      columnVisibility: { email: false },
      columnSizing: { name: 180 },
    });
  });

  it('omits empty fields', () => {
    const params = serializeToUrlParams(
      { globalFilter: '', sorting: [], columnVisibility: {}, columnSizing: {} },
      undefined,
    );
    expect(params.toString()).toBe('');
  });

  it('namespaces by key prefix', () => {
    const params = serializeToUrlParams({ globalFilter: 'x' }, 'orders');
    expect(params.get('orders.q')).toBe('x');
    expect(params.get('q')).toBeNull();
  });

  it('parses ascending and descending sort tokens', () => {
    const parsed = parseFromUrlParams(
      new URLSearchParams('sort=name:asc,score:desc'),
      undefined,
    );
    expect(parsed.sorting).toEqual([
      { id: 'name', desc: false },
      { id: 'score', desc: true },
    ]);
  });

  it('ignores malformed width tokens', () => {
    const parsed = parseFromUrlParams(
      new URLSearchParams('w=name:not-a-number,score:abc'),
      undefined,
    );
    expect(parsed.columnSizing).toEqual({});
  });

  it('round-trips multiple sort columns', () => {
    const state = {
      sorting: [
        { id: 'name', desc: false },
        { id: 'score', desc: true },
        { id: 'role', desc: false },
      ],
    };
    const params = serializeToUrlParams(state, undefined);
    const parsed = parseFromUrlParams(params, undefined);
    expect(parsed.sorting).toEqual(state.sorting);
  });

  it('round-trips multiple hidden columns', () => {
    const state = {
      columnVisibility: { email: false, role: false },
    };
    const params = serializeToUrlParams(state, undefined);
    const parsed = parseFromUrlParams(params, undefined);
    expect(parsed.columnVisibility).toEqual({ email: false, role: false });
  });

  it('namespaces sort and hide params with key prefix', () => {
    const state = {
      globalFilter: 'bar',
      sorting: [{ id: 'name', desc: false }],
      columnVisibility: { email: false },
      columnSizing: { name: 200 },
    };
    const params = serializeToUrlParams(state, 'tbl');
    expect(params.get('tbl.q')).toBe('bar');
    expect(params.get('tbl.sort')).toBe('name:asc');
    expect(params.get('tbl.hide')).toBe('email');
    expect(params.get('tbl.w')).toBe('name:200');
    // Non-prefixed keys must not be present
    expect(params.get('q')).toBeNull();
    expect(params.get('sort')).toBeNull();
  });

  it('returns empty result when params are all absent', () => {
    const parsed = parseFromUrlParams(new URLSearchParams(''), undefined);
    expect(parsed).toEqual({
      globalFilter: '',
      sorting: [],
      columnVisibility: {},
      columnSizing: {},
    });
  });
});
