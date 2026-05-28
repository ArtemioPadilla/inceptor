import * as React from 'react';
import { LineChart } from '@/components/ui/charts/line-chart';
import { BarChart } from '@/components/ui/charts/bar-chart';
import { AreaChart } from '@/components/ui/charts/area-chart';
import { DonutChart } from '@/components/ui/charts/donut-chart';
import ErrorBoundary from './ErrorBoundary';

const monthly = [
  { month: 'Jan', issues: 4, prs: 2 },
  { month: 'Feb', issues: 7, prs: 5 },
  { month: 'Mar', issues: 3, prs: 3 },
  { month: 'Apr', issues: 9, prs: 6 },
  { month: 'May', issues: 5, prs: 4 },
  { month: 'Jun', issues: 11, prs: 8 },
];

const donutData = [
  { name: 'type:feat', value: 14 },
  { name: 'type:chore', value: 8 },
  { name: 'type:docs', value: 4 },
  { name: 'type:fix', value: 3 },
];

export default function ShowcaseCharts() {
  return (
    <ErrorBoundary name="ShowcaseCharts">
    <div className="space-y-8">
      <div>
        <p className="text-sm font-medium text-muted-foreground mb-2">LineChart</p>
        <LineChart data={monthly} index="month" series={['issues', 'prs']} height={220} />
      </div>
      <div>
        <p className="text-sm font-medium text-muted-foreground mb-2">BarChart</p>
        <BarChart data={monthly} index="month" series={['issues', 'prs']} height={220} />
      </div>
      <div>
        <p className="text-sm font-medium text-muted-foreground mb-2">AreaChart</p>
        <AreaChart data={monthly} index="month" series={['issues', 'prs']} height={220} />
      </div>
      <div>
        <p className="text-sm font-medium text-muted-foreground mb-2">DonutChart</p>
        <DonutChart data={donutData} height={260} />
      </div>
    </div>
    </ErrorBoundary>
  );
}
