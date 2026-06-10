import * as React from 'react';
import { Menubar as BaseMenubar } from '@base-ui-components/react/menubar';
import { Menu } from '@base-ui-components/react/menu';

import { cn } from '@/lib/utils';

// Menubar built on Base UI's Menubar + Menu primitives (NOT Radix). Desktop-app
// style menu bar; each top-level menu is a Menu.Root inside the Menubar.
const Menubar = React.forwardRef<
  React.ComponentRef<typeof BaseMenubar>,
  React.ComponentPropsWithoutRef<typeof BaseMenubar>
>(({ className, ...props }, ref) => (
  <BaseMenubar
    ref={ref}
    className={cn('flex items-center gap-0.5 rounded-md border border-border bg-card p-1', className)}
    {...props}
  />
));
Menubar.displayName = 'Menubar';

const MenubarMenu = Menu.Root;

const MenubarTrigger = React.forwardRef<
  React.ComponentRef<typeof Menu.Trigger>,
  React.ComponentPropsWithoutRef<typeof Menu.Trigger>
>(({ className, ...props }, ref) => (
  <Menu.Trigger
    ref={ref}
    className={cn(
      'inline-flex h-8 cursor-pointer select-none items-center rounded px-3 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring',
      'hover:bg-accent hover:text-accent-foreground data-[popup-open]:bg-accent data-[popup-open]:text-accent-foreground',
      className,
    )}
    {...props}
  />
));
MenubarTrigger.displayName = 'MenubarTrigger';

const MenubarContent = React.forwardRef<
  React.ComponentRef<typeof Menu.Popup>,
  React.ComponentPropsWithoutRef<typeof Menu.Popup>
>(({ className, children, ...props }, ref) => (
  <Menu.Portal>
    <Menu.Positioner sideOffset={6} className="z-50">
      <Menu.Popup
        ref={ref}
        className={cn(
          'min-w-[12rem] rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md outline-none',
          'origin-[var(--transform-origin)] transition-[transform,opacity] data-[starting-style]:opacity-0 data-[ending-style]:opacity-0',
          className,
        )}
        {...props}
      >
        {children}
      </Menu.Popup>
    </Menu.Positioner>
  </Menu.Portal>
));
MenubarContent.displayName = 'MenubarContent';

const MenubarItem = React.forwardRef<
  React.ComponentRef<typeof Menu.Item>,
  React.ComponentPropsWithoutRef<typeof Menu.Item>
>(({ className, ...props }, ref) => (
  <Menu.Item
    ref={ref}
    className={cn(
      'relative flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none',
      'data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground',
      'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      className,
    )}
    {...props}
  />
));
MenubarItem.displayName = 'MenubarItem';

function MenubarSeparator({ className }: { className?: string }) {
  return <div role="separator" className={cn('-mx-1 my-1 h-px bg-border', className)} />;
}

export { Menubar, MenubarMenu, MenubarTrigger, MenubarContent, MenubarItem, MenubarSeparator };
