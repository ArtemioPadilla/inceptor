import * as React from 'react';
import { ActionBar } from '@/components/ui/action-bar';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import ErrorBoundary from './ErrorBoundary';

// ActionBar is data-source agnostic — it only needs `selectedCount` +
// `onClearSelection`, the same shape a DataTable's row-selection state
// reduces to. This island demos it over a plain selectable list rather than
// the full DataTable to keep the two primitives decoupled (ActionBar is
// standalone; DataTable *can* use it, but doesn't own it).
const ITEMS = ['Invoice #1042', 'Invoice #1043', 'Invoice #1044', 'Invoice #1045'];

export default function ShowcaseActionBar() {
  const [selected, setSelected] = React.useState<Set<string>>(new Set());

  function toggle(item: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(item)) next.delete(item);
      else next.add(item);
      return next;
    });
  }

  return (
    <ErrorBoundary name="ShowcaseActionBar">
      <div className="space-y-3 pb-16">
        <p className="text-sm text-muted-foreground">
          Select one or more rows — a bottom-anchored bar appears with the
          selection count and bulk actions, dismissible without acting.
        </p>
        <ul className="divide-y divide-border rounded-md border border-border">
          {ITEMS.map((item) => (
            <li key={item} className="flex items-center gap-3 px-3 py-2">
              <Checkbox
                checked={selected.has(item)}
                onCheckedChange={() => toggle(item)}
                aria-label={`Select ${item}`}
              />
              <span className="text-sm text-foreground">{item}</span>
            </li>
          ))}
        </ul>
        <ActionBar selectedCount={selected.size} onClearSelection={() => setSelected(new Set())}>
          <Button size="sm" variant="secondary" onClick={() => setSelected(new Set())}>
            Archive
          </Button>
          <Button size="sm" variant="destructive" onClick={() => setSelected(new Set())}>
            Delete
          </Button>
        </ActionBar>
      </div>
    </ErrorBoundary>
  );
}
