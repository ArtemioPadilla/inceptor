import * as React from 'react';
import type {
  SortingState,
  VisibilityState,
  ColumnSizingState,
} from '@tanstack/react-table';

export interface DataTableUrlState {
  globalFilter: string;
  sorting: SortingState;
  columnVisibility: VisibilityState;
  columnSizing: ColumnSizingState;
}

const empty: DataTableUrlState = {
  globalFilter: '',
  sorting: [],
  columnVisibility: {},
  columnSizing: {},
};

function prefix(key: string | undefined, name: string): string {
  return key ? `${key}.${name}` : name;
}

export function serializeToUrlParams(
  state: Partial<DataTableUrlState>,
  key: string | undefined,
): URLSearchParams {
  const params = new URLSearchParams();

  if (state.globalFilter) {
    params.set(prefix(key, 'q'), state.globalFilter);
  }

  if (state.sorting && state.sorting.length > 0) {
    params.set(
      prefix(key, 'sort'),
      state.sorting.map((s) => `${s.id}:${s.desc ? 'desc' : 'asc'}`).join(','),
    );
  }

  if (state.columnVisibility) {
    const hidden = Object.entries(state.columnVisibility)
      .filter(([, visible]) => visible === false)
      .map(([id]) => id);
    if (hidden.length > 0) {
      params.set(prefix(key, 'hide'), hidden.join(','));
    }
  }

  if (state.columnSizing && Object.keys(state.columnSizing).length > 0) {
    params.set(
      prefix(key, 'w'),
      Object.entries(state.columnSizing)
        .map(([id, size]) => `${id}:${size}`)
        .join(','),
    );
  }

  return params;
}

export function parseFromUrlParams(
  params: URLSearchParams,
  key: string | undefined,
): DataTableUrlState {
  const q = params.get(prefix(key, 'q')) ?? '';

  const sortRaw = params.get(prefix(key, 'sort'));
  const sorting: SortingState = sortRaw
    ? sortRaw
        .split(',')
        .filter(Boolean)
        .map((token) => {
          const [id, dir] = token.split(':');
          return { id, desc: dir === 'desc' };
        })
    : [];

  const hideRaw = params.get(prefix(key, 'hide'));
  const columnVisibility: VisibilityState = hideRaw
    ? Object.fromEntries(
        hideRaw.split(',').filter(Boolean).map((id) => [id, false]),
      )
    : {};

  const widthRaw = params.get(prefix(key, 'w'));
  const columnSizing: ColumnSizingState = widthRaw
    ? Object.fromEntries(
        widthRaw
          .split(',')
          .filter(Boolean)
          .map((token) => {
            const [id, sizeStr] = token.split(':');
            const size = Number(sizeStr);
            return [id, Number.isFinite(size) ? size : 0];
          })
          .filter(([, size]) => (size as number) > 0),
      )
    : {};

  return { globalFilter: q, sorting, columnVisibility, columnSizing };
}

/**
 * Reads DataTable state from URLSearchParams on mount, writes back on changes
 * (debounced 150ms via replaceState — no full reload, no pushState spam), and
 * listens to popstate so back/forward navigation restores prior state.
 *
 * Returns a tuple of [currentState, writeState]. The caller seeds
 * useReactTable with currentState on first render, then calls writeState
 * whenever a piece of state changes.
 */
export function useDataTableUrlState(
  enabled: boolean,
  key: string | undefined,
): [DataTableUrlState, (next: Partial<DataTableUrlState>) => void] {
  // Parse initial state from the URL synchronously so the table hydrates with
  // the correct values on first render, avoiding a visible filter/sort reset.
  const initial = React.useMemo(() => {
    if (!enabled || typeof window === 'undefined') return empty;
    return parseFromUrlParams(new URLSearchParams(window.location.search), key);
    // key intentionally excluded — we only want this on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  const [state, setState] = React.useState<DataTableUrlState>(initial);

  // Keep a ref so the debounced write closure always has the latest merged state
  // without needing to be re-created on every state update.
  const stateRef = React.useRef(state);
  stateRef.current = state;

  // Restore state on popstate (browser back/forward navigation).
  React.useEffect(() => {
    if (!enabled) return;
    const onPop = () => {
      const next = parseFromUrlParams(
        new URLSearchParams(window.location.search),
        key,
      );
      setState(next);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [enabled, key]);

  // ReturnType<typeof setTimeout> satisfies both the browser (number) and Node
  // (NodeJS.Timeout) overloads. Using the global setTimeout (no window. prefix)
  // lets TypeScript pick the correct overload for whichever @types are in scope,
  // which matters now that @types/node is installed.
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const write = React.useCallback(
    (next: Partial<DataTableUrlState>) => {
      setState((prev) => {
        const merged = { ...prev, ...next };
        stateRef.current = merged;
        return merged;
      });

      if (!enabled) return;

      // Debounce: avoid flooding history on rapid keystrokes in the filter input.
      if (timer.current !== null) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        const params = serializeToUrlParams(stateRef.current, key);
        const qs = params.toString();
        const url = window.location.pathname + (qs ? '?' + qs : '');
        // replaceState keeps the back button sane — one entry per "resting" state,
        // not one entry per keystroke.
        window.history.replaceState({}, '', url);
      }, 150);
    },
    [enabled, key],
  );

  return [state, write];
}
