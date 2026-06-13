import * as React from 'react';
import ErrorBoundary from './ErrorBoundary';
import { ChatThread, ChatMessage, type ChatRole } from '@/components/ui/ai/chat-message';
import { PromptInput } from '@/components/ui/ai/prompt-input';
import { StreamingText } from '@/components/ui/ai/streaming-text';
import { AIOutputLabel } from '@/components/ui/ai/ai-output-label';
import { AIFeedback } from '@/components/ui/ai/ai-feedback';
import { buildIssueUrl } from '@/lib/report-issue';

interface Turn {
  id: number;
  role: ChatRole;
  text: string;
}

// Canned responses — this demo has no backend; it shows the FULL AI-surface
// composition (streaming, disclosure, feedback) against a deterministic mock
// so the pattern is legible without an API key.
const CANNED = [
  'Tu mayor gasto este mes es Comida (38%). Transporte va segundo con 22%.',
  'Claro: un presupuesto 50/30/20 sobre tus ingresos dejaría ~$4,200 para gastos discrecionales.',
  'Detecté un cargo de $1,800 en "SUSCRIPCIÓN PREMIUM" que no aparecía en meses anteriores.',
];

export default function AIChatDemo() {
  const [turns, setTurns] = React.useState<Turn[]>([
    { id: 0, role: 'assistant', text: '¡Hola! Pregúntame sobre tus gastos. (Demo con respuestas simuladas.)' },
  ]);
  const [value, setValue] = React.useState('');
  const [streaming, setStreaming] = React.useState(false);
  const [partial, setPartial] = React.useState('');
  const nextId = React.useRef(1);
  const timer = React.useRef<ReturnType<typeof setInterval> | null>(null);

  React.useEffect(() => () => { if (timer.current) clearInterval(timer.current); }, []);

  function send() {
    const q = value.trim();
    if (!q || streaming) return;
    const userTurn: Turn = { id: nextId.current++, role: 'user', text: q };
    setTurns((t) => [...t, userTurn]);
    setValue('');

    // Simulate a token stream of one canned reply.
    const reply = CANNED[(nextId.current - 2) % CANNED.length] ?? CANNED[0]!;
    const words = reply.split(' ');
    let i = 0;
    setStreaming(true);
    setPartial('');
    timer.current = setInterval(() => {
      i += 1;
      setPartial(words.slice(0, i).join(' '));
      if (i >= words.length) {
        if (timer.current) clearInterval(timer.current);
        setStreaming(false);
        setPartial('');
        setTurns((t) => [...t, { id: nextId.current++, role: 'assistant', text: reply }]);
      }
    }, 80);
  }

  function stop() {
    if (timer.current) clearInterval(timer.current);
    setStreaming(false);
    if (partial) setTurns((t) => [...t, { id: nextId.current++, role: 'assistant', text: partial }]);
    setPartial('');
  }

  // Down-votes route to the same prefilled-GitHub-issue path the FeedbackFAB uses.
  function onFeedback(vote: 'up' | 'down', reason?: string) {
    if (vote === 'down' && typeof window !== 'undefined') {
      const url = buildIssueUrl({
        title: 'AI response flagged as unhelpful',
        body: `A user thumbed-down an AI response.\n\nReason: ${reason ?? '(none given)'}\n\nURL: ${window.location.href}`,
        labels: ['bug'],
      });
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }

  return (
    <ErrorBoundary name="AIChatDemo">
      <div className="mx-auto flex h-[70vh] max-w-2xl flex-col rounded-xl border border-border">
        <ChatThread className="flex-1 overflow-y-auto p-4">
          {turns.map((t) => (
            <ChatMessage
              key={t.id}
              from={t.role}
              footer={
                t.role === 'assistant' && t.id > 0 ? (
                  <div className="space-y-1.5">
                    <AIOutputLabel source="demo (mock)" />
                    <AIFeedback onSubmit={onFeedback} />
                  </div>
                ) : undefined
              }
            >
              {t.text}
            </ChatMessage>
          ))}
          {streaming && (
            <ChatMessage from="assistant">
              <StreamingText text={partial} streaming />
            </ChatMessage>
          )}
        </ChatThread>
        <div className="border-t border-border p-3">
          <PromptInput
            value={value}
            onValueChange={setValue}
            onSubmit={send}
            streaming={streaming}
            onStop={stop}
            placeholder="Pregunta sobre tus gastos…"
          />
        </div>
      </div>
    </ErrorBoundary>
  );
}
