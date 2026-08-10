import * as React from 'react';
import { ToggleGroup as BaseToggleGroup } from '@base-ui-components/react/toggle-group';
import { Toggle } from '@base-ui-components/react/toggle';

import { cn } from '@/lib/utils';
import { toggleVariants } from '@/components/ui/toggle';
import { createDisposer } from '@/lib/disposer';

// Toggle group built on Base UI's ToggleGroup + Toggle primitives (NOT Radix).
// Segmented control for single- or multi-select toggle sets.

// Internal-only context so ToggleGroupItem can read the parent's `variant`
// and defer its own background to the sliding indicator in segmented mode.
// Scoped to the single React tree this compound component renders — it never
// crosses an island boundary (see docs/COMPONENTS.md §4).
const ToggleGroupVariantContext = React.createContext<'default' | 'segmented'>('default');

function mergeRefs<T>(...refs: Array<React.Ref<T> | undefined>): React.RefCallback<T> {
  return (node) => {
    for (const ref of refs) {
      if (typeof ref === 'function') ref(node);
      else if (ref) (ref as React.RefObject<T | null>).current = node;
    }
  };
}

export interface ToggleGroupProps extends React.ComponentPropsWithoutRef<typeof BaseToggleGroup> {
  /**
   * `'segmented'` renders an animated sliding-indicator pill behind the
   * active item (Epic 21 polish — Toggle Group already covers ~90% of the
   * segmented-control pattern; this is the missing 10%).
   * @default 'default'
   */
  variant?: 'default' | 'segmented';
}

const ToggleGroup = React.forwardRef<React.ComponentRef<typeof BaseToggleGroup>, ToggleGroupProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    const containerRef = React.useRef<HTMLDivElement>(null);
    const indicatorRef = React.useRef<HTMLSpanElement>(null);

    const updateIndicator = React.useCallback(() => {
      const container = containerRef.current;
      const indicator = indicatorRef.current;
      if (!container || !indicator) return;
      const active = container.querySelector<HTMLElement>('[aria-pressed="true"]');
      if (!active) {
        indicator.style.opacity = '0';
        return;
      }
      const containerRect = container.getBoundingClientRect();
      const activeRect = active.getBoundingClientRect();
      indicator.style.opacity = '1';
      indicator.style.width = `${activeRect.width}px`;
      indicator.style.height = `${activeRect.height}px`;
      indicator.style.transform = `translate(${activeRect.left - containerRect.left}px, ${activeRect.top - containerRect.top}px)`;
    }, []);

    React.useLayoutEffect(() => {
      if (variant !== 'segmented') return undefined;
      const container = containerRef.current;
      if (!container) return undefined;

      updateIndicator();

      const d = createDisposer();
      // aria-pressed flips synchronously with press state — observe it
      // instead of hooking into value/onValueChange, so this works whether
      // the group is controlled or uncontrolled.
      const observer = new MutationObserver(updateIndicator);
      observer.observe(container, { attributes: true, attributeFilter: ['aria-pressed'], subtree: true });
      d.add(() => observer.disconnect());
      d.on(window, 'resize', updateIndicator);
      return d.dispose;
    }, [variant, updateIndicator]);

    return (
      <ToggleGroupVariantContext.Provider value={variant}>
        <BaseToggleGroup
          ref={mergeRefs(ref, containerRef)}
          className={cn(
            'relative inline-flex items-center gap-1 rounded-md border border-input p-1',
            variant === 'segmented' && 'gap-0 bg-muted',
            className,
          )}
          {...props}
        >
          {variant === 'segmented' && (
            <span
              ref={indicatorRef}
              aria-hidden="true"
              className="pointer-events-none absolute left-0 top-0 rounded-sm bg-background opacity-0 shadow-sm transition-[transform,width,height,opacity] duration-200 ease-out"
            />
          )}
          {children}
        </BaseToggleGroup>
      </ToggleGroupVariantContext.Provider>
    );
  },
);
ToggleGroup.displayName = 'ToggleGroup';

const ToggleGroupItem = React.forwardRef<
  React.ComponentRef<typeof Toggle>,
  React.ComponentPropsWithoutRef<typeof Toggle>
>(({ className, ...props }, ref) => {
  const variant = React.useContext(ToggleGroupVariantContext);
  return (
    <Toggle
      ref={ref}
      className={cn(
        toggleVariants({ size: 'sm' }),
        variant === 'segmented' &&
          'relative z-10 bg-transparent text-muted-foreground hover:bg-transparent hover:text-foreground data-[pressed]:bg-transparent data-[pressed]:text-foreground',
        className,
      )}
      {...props}
    />
  );
});
ToggleGroupItem.displayName = 'ToggleGroupItem';

export { ToggleGroup, ToggleGroupItem };
