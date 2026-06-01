import * as React from 'react';
import { Checkbox as BaseCheckbox } from '@base-ui-components/react/checkbox';
import { CheckIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

// Checkbox built on Base UI's Checkbox primitive (NOT Radix). shadcn-compatible.
const Checkbox = React.forwardRef<
  React.ComponentRef<typeof BaseCheckbox.Root>,
  React.ComponentPropsWithoutRef<typeof BaseCheckbox.Root>
>(({ className, ...props }, ref) => (
  <BaseCheckbox.Root
    ref={ref}
    className={cn(
      'peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      'disabled:cursor-not-allowed disabled:opacity-50',
      'data-[checked]:bg-primary data-[checked]:text-primary-foreground',
      'data-[indeterminate]:bg-primary data-[indeterminate]:text-primary-foreground',
      className,
    )}
    {...props}
  >
    <BaseCheckbox.Indicator className="flex items-center justify-center text-current">
      <CheckIcon className="h-3.5 w-3.5" />
    </BaseCheckbox.Indicator>
  </BaseCheckbox.Root>
));
Checkbox.displayName = 'Checkbox';

export { Checkbox };
