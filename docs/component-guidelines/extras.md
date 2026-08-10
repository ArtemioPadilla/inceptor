# Extras & data-viz

`gallery.ts` category: `extras` — Tree view, Timeline, Bar list, Sparkline,
Gauge, all under `src/components/ui/`. **Coverage in this file: Tree view
only** (added for ROADMAP Epic 18's keyboard-navigation contract table
requirement; the other four are documented in `docs/component-catalog.md`
and their own source until a concrete need pulls them into this format —
see `README.md`'s "Coverage — partial, expanding" note).

---

## Tree view

Source: [`src/components/ui/tree-view.tsx`](../../src/components/ui/tree-view.tsx)

**Purpose**: A collapsible file/nav tree — dependency-free recursive
markup (no Base UI primitive; ARIA `tree`/`treeitem`/`group` roles applied
by hand).

**When to use**: File-explorer-style or nested-category navigation where
the collapse/expand affordance itself (not selection) is the primary
interaction. For a flat or shallow list, `Accordion` or a plain list is
simpler.

**API overview**:

```tsx
interface TreeNode {
  id: string;
  label: string;
  children?: TreeNode[];
}

interface TreeViewProps {
  data: TreeNode[];
  defaultExpanded?: string[]; // node ids expanded on mount
  className?: string;
}
```

- Uncontrolled expand/collapse state — `expanded` is internal
  `React.useState<Set<string>>`, seeded once from `defaultExpanded`. There
  is **no** `expanded`/`onExpandedChange` controlled-mode prop.
- **No selection model.** Every `role="treeitem"` renders
  `aria-selected={false}` unconditionally — `TreeView` only tracks
  expand/collapse, not which node is "selected." If you need selection,
  wrap nodes yourself (`onClick` on your own node renderer) or reach for a
  different component; don't assume `aria-selected` reflects anything.

**Common mistakes**:

- Expecting arrow-key tree navigation because the markup uses
  `role="tree"`/`role="treeitem"` — see the Keyboard section below.
  `TreeView` applies the ARIA roles for screen-reader semantics but does
  **not** implement the WAI-ARIA tree-view keyboard interaction pattern
  (roving tabindex + arrow keys). Every node button is independently
  `Tab`-focusable instead.
- Passing a huge flat `data` tree and expecting virtualization — `TreeView`
  recursively renders every node currently in the DOM (collapsed subtrees
  don't render their children, but there's no windowing/virtualization
  the way `DataTable` has). For very large trees, only expand what's
  needed, or reach for a virtualized component instead.

### Keyboard

Read directly from `src/components/ui/tree-view.tsx` (ROADMAP Epic 18
keyboard-navigation contract table format). Documented as-is, not as an
aspirational "should support" list — despite the `role="tree"`/
`role="treeitem"` ARIA markup, **this component does not implement the full
WAI-ARIA TreeView keyboard pattern** (no roving tabindex, no arrow-key
node-to-node navigation, no typeahead). Every interactive element is a
plain `<button>`, so keyboard support is exactly native button semantics:

| Key | Description |
|---|---|
| <kbd>Tab</kbd> / <kbd>Shift+Tab</kbd> | Move focus to the next/previous node's button — native DOM tab order (depth-first through the currently-rendered, i.e. expanded, nodes). Collapsed subtrees are not in the tab sequence at all, since their children aren't rendered. |
| <kbd>Enter</kbd> / <kbd>Space</kbd> | Toggle the focused node's expand/collapse state (leaf nodes with no `children` have nothing to toggle — the click handler is a no-op). |

If a consumer needs the full arrow-key tree pattern (`↓`/`↑` move focus
between visible nodes, `→`/`←` expand/collapse or move to parent/first
child, `Home`/`End` jump to first/last visible node), that's currently
unimplemented — file an issue rather than assuming it works from the ARIA
roles alone.
