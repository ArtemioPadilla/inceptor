import * as React from 'react';

import { cn } from '@/lib/utils';

// DescriptionList — key/value detail panels via semantic <dl>. Dependency-free.
function DescriptionList({ className, ...props }: React.ComponentProps<'dl'>) {
  return <dl className={cn('divide-y divide-border', className)} {...props} />;
}

interface DescriptionItemProps extends React.HTMLAttributes<HTMLDivElement> {
  term: React.ReactNode;
}

function DescriptionItem({ term, children, className, ...props }: DescriptionItemProps) {
  return (
    <div className={cn('grid grid-cols-3 gap-4 py-3 text-sm', className)} {...props}>
      <dt className="text-muted-foreground">{term}</dt>
      <dd className="col-span-2 text-foreground">{children}</dd>
    </div>
  );
}

export { DescriptionList, DescriptionItem };
