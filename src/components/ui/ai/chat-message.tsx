import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * ChatMessage — one turn in an AI conversation, styled by role.
 *
 * The agent-native UI kit (#204): Inceptor's identity is agent-orchestrated
 * development, so an honest chat surface is on-brand, not an afterthought.
 * Assistant turns are visually distinct and carry the `AIOutputLabel` slot
 * (passed as `footer`) so disclosure rides along with the content.
 */
export type ChatRole = 'user' | 'assistant';

export interface ChatMessageProps {
  /** Named `from` (not `role`) so it isn't mistaken for the DOM ARIA role. */
  from: ChatRole;
  children: React.ReactNode;
  /** Optional footer slot — typically <AIOutputLabel> or <AIFeedback> on assistant turns. */
  footer?: React.ReactNode;
  className?: string;
}

export function ChatMessage({ from, children, footer, className }: ChatMessageProps) {
  const isUser = from === 'user';
  return (
    <div
      className={cn('flex w-full gap-3', isUser ? 'justify-end' : 'justify-start', className)}
      data-role={from}
    >
      {!isUser && (
        <div
          aria-hidden="true"
          className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/15 font-mono text-[0.65rem] font-semibold text-primary"
        >
          AI
        </div>
      )}
      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
          isUser
            ? 'rounded-br-sm bg-primary text-primary-foreground'
            : 'rounded-bl-sm bg-muted text-foreground',
        )}
      >
        <div className="whitespace-pre-wrap break-words">{children}</div>
        {footer && <div className="mt-2">{footer}</div>}
      </div>
    </div>
  );
}

/** Vertical thread container with sensible spacing + an accessible live region. */
export function ChatThread({
  children,
  className,
  label = 'Conversation',
}: {
  children: React.ReactNode;
  className?: string;
  label?: string;
}) {
  return (
    <div
      role="log"
      aria-label={label}
      aria-live="polite"
      aria-relevant="additions text"
      className={cn('flex flex-col gap-4', className)}
    >
      {children}
    </div>
  );
}
