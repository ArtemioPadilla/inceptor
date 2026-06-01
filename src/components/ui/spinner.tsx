import * as React from 'react';
import { Loader2Icon } from 'lucide-react';

import { cn } from '@/lib/utils';

// Spinner — an inline loading indicator. Dependency-free (lucide + CSS spin).
interface SpinnerProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Accessible label announced to screen readers. */
  label?: string;
}

function Spinner({ className, label = 'Loading', ...props }: SpinnerProps) {
  return (
    <span role="status" aria-label={label} className={cn('inline-flex', className)} {...props}>
      <Loader2Icon className="h-4 w-4 animate-spin text-current" />
      <span className="sr-only">{label}</span>
    </span>
  );
}

export { Spinner };
