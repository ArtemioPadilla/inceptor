import * as React from 'react';
import { Dialog as BaseDialog } from '@base-ui-components/react/dialog';
import { SearchIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Kbd } from '@/components/ui/kbd';

// Command palette (⌘K) — a searchable action launcher built on Base UI Dialog
// with a manually-filtered list. Opens on ⌘K / Ctrl+K, or control externally.
export interface CommandItem {
  label: string;
  hint?: string;
  onSelect?: () => void;
}

interface CommandPaletteProps {
  items: CommandItem[];
  placeholder?: string;
  /** Register the global ⌘K / Ctrl+K shortcut. Default true. */
  shortcut?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

function CommandPalette({
  items,
  placeholder = 'Type a command or search…',
  shortcut = true,
  open: controlledOpen,
  onOpenChange,
}: CommandPaletteProps) {
  const [uncontrolled, setUncontrolled] = React.useState(false);
  const open = controlledOpen ?? uncontrolled;
  const setOpen = onOpenChange ?? setUncontrolled;
  const [query, setQuery] = React.useState('');

  React.useEffect(() => {
    if (!shortcut) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen(!open);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, shortcut, setOpen]);

  const filtered = query
    ? items.filter((i) => i.label.toLowerCase().includes(query.toLowerCase()))
    : items;

  return (
    <BaseDialog.Root open={open} onOpenChange={setOpen}>
      <BaseDialog.Portal>
        <BaseDialog.Backdrop className="fixed inset-0 z-50 bg-black/60 transition-opacity data-[starting-style]:opacity-0 data-[ending-style]:opacity-0" />
        <BaseDialog.Popup
          className={cn(
            'fixed left-1/2 top-[20%] z-50 w-full max-w-lg -translate-x-1/2 overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-2xl',
            'transition-[transform,opacity] data-[starting-style]:opacity-0 data-[starting-style]:scale-95 data-[ending-style]:opacity-0 data-[ending-style]:scale-95',
          )}
        >
          <div className="flex items-center gap-2 border-b border-border px-3">
            <SearchIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
            {/* eslint-disable-next-line jsx-a11y/no-autofocus */}
            <input
              autoFocus
              aria-label="Search commands"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholder}
              className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset rounded-md"
            />
            <Kbd>esc</Kbd>
          </div>
          <ul aria-label="Commands" className="max-h-80 overflow-y-auto p-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-6 text-center text-sm text-muted-foreground">No results.</li>
            ) : (
              filtered.map((item) => (
                <li key={item.label}>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm outline-none hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent"
                    onClick={() => {
                      item.onSelect?.();
                      setOpen(false);
                      setQuery('');
                    }}
                  >
                    {item.label}
                    {item.hint && <span className="font-mono text-xs text-muted-foreground">{item.hint}</span>}
                  </button>
                </li>
              ))
            )}
          </ul>
        </BaseDialog.Popup>
      </BaseDialog.Portal>
    </BaseDialog.Root>
  );
}

export { CommandPalette };
