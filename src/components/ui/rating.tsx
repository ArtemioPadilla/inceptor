import * as React from 'react';
import { StarIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

// Rating — a star rating control. Dependency-free; keyboard + hover support.
// Implements the radiogroup keyboard contract with roving tabindex:
//   - Only the currently selected star (or star #1 when value=0) has tabIndex=0.
//   - ArrowRight / ArrowDown advance selection; ArrowLeft / ArrowUp decrease it.
//   - Home jumps to 1; End jumps to max.
//   - readOnly uses aria-disabled + tabIndex=-1 so it remains in the a11y tree.
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

  // Roving tabindex: the "active" element in the group.
  // When no star is selected (value=0) the first star owns focus entry.
  const rovingIndex = value > 0 ? value : 1;

  const handleKeyDown = (e: React.KeyboardEvent, star: number) => {
    if (readOnly) return;
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowUp': {
        e.preventDefault();
        const next = Math.min(star + 1, max);
        onValueChange?.(next);
        break;
      }
      case 'ArrowLeft':
      case 'ArrowDown': {
        e.preventDefault();
        const prev = Math.max(star - 1, 1);
        onValueChange?.(prev);
        break;
      }
      case 'Home': {
        e.preventDefault();
        onValueChange?.(1);
        break;
      }
      case 'End': {
        e.preventDefault();
        onValueChange?.(max);
        break;
      }
    }
  };

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
            // readOnly: keep in a11y tree with aria-disabled (not disabled attribute,
            // which would remove the element from navigation entirely).
            aria-disabled={readOnly ? true : undefined}
            // Roving tabindex: only the active star (or first if none) is tab-reachable.
            // readOnly stars use -1 so screen-reader users can't tab into them individually.
            tabIndex={readOnly ? -1 : (star === rovingIndex ? 0 : -1)}
            className={cn(
              'rounded-sm p-0.5 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              !readOnly && 'cursor-pointer hover:scale-110',
              readOnly && 'cursor-default',
            )}
            onClick={() => {
              if (readOnly) return;
              onValueChange?.(star);
            }}
            onMouseEnter={() => !readOnly && setHover(star)}
            onMouseLeave={() => !readOnly && setHover(null)}
            onKeyDown={(e) => handleKeyDown(e, star)}
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
