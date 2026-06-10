import * as React from 'react';

import { cn } from '@/lib/utils';

export interface TrackerBlock {
  key: string | number;
  /** Tooltip text — surfaced via the title attribute for now. */
  tooltip?: string;
  /** Semantic color bucket mapped to a Tailwind utility class. */
  color: 'primary' | 'success' | 'warning' | 'destructive' | 'muted';
}

export interface TrackerProps extends React.HTMLAttributes<HTMLDivElement> {
  data: TrackerBlock[];
}

// colorMap maps semantic TrackerBlock colors to Tailwind class strings.
// success/warning don't have shadcn semantic vars, so we use OKLCH literals
// that stay readable in both light and dark (no JS colour flip needed — the
// arbitrary values are absolute, not relative to the theme).
const colorMap: Record<TrackerBlock['color'], string> = {
  primary: 'bg-primary',
  success: 'bg-[oklch(0.6_0.15_140)]',
  warning: 'bg-[oklch(0.7_0.18_70)]',
  destructive: 'bg-destructive',
  muted: 'bg-muted-foreground/30',
};

// Tracker renders a row of small colored cells — useful for uptime grids,
// calendar heatmaps, or any sequence with a fixed set of states.
export const Tracker = React.forwardRef<HTMLDivElement, TrackerProps>(
  ({ data, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex gap-0.5 w-full', className)}
      {...props}
    >
      {data.map((block) => (
        <div
          key={block.key}
          // title keeps hover tooltip for mouse users; role+aria-label for AT users.
          title={block.tooltip}
          role="img"
          aria-label={block.tooltip}
          className={cn(
            'h-8 flex-1 rounded-sm',
            colorMap[block.color],
          )}
        />
      ))}
    </div>
  ),
);
Tracker.displayName = 'Tracker';
