import * as React from 'react';
import { ClockIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

// TimePicker — a text-style "HH:MM" (24h) input, composable next to
// DatePicker for a combined date+time field but shippable standalone
// (ROADMAP Epic 21). Deliberately no seconds, no timezone handling — this
// wraps the native `<input type="time">` for free keyboard/SR support and
// step={60} to keep the granularity at whole minutes.
export interface TimePickerProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'defaultValue' | 'onChange'> {
  /** "HH:MM" 24h string. Controlled — pair with `onValueChange`. */
  value?: string;
  /** "HH:MM" 24h string. Uncontrolled initial value. */
  defaultValue?: string;
  onValueChange?: (time: string) => void;
}

const TimePicker = React.forwardRef<HTMLInputElement, TimePickerProps>(
  ({ className, value, defaultValue, onValueChange, ...props }, ref) => {
    const isControlled = value !== undefined;

    return (
      <div className="relative">
        <ClockIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          ref={ref}
          type="time"
          step={60}
          {...(isControlled ? { value } : { defaultValue })}
          onChange={(e) => onValueChange?.(e.target.value)}
          className={cn(
            'flex h-10 w-full rounded-md border border-input bg-background py-2 pl-9 pr-3 text-base',
            'ring-offset-background placeholder:text-muted-foreground',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
            className,
          )}
          {...props}
        />
      </div>
    );
  },
);
TimePicker.displayName = 'TimePicker';

export { TimePicker };
