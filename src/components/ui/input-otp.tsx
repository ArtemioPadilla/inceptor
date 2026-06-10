import * as React from 'react';

import { cn } from '@/lib/utils';

// InputOTP — segmented one-time-password / PIN input. Dependency-free.
// Controlled: pass `value` (string) + `onValueChange`. Handles paste, arrows,
// backspace and auto-advance across `length` cells.
interface InputOTPProps {
  value: string;
  onValueChange: (value: string) => void;
  length?: number;
  className?: string;
}

function InputOTP({ value, onValueChange, length = 6, className }: InputOTPProps) {
  const refs = React.useRef<Array<HTMLInputElement | null>>([]);
  const chars = Array.from({ length }, (_, i) => value[i] ?? '');

  const setChar = (i: number, c: string) => {
    const next = chars.slice();
    next[i] = c.slice(-1);
    onValueChange(next.join('').slice(0, length));
    if (c && i < length - 1) refs.current[i + 1]?.focus();
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {chars.map((c, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          inputMode="numeric"
          maxLength={1}
          value={c}
          aria-label={`Digit ${i + 1}`}
          // First cell advertises one-time-code so password managers / SMS
          // autofill can inject the full OTP; remaining cells suppress autofill.
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          className="h-11 w-10 rounded-md border border-input bg-background text-center text-lg font-medium tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onChange={(e) => setChar(i, e.target.value)}
          onPaste={(e) => {
            e.preventDefault();
            const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
            if (pasted) {
              onValueChange(pasted);
              refs.current[Math.min(pasted.length, length - 1)]?.focus();
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Backspace' && !chars[i] && i > 0) refs.current[i - 1]?.focus();
            if (e.key === 'ArrowLeft' && i > 0) refs.current[i - 1]?.focus();
            if (e.key === 'ArrowRight' && i < length - 1) refs.current[i + 1]?.focus();
          }}
        />
      ))}
    </div>
  );
}

export { InputOTP };
