import * as React from 'react';

import { cn } from '@/lib/utils';

// Timeline — a vertical activity feed. Dependency-free markup.
interface TimelineItemData {
  title: React.ReactNode;
  time?: React.ReactNode;
  description?: React.ReactNode;
}

interface TimelineProps extends React.HTMLAttributes<HTMLOListElement> {
  items: TimelineItemData[];
}

function Timeline({ items, className, ...props }: TimelineProps) {
  return (
    <ol className={cn('relative ml-2 border-l border-border', className)} {...props}>
      {items.map((item, i) => (
        <li key={i} className="ml-6 pb-6 last:pb-0">
          <span className="absolute -left-[5px] mt-1.5 h-2.5 w-2.5 rounded-full border-2 border-background bg-primary" />
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-sm font-medium text-foreground">{item.title}</p>
            {item.time && <span className="font-mono text-xs text-muted-foreground">{item.time}</span>}
          </div>
          {item.description && (
            <p className="mt-0.5 text-sm text-muted-foreground">{item.description}</p>
          )}
        </li>
      ))}
    </ol>
  );
}

export { Timeline };
