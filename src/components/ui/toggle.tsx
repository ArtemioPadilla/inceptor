import * as React from 'react';
import { Toggle as BaseToggle } from '@base-ui-components/react/toggle';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

// Toggle built on Base UI's Toggle primitive (NOT Radix). A two-state button.
const toggleVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors hover:bg-muted hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 data-[pressed]:bg-accent data-[pressed]:text-accent-foreground [&_svg]:size-4',
  {
    variants: {
      variant: {
        default: 'bg-transparent',
        outline: 'border border-input bg-transparent hover:bg-accent hover:text-accent-foreground',
      },
      size: { default: 'h-9 px-2.5', sm: 'h-8 px-2', lg: 'h-10 px-3' },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
);

const Toggle = React.forwardRef<
  React.ComponentRef<typeof BaseToggle>,
  React.ComponentPropsWithoutRef<typeof BaseToggle> & VariantProps<typeof toggleVariants>
>(({ className, variant, size, ...props }, ref) => (
  <BaseToggle ref={ref} className={cn(toggleVariants({ variant, size, className }))} {...props} />
));
Toggle.displayName = 'Toggle';

export { Toggle, toggleVariants };
