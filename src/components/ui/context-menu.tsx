import * as React from 'react';
import { ContextMenu as BaseContextMenu } from '@base-ui-components/react/context-menu';

import { cn } from '@/lib/utils';

// Context menu built on Base UI's ContextMenu primitive (NOT Radix). Opens on
// right-click / long-press.
const ContextMenu = BaseContextMenu.Root;
const ContextMenuTrigger = BaseContextMenu.Trigger;
const ContextMenuGroup = BaseContextMenu.Group;

const ContextMenuContent = React.forwardRef<
  React.ComponentRef<typeof BaseContextMenu.Popup>,
  React.ComponentPropsWithoutRef<typeof BaseContextMenu.Popup>
>(({ className, children, ...props }, ref) => (
  <BaseContextMenu.Portal>
    <BaseContextMenu.Positioner className="z-50">
      <BaseContextMenu.Popup
        ref={ref}
        className={cn(
          'min-w-[10rem] rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md outline-none',
          'origin-[var(--transform-origin)] transition-[transform,opacity] data-[starting-style]:opacity-0 data-[ending-style]:opacity-0',
          className,
        )}
        {...props}
      >
        {children}
      </BaseContextMenu.Popup>
    </BaseContextMenu.Positioner>
  </BaseContextMenu.Portal>
));
ContextMenuContent.displayName = 'ContextMenuContent';

const ContextMenuItem = React.forwardRef<
  React.ComponentRef<typeof BaseContextMenu.Item>,
  React.ComponentPropsWithoutRef<typeof BaseContextMenu.Item> & { inset?: boolean }
>(({ className, inset, ...props }, ref) => (
  <BaseContextMenu.Item
    ref={ref}
    className={cn(
      'relative flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none',
      'data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground',
      'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      inset && 'pl-8',
      className,
    )}
    {...props}
  />
));
ContextMenuItem.displayName = 'ContextMenuItem';

const ContextMenuLabel = React.forwardRef<
  React.ComponentRef<typeof BaseContextMenu.GroupLabel>,
  React.ComponentPropsWithoutRef<typeof BaseContextMenu.GroupLabel>
>(({ className, ...props }, ref) => (
  <BaseContextMenu.GroupLabel
    ref={ref}
    className={cn('px-2 py-1.5 text-xs font-semibold text-muted-foreground', className)}
    {...props}
  />
));
ContextMenuLabel.displayName = 'ContextMenuLabel';

function ContextMenuSeparator({ className }: { className?: string }) {
  return <div className={cn('-mx-1 my-1 h-px bg-border', className)} role="separator" />;
}

export {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuGroup,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
};
