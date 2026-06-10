import * as React from 'react';
import { Slider as BaseSlider } from '@base-ui-components/react/slider';

import { cn } from '@/lib/utils';

// Slider built on Base UI's Slider primitive (NOT Radix). shadcn-compatible.
const Slider = React.forwardRef<
  React.ComponentRef<typeof BaseSlider.Root>,
  React.ComponentPropsWithoutRef<typeof BaseSlider.Root>
>(({ className, ...props }, ref) => (
  <BaseSlider.Root
    ref={ref}
    className={cn('relative flex w-full touch-none select-none items-center', className)}
    {...props}
  >
    <BaseSlider.Control className="flex w-full items-center py-3">
      <BaseSlider.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary">
        <BaseSlider.Indicator className="absolute h-full rounded-full bg-primary" />
        <BaseSlider.Thumb
          className={cn(
            'block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors',
            // Base UI's Thumb hosts a hidden native <input> that receives the
            // actual keyboard focus — :focus-visible never fires on the thumb
            // itself, so the ring must key off the focused descendant.
            'has-[:focus-visible]:outline-none has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring has-[:focus-visible]:ring-offset-2',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            'disabled:pointer-events-none disabled:opacity-50',
          )}
        />
      </BaseSlider.Track>
    </BaseSlider.Control>
  </BaseSlider.Root>
));
Slider.displayName = 'Slider';

export { Slider };
