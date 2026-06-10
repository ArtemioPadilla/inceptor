import * as React from 'react';
import { NumberField as BaseNumberField } from '@base-ui-components/react/number-field';
import { MinusIcon, PlusIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

// Number field built on Base UI's NumberField primitive (NOT Radix). Stepper
// input with increment/decrement + scrub support.
const NumberField = React.forwardRef<
  React.ComponentRef<typeof BaseNumberField.Root>,
  React.ComponentPropsWithoutRef<typeof BaseNumberField.Root>
>(({ className, ...props }, ref) => (
  <BaseNumberField.Root ref={ref} className={cn('inline-flex', className)} {...props}>
    <BaseNumberField.Group className="inline-flex h-10 items-center rounded-md border border-input bg-background">
      <BaseNumberField.Decrement className="grid h-full w-9 place-items-center rounded-l-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-50">
        <MinusIcon className="h-4 w-4" />
      </BaseNumberField.Decrement>
      <BaseNumberField.Input className="h-full w-16 border-x border-input bg-transparent text-center text-sm tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
      <BaseNumberField.Increment className="grid h-full w-9 place-items-center rounded-r-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-50">
        <PlusIcon className="h-4 w-4" />
      </BaseNumberField.Increment>
    </BaseNumberField.Group>
  </BaseNumberField.Root>
));
NumberField.displayName = 'NumberField';

export { NumberField };
