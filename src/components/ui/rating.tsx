import * as React from 'react';
import { StarIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

// Rating — a star rating control. Dependency-free; keyboard + hover support.
interface RatingProps {
  value: number;
  onValueChange?: (value: number) => void;
  max?: number;
  readOnly?: boolean;
  className?: string;
}

function Rating({ value, onValueChange, max = 5, readOnly, className }: RatingProps) {
  const [hover, setHover] = React.useState<number | null>(null);
  const shown = hover ?? value;

  return (
    <div
      className={cn('inline-flex items-center gap-0.5', className)}
      role="radiogroup"
      aria-label="Rating"
    >
      {Array.from({ length: max }, (_, i) => {
        const star = i + 1;
        return (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={value === star}
            aria-label={`${star} star${star > 1 ? 's' : ''}`}
            disabled={readOnly}
            className={cn(
              'rounded-sm p-0.5 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              !readOnly && 'cursor-pointer hover:scale-110',
            )}
            onClick={() => onValueChange?.(star)}
            onMouseEnter={() => !readOnly && setHover(star)}
            onMouseLeave={() => !readOnly && setHover(null)}
          >
            <StarIcon
              className={cn(
                'h-5 w-5 transition-colors',
                star <= shown ? 'fill-primary text-primary' : 'fill-transparent text-muted-foreground',
              )}
            />
          </button>
        );
      })}
    </div>
  );
}

export { Rating };
