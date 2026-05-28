import * as React from 'react';

import { cn } from '@/lib/utils';

export interface MetricProps extends React.HTMLAttributes<HTMLParagraphElement> {
  value: string | number;
  label?: string;
  delta?: {
    value: number;
    /** Semantic trend direction. Controls color and arrow direction. */
    trend: 'up' | 'down' | 'neutral';
  };
}

// Metric renders a large numeric KPI value with an optional trend delta and
// secondary label. Modelled on Tremor Raw's <Metric> API but themed entirely
// via shadcn CSS vars (copy-paste pattern, not an npm package import).
export const Metric = React.forwardRef<HTMLParagraphElement, MetricProps>(
  ({ value, label, delta, className, ...props }, ref) => {
    const deltaColor =
      delta?.trend === 'up'
        ? 'text-primary'
        : delta?.trend === 'down'
          ? 'text-destructive'
          : 'text-muted-foreground';

    const arrow =
      delta?.trend === 'up' ? '↑' : delta?.trend === 'down' ? '↓' : '→';

    return (
      <p
        ref={ref}
        className={cn('text-foreground', className)}
        {...props}
      >
        <span className="text-3xl font-semibold tabular-nums">{value}</span>
        {delta !== undefined && (
          <span className={cn('ml-2 text-sm font-medium', deltaColor)}>
            {arrow}
            {Math.abs(delta.value)}%
          </span>
        )}
        {label && (
          <span className="block mt-1 text-sm text-muted-foreground">
            {label}
          </span>
        )}
      </p>
    );
  },
);
Metric.displayName = 'Metric';
