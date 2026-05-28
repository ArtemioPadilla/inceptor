import * as React from 'react';

import { cn } from '@/lib/utils';

// KpiCard is the Tremor Raw "Card" variant — a self-contained wrapper for
// dashboard metrics. Named KpiCard to avoid collision with shadcn's Card
// compound component (Card/CardHeader/CardContent/CardFooter) in card.tsx.
export interface KpiCardProps extends React.HTMLAttributes<HTMLDivElement> {}

export const KpiCard = React.forwardRef<HTMLDivElement, KpiCardProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'rounded-lg border border-border bg-card text-card-foreground p-6 shadow-sm',
        className,
      )}
      {...props}
    />
  ),
);
KpiCard.displayName = 'KpiCard';
