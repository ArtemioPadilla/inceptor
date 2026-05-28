import * as React from 'react';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { chartColor } from './chart-colors';
import { cn } from '@/lib/utils';

export interface BarChartProps<T extends Record<string, unknown>> {
  data: T[];
  /** Key of the X-axis category in each datum. */
  index: keyof T & string;
  /** Y-axis series keys. */
  series: (keyof T & string)[];
  height?: number;
  className?: string;
}

export function BarChart<T extends Record<string, unknown>>({
  data,
  index,
  series,
  height = 300,
  className,
}: BarChartProps<T>) {
  return (
    <div className={cn('w-full', className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
          <XAxis
            dataKey={index}
            stroke="var(--muted-foreground)"
            tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
          />
          <YAxis
            stroke="var(--muted-foreground)"
            tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--popover)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--popover-foreground)',
              fontSize: 12,
            }}
            cursor={{ fill: 'var(--muted)', opacity: 0.4 }}
          />
          {series.map((key, i) => (
            <Bar key={key} dataKey={key} fill={chartColor(i)} radius={[4, 4, 0, 0]} />
          ))}
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}
