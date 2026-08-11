import * as React from 'react';
import * as splitter from '@zag-js/splitter';
import { normalizeProps, useMachine } from '@zag-js/react';
import { GripVerticalIcon, GripHorizontalIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Splitter — resizable panes for master-detail layouts (ROADMAP Epic 22).
 * Base UI ships no splitter primitive, so per ADR 0009 this wraps
 * `@zag-js/splitter` directly (not `@ark-ui/react`) as the state-machine
 * foundation, styled with Inceptor's own Tailwind/`cn()` conventions instead
 * of zag's `data-scope`/`data-part` styling story.
 *
 * `SplitterContext` is intra-component only — the entire <Splitter> composition
 * lives in one file/subtree, same rationale as `form.tsx`'s FormFieldContext.
 * It never crosses an Astro island boundary.
 */

export interface SplitterPanelConfig {
  /** Matches the `id` used by the corresponding <SplitterPanel>. */
  id: string;
  /** Initial size, in percent of the group's main axis. */
  defaultSize?: number;
  /** Minimum size, in percent. */
  minSize?: number;
  /** Maximum size, in percent. */
  maxSize?: number;
  /** Whether the panel can be collapsed to `collapsedSize` (default 0). */
  collapsible?: boolean;
}

type SplitterApi = ReturnType<typeof splitter.connect>;

const SplitterContext = React.createContext<SplitterApi | null>(null);

function useSplitterApi(): SplitterApi {
  const api = React.useContext(SplitterContext);
  if (!api) {
    throw new Error('Splitter.* components must be rendered inside <Splitter>');
  }
  return api;
}

export interface SplitterProps {
  /** Size constraints for every panel, in the same order they're rendered. */
  panels: SplitterPanelConfig[];
  /** @default 'horizontal' */
  orientation?: 'horizontal' | 'vertical';
  /** Pixels to move per arrow-key press (Shift+Arrow always moves 10%). */
  keyboardResizeBy?: number;
  /** Fires whenever the resolved panel sizes change (drag, keyboard, or reset). */
  onResize?: (details: { size: number[] }) => void;
  className?: string;
  /** <SplitterPanel> and <SplitterResizeTrigger> children. */
  children: React.ReactNode;
}

export function Splitter({
  panels,
  orientation = 'horizontal',
  keyboardResizeBy,
  onResize,
  className,
  children,
}: SplitterProps) {
  const id = React.useId();

  // zag's PanelData has no `defaultSize` field — the machine takes initial
  // sizes as a sibling `defaultSize` array (same order as `panels`), and
  // per-panel min/max/collapsible live on the panel entries themselves.
  const zagPanels = React.useMemo<splitter.PanelData[]>(
    () =>
      panels.map(({ id: panelId, minSize, maxSize, collapsible }) => ({
        id: panelId,
        minSize,
        maxSize,
        collapsible,
      })),
    [panels],
  );
  const defaultSize = React.useMemo(
    () => panels.map((p) => p.defaultSize ?? 100 / panels.length),
    [panels],
  );

  const service = useMachine(splitter.machine, {
    id,
    orientation,
    panels: zagPanels,
    defaultSize,
    keyboardResizeBy: keyboardResizeBy ?? null,
    onResize,
  });

  const api = splitter.connect(service, normalizeProps);

  return (
    <SplitterContext.Provider value={api}>
      <div {...api.getRootProps()} className={cn('rounded-lg border border-border', className)}>
        {children}
      </div>
    </SplitterContext.Provider>
  );
}

export interface SplitterPanelProps {
  /** Must match one entry in the parent <Splitter>'s `panels` prop. */
  id: string;
  className?: string;
  children?: React.ReactNode;
}

export function SplitterPanel({ id, className, children }: SplitterPanelProps) {
  const api = useSplitterApi();
  return (
    <div {...api.getPanelProps({ id })} className={cn('overflow-auto p-4', className)}>
      {children}
    </div>
  );
}

export interface SplitterResizeTriggerProps {
  /** `"<beforePanelId>:<afterPanelId>"` — the two panels this handle resizes. */
  id: `${string}:${string}`;
  disabled?: boolean;
  className?: string;
  /**
   * Accessible name for the handle. `@zag-js/splitter`'s `getResizeTriggerProps()`
   * sets `role="separator"` plus full keyboard/ARIA-value wiring but never an
   * accessible name — without one, keyboard/screen-reader users hear only
   * "separator, N percent" with no indication of what it resizes. Required for
   * any real (non-decorative-demo) usage; see `docs/component-guidelines/`.
   */
  'aria-label'?: string;
  /** Alternative to `aria-label` when a visible label element already exists. */
  'aria-labelledby'?: string;
}

// The state-machine already exposes `data-dragging` / `data-focus` /
// `data-disabled` (see @zag-js/splitter's connect.ts) — present-when-true,
// absent otherwise, same convention Base UI's `data-[state]` selectors use.
export function SplitterResizeTrigger({
  id,
  disabled,
  className,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
}: SplitterResizeTriggerProps) {
  const api = useSplitterApi();
  const horizontal = api.orientation === 'horizontal';
  const Icon = horizontal ? GripVerticalIcon : GripHorizontalIcon;

  return (
    <div
      {...api.getResizeTriggerProps({ id, disabled })}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      className={cn(
        'group relative flex shrink-0 items-center justify-center bg-border transition-colors',
        'hover:bg-primary/40 data-[focus]:bg-primary/50 data-[dragging]:bg-primary/60',
        'data-[disabled]:pointer-events-none data-[disabled]:opacity-40',
        horizontal ? 'w-1.5 cursor-col-resize' : 'h-1.5 cursor-row-resize',
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'flex items-center justify-center rounded-sm border border-border bg-background text-muted-foreground',
          'group-hover:text-foreground group-focus-visible:outline-none group-focus-visible:ring-2 group-focus-visible:ring-ring',
          horizontal ? 'h-8 w-3.5' : 'h-3.5 w-8',
        )}
      >
        <Icon className="h-3 w-3" />
      </span>
    </div>
  );
}
