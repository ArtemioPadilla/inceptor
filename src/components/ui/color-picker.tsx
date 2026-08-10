import * as React from 'react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

// ColorPicker — a swatch trigger that opens a Popover with a native
// `<input type="color">` (theming/branding admin screens; ROADMAP Epic 21).
// The native color input gives every browser's own picker UI for free; the
// hex text field underneath is for exact/copy-pasted values. Base UI's
// Popover does all the anchoring/portal/focus-trap work.
const HEX_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export interface ColorPickerProps {
  /** Hex color string, e.g. "#10b981". Controlled — pair with `onValueChange`. */
  value?: string;
  defaultValue?: string;
  onValueChange?: (hex: string) => void;
  disabled?: boolean;
  className?: string;
}

function ColorPicker({
  value,
  defaultValue = '#000000',
  onValueChange,
  disabled,
  className,
}: ColorPickerProps) {
  const hexFieldId = React.useId();
  const [internalValue, setInternalValue] = React.useState(defaultValue);
  const isControlled = value !== undefined;
  const color = isControlled ? value : internalValue;
  const [hexDraft, setHexDraft] = React.useState(color);

  // Keep the free-text hex field in sync when the color changes from
  // outside the field itself (native picker, or a controlled prop update).
  React.useEffect(() => {
    setHexDraft(color);
  }, [color]);

  const commit = React.useCallback(
    (next: string) => {
      if (!isControlled) setInternalValue(next);
      onValueChange?.(next);
    },
    [isControlled, onValueChange],
  );

  const commitHexDraft = () => {
    if (HEX_RE.test(hexDraft)) commit(hexDraft);
    else setHexDraft(color); // Invalid hex — revert instead of propagating garbage.
  };

  return (
    <Popover>
      <PopoverTrigger
        disabled={disabled}
        render={<Button type="button" variant="outline" className={cn('w-[160px] justify-start gap-2', className)} />}
      >
        <span
          aria-hidden="true"
          className="size-4 shrink-0 rounded-sm border border-border"
          style={{ backgroundColor: HEX_RE.test(color) ? color : undefined }}
        />
        <span className="truncate font-mono text-xs uppercase">{color}</span>
      </PopoverTrigger>
      <PopoverContent className="w-56 space-y-3">
        <input
          type="color"
          aria-label="Pick a color"
          value={HEX_RE.test(color) ? color : '#000000'}
          onChange={(e) => commit(e.target.value)}
          className="h-10 w-full cursor-pointer rounded-md border border-input bg-background p-1"
        />
        <div className="space-y-1">
          <Label htmlFor={hexFieldId} className="text-xs text-muted-foreground">
            Hex
          </Label>
          <Input
            id={hexFieldId}
            value={hexDraft}
            onChange={(e) => setHexDraft(e.target.value)}
            onBlur={commitHexDraft}
            onKeyDown={(e) => {
              if (e.key === 'Enter') e.currentTarget.blur();
            }}
            className="font-mono"
            spellCheck={false}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
ColorPicker.displayName = 'ColorPicker';

export { ColorPicker };
