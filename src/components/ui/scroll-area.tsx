import * as React from 'react';
import { ScrollArea as BaseScrollArea } from '@base-ui-components/react/scroll-area';

import { cn } from '@/lib/utils';

// Scroll area built on Base UI's ScrollArea primitive (NOT Radix) — styled
// custom scrollbars that overlay content.
const ScrollArea = React.forwardRef<
  React.ComponentRef<typeof BaseScrollArea.Root>,
  React.ComponentPropsWithoutRef<typeof BaseScrollArea.Root>
>(({ className, children, ...props }, ref) => (
  <BaseScrollArea.Root ref={ref} className={cn('relative overflow-hidden', className)} {...props}>
    <BaseScrollArea.Viewport className="h-full w-full rounded-[inherit] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset">
      <BaseScrollArea.Content>{children}</BaseScrollArea.Content>
    </BaseScrollArea.Viewport>
    <BaseScrollArea.Scrollbar
      orientation="vertical"
      className="flex w-2.5 touch-none select-none p-0.5 transition-colors data-[hovering]:bg-muted/50"
    >
      <BaseScrollArea.Thumb className="relative flex-1 rounded-full bg-border" />
    </BaseScrollArea.Scrollbar>
    <BaseScrollArea.Scrollbar
      orientation="horizontal"
      className="flex h-2.5 touch-none select-none p-0.5 transition-colors data-[hovering]:bg-muted/50"
    >
      <BaseScrollArea.Thumb className="relative rounded-full bg-border" />
    </BaseScrollArea.Scrollbar>
    <BaseScrollArea.Corner />
  </BaseScrollArea.Root>
));
ScrollArea.displayName = 'ScrollArea';

export { ScrollArea };
