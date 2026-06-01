import * as React from 'react';
import { Collapsible as BaseCollapsible } from '@base-ui-components/react/collapsible';

import { cn } from '@/lib/utils';

// Collapsible built on Base UI's Collapsible primitive (NOT Radix).
const Collapsible = BaseCollapsible.Root;
const CollapsibleTrigger = BaseCollapsible.Trigger;

const CollapsibleContent = React.forwardRef<
  React.ComponentRef<typeof BaseCollapsible.Panel>,
  React.ComponentPropsWithoutRef<typeof BaseCollapsible.Panel>
>(({ className, ...props }, ref) => (
  <BaseCollapsible.Panel
    ref={ref}
    className={cn(
      'overflow-hidden',
      'h-[var(--collapsible-panel-height)] transition-[height] duration-200 ease-out',
      'data-[starting-style]:h-0 data-[ending-style]:h-0',
      className,
    )}
    {...props}
  />
));
CollapsibleContent.displayName = 'CollapsibleContent';

export { Collapsible, CollapsibleTrigger, CollapsibleContent };
