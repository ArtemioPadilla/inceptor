import * as React from 'react';
import { CheckIcon, CopyIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button, type ButtonProps } from '@/components/ui/button';

// ClipboardButton — copy-to-clipboard icon button with a copy → check swap
// for `resetAfter` ms after a successful write (ROADMAP Epic 21).
export interface ClipboardButtonProps extends Omit<ButtonProps, 'onClick' | 'onCopy' | 'children'> {
  /** The text copied to the clipboard on click. */
  value: string;
  /** Milliseconds the "copied" state stays visible before reverting. @default 2000 */
  resetAfter?: number;
  /** Fired after a successful `navigator.clipboard.writeText`. */
  onCopied?: (value: string) => void;
  /** Accessible label. @default 'Copy to clipboard' */
  label?: string;
}

const ClipboardButton = React.forwardRef<HTMLButtonElement, ClipboardButtonProps>(
  (
    {
      value,
      resetAfter = 2000,
      onCopied,
      label = 'Copy to clipboard',
      className,
      variant = 'outline',
      size = 'icon',
      ...props
    },
    ref,
  ) => {
    const [copied, setCopied] = React.useState(false);
    const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    // Single timeout, cleared on unmount — see CLAUDE.md island lifecycle rules.
    React.useEffect(() => () => clearTimeout(timeoutRef.current), []);

    const handleClick = React.useCallback(async () => {
      try {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        onCopied?.(value);
        clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => setCopied(false), resetAfter);
      } catch {
        // Clipboard API unavailable (insecure context / permission denied) —
        // fail silently; the icon simply never flips to the "copied" state.
      }
    }, [value, resetAfter, onCopied]);

    return (
      <Button
        ref={ref}
        type="button"
        variant={variant}
        size={size}
        className={cn(className)}
        onClick={handleClick}
        aria-label={copied ? 'Copied' : label}
        {...props}
      >
        {copied ? <CheckIcon className="size-4" /> : <CopyIcon className="size-4" />}
      </Button>
    );
  },
);
ClipboardButton.displayName = 'ClipboardButton';

export { ClipboardButton };
