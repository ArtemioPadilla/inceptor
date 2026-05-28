import * as React from 'react';

import { cn } from '@/lib/utils';

export interface DividerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Optional centered text label rendered between two rules. */
  children?: React.ReactNode;
}

// Divider renders a themed horizontal rule. When children are provided it
// renders two shorter rules with the label centred between them via flexbox.
// Styled via --border so it flips automatically in dark mode.
export const Divider = React.forwardRef<HTMLDivElement, DividerProps>(
  ({ children, className, ...props }, ref) => {
    if (!children) {
      return (
        <div ref={ref} className={cn('w-full', className)} {...props}>
          <hr className="border-border" />
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn('flex items-center gap-3 w-full', className)}
        {...props}
      >
        <hr className="flex-1 border-border" />
        <span className="shrink-0 text-xs text-muted-foreground">{children}</span>
        <hr className="flex-1 border-border" />
      </div>
    );
  },
);
Divider.displayName = 'Divider';
