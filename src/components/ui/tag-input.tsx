import * as React from 'react';
import { XIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

// TagInput — multi-value entry (labels, recipients). Dependency-free; Enter or
// comma adds a tag, Backspace on empty removes the last.
interface TagInputProps {
  value: string[];
  onValueChange: (value: string[]) => void;
  placeholder?: string;
  className?: string;
}

function TagInput({ value, onValueChange, placeholder, className }: TagInputProps) {
  const [draft, setDraft] = React.useState('');

  const add = (raw: string) => {
    const t = raw.trim().replace(/,$/, '').trim();
    if (t && !value.includes(t)) onValueChange([...value, t]);
    setDraft('');
  };

  return (
    <div
      className={cn(
        'flex min-h-10 w-full flex-wrap items-center gap-1.5 rounded-md border border-input bg-background px-2 py-1.5 text-sm focus-within:ring-2 focus-within:ring-ring',
        className,
      )}
    >
      {value.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 rounded bg-secondary px-2 py-0.5 text-xs text-secondary-foreground"
        >
          {tag}
          <button
            type="button"
            aria-label={`Remove ${tag}`}
            className="text-muted-foreground hover:text-foreground"
            onClick={() => onValueChange(value.filter((t) => t !== tag))}
          >
            <XIcon className="h-3 w-3" />
          </button>
        </span>
      ))}
      <input
        aria-label="Add item"
        value={draft}
        placeholder={value.length === 0 ? placeholder : undefined}
        className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
        onChange={(e) => {
          if (e.target.value.endsWith(',')) add(e.target.value);
          else setDraft(e.target.value);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && draft.trim()) {
            e.preventDefault();
            add(draft);
          } else if (e.key === 'Backspace' && !draft && value.length) {
            onValueChange(value.slice(0, -1));
          }
        }}
      />
    </div>
  );
}

export { TagInput };
