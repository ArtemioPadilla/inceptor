import * as React from 'react';
import { NavigationMenu as BaseNavigationMenu } from '@base-ui-components/react/navigation-menu';
import { ChevronDownIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

// Navigation menu built on Base UI's NavigationMenu primitive (NOT Radix).
// Top nav with flyout panels.
const NavigationMenu = React.forwardRef<
  React.ComponentRef<typeof BaseNavigationMenu.Root>,
  React.ComponentPropsWithoutRef<typeof BaseNavigationMenu.Root>
>(({ className, children, ...props }, ref) => (
  <BaseNavigationMenu.Root ref={ref} className={cn('relative', className)} {...props}>
    {children}
    <BaseNavigationMenu.Portal>
      <BaseNavigationMenu.Positioner sideOffset={8} className="z-50">
        <BaseNavigationMenu.Popup className="origin-[var(--transform-origin)] rounded-md border border-border bg-popover text-popover-foreground shadow-md transition-[transform,opacity] data-[starting-style]:opacity-0 data-[ending-style]:opacity-0">
          <BaseNavigationMenu.Viewport className="relative h-[var(--popup-height)] w-[var(--popup-width)] overflow-hidden transition-[width,height] duration-200" />
        </BaseNavigationMenu.Popup>
      </BaseNavigationMenu.Positioner>
    </BaseNavigationMenu.Portal>
  </BaseNavigationMenu.Root>
));
NavigationMenu.displayName = 'NavigationMenu';

const NavigationMenuList = React.forwardRef<
  React.ComponentRef<typeof BaseNavigationMenu.List>,
  React.ComponentPropsWithoutRef<typeof BaseNavigationMenu.List>
>(({ className, ...props }, ref) => (
  <BaseNavigationMenu.List ref={ref} className={cn('flex items-center gap-1', className)} {...props} />
));
NavigationMenuList.displayName = 'NavigationMenuList';

const NavigationMenuItem = BaseNavigationMenu.Item;

const NavigationMenuTrigger = React.forwardRef<
  React.ComponentRef<typeof BaseNavigationMenu.Trigger>,
  React.ComponentPropsWithoutRef<typeof BaseNavigationMenu.Trigger>
>(({ className, children, ...props }, ref) => (
  <BaseNavigationMenu.Trigger
    ref={ref}
    className={cn(
      'inline-flex h-9 items-center gap-1 rounded-md px-3 text-sm font-medium outline-none transition-colors',
      'focus-visible:ring-2 focus-visible:ring-ring',
      'hover:bg-accent hover:text-accent-foreground data-[popup-open]:bg-accent',
      className,
    )}
    {...props}
  >
    {children}
    <ChevronDownIcon className="h-3.5 w-3.5 transition-transform data-[popup-open]:rotate-180" />
  </BaseNavigationMenu.Trigger>
));
NavigationMenuTrigger.displayName = 'NavigationMenuTrigger';

const NavigationMenuContent = React.forwardRef<
  React.ComponentRef<typeof BaseNavigationMenu.Content>,
  React.ComponentPropsWithoutRef<typeof BaseNavigationMenu.Content>
>(({ className, ...props }, ref) => (
  <BaseNavigationMenu.Content ref={ref} className={cn('w-64 p-3', className)} {...props} />
));
NavigationMenuContent.displayName = 'NavigationMenuContent';

const NavigationMenuLink = React.forwardRef<
  React.ComponentRef<typeof BaseNavigationMenu.Link>,
  React.ComponentPropsWithoutRef<typeof BaseNavigationMenu.Link>
>(({ className, ...props }, ref) => (
  <BaseNavigationMenu.Link
    ref={ref}
    className={cn(
      'block rounded-md px-3 py-2 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring',
      className,
    )}
    {...props}
  />
));
NavigationMenuLink.displayName = 'NavigationMenuLink';

export {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuTrigger,
  NavigationMenuContent,
  NavigationMenuLink,
};
