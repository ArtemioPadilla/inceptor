import * as React from 'react';
import { Toolbar as BaseToolbar } from '@base-ui-components/react/toolbar';

import { cn } from '@/lib/utils';

// Toolbar built on Base UI's Toolbar primitive (NOT Radix). Groups buttons,
// toggles and inputs with roving-tabindex keyboard nav.
const Toolbar = React.forwardRef<
  React.ComponentRef<typeof BaseToolbar.Root>,
  React.ComponentPropsWithoutRef<typeof BaseToolbar.Root>
>(({ className, ...props }, ref) => (
  <BaseToolbar.Root
    ref={ref}
    className={cn('flex items-center gap-1 rounded-md border border-border bg-card p-1', className)}
    {...props}
  />
));
Toolbar.displayName = 'Toolbar';

const ToolbarButton = React.forwardRef<
  React.ComponentRef<typeof BaseToolbar.Button>,
  React.ComponentPropsWithoutRef<typeof BaseToolbar.Button>
>(({ className, ...props }, ref) => (
  <BaseToolbar.Button
    ref={ref}
    className={cn(
      'inline-flex h-8 items-center justify-center gap-1.5 rounded px-2.5 text-sm font-medium text-foreground transition-colors',
      'hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
      'disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4',
      className,
    )}
    {...props}
  />
));
ToolbarButton.displayName = 'ToolbarButton';

const ToolbarGroup = BaseToolbar.Group;

const ToolbarSeparator = React.forwardRef<
  React.ComponentRef<typeof BaseToolbar.Separator>,
  React.ComponentPropsWithoutRef<typeof BaseToolbar.Separator>
>(({ className, ...props }, ref) => (
  <BaseToolbar.Separator ref={ref} className={cn('mx-1 h-5 w-px bg-border', className)} {...props} />
));
ToolbarSeparator.displayName = 'ToolbarSeparator';

export { Toolbar, ToolbarButton, ToolbarGroup, ToolbarSeparator };
