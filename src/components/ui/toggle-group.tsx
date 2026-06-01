import * as React from 'react';
import { ToggleGroup as BaseToggleGroup } from '@base-ui-components/react/toggle-group';
import { Toggle } from '@base-ui-components/react/toggle';

import { cn } from '@/lib/utils';
import { toggleVariants } from '@/components/ui/toggle';

// Toggle group built on Base UI's ToggleGroup + Toggle primitives (NOT Radix).
// Segmented control for single- or multi-select toggle sets.
const ToggleGroup = React.forwardRef<
  React.ComponentRef<typeof BaseToggleGroup>,
  React.ComponentPropsWithoutRef<typeof BaseToggleGroup>
>(({ className, ...props }, ref) => (
  <BaseToggleGroup
    ref={ref}
    className={cn('inline-flex items-center gap-1 rounded-md border border-input p-1', className)}
    {...props}
  />
));
ToggleGroup.displayName = 'ToggleGroup';

const ToggleGroupItem = React.forwardRef<
  React.ComponentRef<typeof Toggle>,
  React.ComponentPropsWithoutRef<typeof Toggle>
>(({ className, ...props }, ref) => (
  <Toggle ref={ref} className={cn(toggleVariants({ size: 'sm' }), className)} {...props} />
));
ToggleGroupItem.displayName = 'ToggleGroupItem';

export { ToggleGroup, ToggleGroupItem };
