import * as React from 'react';
import ErrorBoundary from './ErrorBoundary';
import { ChatThread, ChatMessage } from '@/components/ui/ai/chat-message';
import { PromptInput } from '@/components/ui/ai/prompt-input';
import { StreamingText, ThinkingIndicator } from '@/components/ui/ai/streaming-text';
import { AIOutputLabel } from '@/components/ui/ai/ai-output-label';
import { AIFeedback } from '@/components/ui/ai/ai-feedback';

/**
 * Gallery showcase for the gen-AI UI kit (#204). Static composition of every
 * AI primitive — no network — so the gallery renders deterministically and
 * the visual snapshot is stable.
 */
export default function ShowcaseAI() {
  return (
    <ErrorBoundary name="ShowcaseAI">
      <div className="grid max-w-2xl gap-8">
        <section className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Chat thread</p>
          <ChatThread>
            <ChatMessage from="user">¿En qué se me va el dinero este mes?</ChatMessage>
            <ChatMessage
              from="assistant"
              footer={<AIOutputLabel source="Claude" />}
            >
              Tu mayor gasto es Comida (38%), seguido de Transporte (22%). Gastaste
              3.2× tu mediana en Entretenimiento esta semana.
            </ChatMessage>
            <ChatMessage from="assistant" footer={<AIFeedback onSubmit={() => {}} />}>
              ¿Quieres que te proponga un presupuesto?
            </ChatMessage>
          </ChatThread>
        </section>

        <section className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Streaming + thinking</p>
          <div className="rounded-lg border border-border p-4">
            <ThinkingIndicator />
            <div className="mt-3 text-sm">
              <StreamingText text="Analizando tus transacciones" streaming />
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Prompt input</p>
          <PromptInputDemo />
        </section>

        <section className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Output label — low confidence
          </p>
          <div className="rounded-lg border border-border p-4 text-sm">
            <p>No estoy seguro de esta categoría.</p>
            <AIOutputLabel confidence="low" className="mt-2" />
          </div>
        </section>
      </div>
    </ErrorBoundary>
  );
}

function PromptInputDemo() {
  const [value, setValue] = React.useState('');
  return (
    <PromptInput
      value={value}
      onValueChange={setValue}
      onSubmit={() => setValue('')}
      placeholder="Escribe un mensaje… (Enter envía, Shift+Enter salto de línea)"
    />
  );
}
