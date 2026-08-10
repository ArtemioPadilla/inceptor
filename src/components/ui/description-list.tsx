import * as React from 'react';

import { FieldDisplay } from '@/components/ui/field-type/display';
import type { FieldType } from '@/lib/field-type';
import { cn } from '@/lib/utils';

// DescriptionList — key/value detail panels via semantic <dl>. Dependency-free.
function DescriptionList({ className, ...props }: React.ComponentProps<'dl'>) {
  return <dl className={cn('divide-y divide-border', className)} {...props} />;
}

interface DescriptionItemProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  term: React.ReactNode;
  children?: React.ReactNode;
  /**
   * Render the value through the shared fieldType display renderer
   * (ROADMAP Epic 24, `src/lib/field-type.ts`) instead of hand-formatting
   * `children` yourself — the same renderer DataTable cells use. Pass
   * together with `value`; when both are supplied they take precedence
   * over `children` (additive — omit them and this behaves exactly as
   * before).
   */
  fieldType?: FieldType;
  value?: unknown;
}

function DescriptionItem({ term, children, fieldType, value, className, ...props }: DescriptionItemProps) {
  return (
    <div className={cn('grid grid-cols-3 gap-4 py-3 text-sm', className)} {...props}>
      <dt className="text-muted-foreground">{term}</dt>
      <dd className="col-span-2 text-foreground">
        {fieldType ? <FieldDisplay fieldType={fieldType} value={value} /> : children}
      </dd>
    </div>
  );
}

export { DescriptionList, DescriptionItem };
