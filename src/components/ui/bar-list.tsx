import * as React from 'react';

import { cn } from '@/lib/utils';

// BarList — Tremor-style ranked categorical bars. Dependency-free markup.
export interface BarListDatum {
  name: string;
  value: number;
}

interface BarListProps extends React.HTMLAttributes<HTMLDivElement> {
  data: BarListDatum[];
  valueFormatter?: (value: number) => string;
}

function BarList({ data, valueFormatter = (v) => String(v), className, ...props }: BarListProps) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className={cn('space-y-2', className)} {...props}>
      {data.map((d) => (
        <div key={d.name} className="flex items-center gap-3">
          <div className="relative h-7 flex-1 overflow-hidden rounded-sm bg-primary/10">
            <div
              className="absolute inset-y-0 left-0 rounded-sm bg-primary/30"
              style={{ width: `${(d.value / max) * 100}%` }}
            />
            <span className="absolute inset-y-0 left-2 flex items-center text-sm text-foreground">
              {d.name}
            </span>
          </div>
          <span className="w-12 shrink-0 text-right font-mono text-sm tabular-nums text-muted-foreground">
            {valueFormatter(d.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

export { BarList };
