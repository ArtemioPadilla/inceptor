import * as React from 'react';
import { InfoIcon, CheckCircleIcon, AlertTriangleIcon, XCircleIcon, XIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Flashbar — stacked, dismissible PAGE-LEVEL notifications (Cloudscape gap
 * roadmap Epic C). Distinct from Toast: a flash persists at the top of the
 * content region until dismissed (or the action resolves it), rather than
 * auto-expiring. Use it for "save failed, here's why" / "3 items deleted".
 */
export type FlashType = 'info' | 'success' | 'warning' | 'error';

export interface FlashItem {
  id: string;
  type: FlashType;
  content: React.ReactNode;
  /** Show the dismiss button. Defaults to true. */
  dismissible?: boolean;
  /** Optional inline action (e.g. Retry, Undo). */
  action?: { label: string; onClick: () => void };
}

const STYLES: Record<FlashType, { box: string; Icon: typeof InfoIcon }> = {
  info: { box: 'border-primary/30 bg-primary/10 text-foreground', Icon: InfoIcon },
  success: { box: 'border-green-500/40 bg-green-500/10 text-foreground', Icon: CheckCircleIcon },
  warning: { box: 'border-yellow-500/40 bg-yellow-500/10 text-foreground', Icon: AlertTriangleIcon },
  error: { box: 'border-destructive/40 bg-destructive/10 text-foreground', Icon: XCircleIcon },
};

const ROLE: Record<FlashType, 'status' | 'alert'> = {
  info: 'status',
  success: 'status',
  warning: 'alert',
  error: 'alert',
};

export interface FlashbarProps {
  items: FlashItem[];
  onDismiss?: (id: string) => void;
  className?: string;
}

export function Flashbar({ items, onDismiss, className }: FlashbarProps) {
  if (items.length === 0) return null;
  return (
    <div className={cn('flex flex-col gap-2', className)} aria-label="Notifications">
      {items.map((item) => {
        const { box, Icon } = STYLES[item.type];
        const dismissible = item.dismissible ?? true;
        return (
          <div
            key={item.id}
            role={ROLE[item.type]}
            className={cn('flex items-start gap-3 rounded-md border px-4 py-3 text-sm', box)}
          >
            <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <div className="flex-1">{item.content}</div>
            {item.action && (
              <button
                type="button"
                onClick={item.action.onClick}
                className="shrink-0 rounded-md px-2 py-0.5 text-xs font-medium underline underline-offset-2 hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {item.action.label}
              </button>
            )}
            {dismissible && (
              <button
                type="button"
                aria-label="Dismiss notification"
                onClick={() => onDismiss?.(item.id)}
                className="shrink-0 rounded-md p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <XIcon className="h-4 w-4" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
