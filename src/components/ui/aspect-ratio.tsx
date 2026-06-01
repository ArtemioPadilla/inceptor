import * as React from 'react';

import { cn } from '@/lib/utils';

// AspectRatio — constrains content to a ratio via the native CSS aspect-ratio
// property. No primitive needed.
interface AspectRatioProps extends React.HTMLAttributes<HTMLDivElement> {
  /** width / height, e.g. 16/9. Defaults to 1. */
  ratio?: number;
}

const AspectRatio = React.forwardRef<HTMLDivElement, AspectRatioProps>(
  ({ ratio = 1, className, style, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('w-full overflow-hidden', className)}
      style={{ aspectRatio: String(ratio), ...style }}
      {...props}
    />
  ),
);
AspectRatio.displayName = 'AspectRatio';

export { AspectRatio };
