import * as React from 'react';
import { Meter as BaseMeter } from '@base-ui-components/react/meter';

import { cn } from '@/lib/utils';

// Meter built on Base UI's Meter primitive (NOT Radix). Represents a static
// measured value within a range (disk usage, score) — unlike Progress, which
// reflects task completion.
interface MeterProps extends React.ComponentPropsWithoutRef<typeof BaseMeter.Root> {
  label?: React.ReactNode;
  showValue?: boolean;
}

const Meter = React.forwardRef<React.ComponentRef<typeof BaseMeter.Root>, MeterProps>(
  ({ className, label, showValue = true, ...props }, ref) => (
    <BaseMeter.Root
      ref={ref}
      className={cn('w-full', className)}
      // role="meter" requires an accessible name; fall back to the visible
      // label text (or a generic one) when the consumer doesn't provide one.
      aria-label={props['aria-label'] ?? (typeof label === 'string' ? label : 'measured value')}
      {...props}
    >
      {(label || showValue) && (
        <div className="mb-1 flex items-center justify-between text-xs">
          {label ? <BaseMeter.Label className="text-foreground">{label}</BaseMeter.Label> : <span />}
          {showValue && <BaseMeter.Value className="font-mono text-muted-foreground" />}
        </div>
      )}
      <BaseMeter.Track className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
        <BaseMeter.Indicator className="h-full rounded-full bg-primary transition-all" />
      </BaseMeter.Track>
    </BaseMeter.Root>
  ),
);
Meter.displayName = 'Meter';

export { Meter };
