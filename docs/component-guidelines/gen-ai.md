# Generative AI

`gallery.ts` category: `gen-ai` — the agent-native UI kit under
`src/components/ui/ai/`: chat thread, prompt input, streaming/thinking
states, `AIOutputLabel` (disclosure), and response feedback. **Coverage in
this file: PromptInput and ChatMessage/ChatThread.**

---

## PromptInput

Source: [`src/components/ui/ai/prompt-input.tsx`](../../src/components/ui/ai/prompt-input.tsx)

**Purpose**: Auto-growing textarea + send/stop control, purpose-built for
chat-style prompt entry.

**When to use**: The text-entry surface for any AI chat/prompt UI. It's
**not** a generic multiline text field — it hardcodes the Enter-submits /
Shift+Enter-newline convention and a Send↔Stop button swap tied to a
`streaming` flag, both specific to chat UX.

**API overview**:

```tsx
interface PromptInputProps {
  value: string;
  onValueChange: (v: string) => void;
  onSubmit: () => void;
  streaming?: boolean;   // default false — flips Send button to Stop, blocks Enter-submit
  onStop?: () => void;
  placeholder?: string;  // default 'Ask anything…'
  disabled?: boolean;
  className?: string;
}
```

- Fully controlled — you own `value` and must update it in `onValueChange`.
- `onSubmit` fires on Enter (without Shift) **or** clicking Send — it does
  **not** clear `value` for you; the caller resets `value` after handling
  the submission.
- While `streaming` is `true`: Enter is ignored (`handleKeyDown` early-
  returns) and the button renders as Stop (calls `onStop`) instead of Send —
  this is how the component prevents a second submission mid-generation.
- The textarea auto-grows on every `value` change up to a 200px cap
  (`Math.min(el.scrollHeight, 200)`), then becomes internally scrollable.

**Common mistakes**:

- Forgetting to pass `streaming` while a response is generating — without
  it, the user can submit a second prompt mid-stream (the component has no
  other guard against concurrent submissions).
- Expecting `onSubmit` to clear the input — it doesn't; clear `value`
  yourself in your submit handler (typically alongside adding the user's
  message to your chat state).
- Passing multiline default text expecting a taller initial box — `rows={1}`
  is hardcoded; height only grows in response to `scrollHeight` after a
  value change, so an initial multi-line `value` prop needs the `useEffect`
  to fire once (it does, on mount, since it runs on every `value` including
  the initial one) — but pre-sized static styling isn't supported.

---

## ChatMessage / ChatThread

Source: [`src/components/ui/ai/chat-message.tsx`](../../src/components/ui/ai/chat-message.tsx)

**Purpose**: `ChatMessage` renders one conversation turn styled by role
(`user` right-aligned/primary-colored, `assistant` left-aligned/muted with an
"AI" badge). `ChatThread` is the scrollable, auto-scrolling container with
`role="log"` + `aria-live="polite"` wiring for screen readers.

**When to use**: Any chat-style conversation surface. `ChatThread` should
wrap every `ChatMessage` in the conversation — don't render `ChatMessage`s
directly inside an arbitrary `<div>` if you want auto-scroll-to-bottom and
correct live-region announcement behavior.

**API overview**:

```tsx
type ChatRole = 'user' | 'assistant';

interface ChatMessageProps {
  from: ChatRole;      // named `from`, not `role` — don't confuse with the DOM aria role
  children: React.ReactNode;
  footer?: React.ReactNode;  // typically <AIOutputLabel> or <AIFeedback> on assistant turns
  className?: string;
}

// Container:
<ChatThread label="Conversation">  {/* label defaults to 'Conversation' */}
  <ChatMessage from="user">...</ChatMessage>
  <ChatMessage from="assistant" footer={<AIOutputLabel />}>...</ChatMessage>
</ChatThread>
```

- `ChatThread` applies `className="overflow-y-auto"` **on your own wrapping
  element**, not internally — the auto-scroll effect calls
  `scrollIntoView({ block: 'end' })` on a sentinel div, which scrolls the
  nearest scrollable ancestor; if nothing in the ancestry is scrollable,
  nothing visibly scrolls. Give the element that should scroll (often
  `ChatThread` itself) an explicit height + `overflow-y-auto`.
- The auto-scroll effect (a render-effect with **no dependency array**, so it
  re-evaluates on every render — new turn or streamed-token append) only
  calls `scrollIntoView` **when the user was already near the bottom**
  (`isScrolledNearBottom`, a `NEAR_BOTTOM_THRESHOLD_PX = 120` check driven by
  a `scroll` listener). If they've scrolled up to re-read history, it does
  **not** yank them back down — instead `ChatThread` shows a "Nuevos
  mensajes ↓" jump-to-bottom button (`showJumpToBottom` state) that snaps
  back to the bottom on click. It also deliberately skips `behavior:
  'smooth'`, because a smooth-scroll animation queued every ~80ms during
  streaming visibly stutters instead of tracking the last line. Don't
  "simplify" this by removing the near-bottom gate or re-adding smooth
  scrolling without re-reading the comments in `chat-message.tsx` first —
  both were deliberate fixes for real reported bugs.
- `ChatThread` takes an optional `scrollFade?: boolean` prop (default
  `true`) that applies the `scroll-fade-y` utility — a top/bottom gradient
  mask signaling "more content above/below".
- `footer` is a generic `ReactNode` slot, not typed to a specific component —
  conventionally `<AIOutputLabel>` (disclosure), `<AIFeedback>`
  (thumbs up/down), or `<CitationList>` (source attribution, below), but
  nothing enforces that.

**Common mistakes**:

- Using `role` instead of `from` as the prop name when porting examples —
  the prop is deliberately named `from` to avoid confusion with the DOM
  `role` attribute; `role` is not a valid prop on this component.
- Expecting `ChatThread` to virtualize long conversations — it doesn't; every
  `ChatMessage` renders in full. For very long histories, virtualization
  would need to be layered on separately (not currently implemented
  anywhere in this kit).
- Forgetting the scrollable-ancestor requirement above and filing a "auto-
  scroll doesn't work" bug — check `overflow-y-auto` + a bounded height
  exists somewhere between the sentinel and the nearest fixed-size ancestor
  first.
- Assuming the thread always scrolls to new content — it only does when the
  reader was already near the bottom; if a bug report says "doesn't
  auto-scroll," first check whether the user (or the test) had scrolled up,
  since that's the documented not-scrolling case, not a regression.

## Citation / CitationRef / CitationList (`src/components/ui/ai/citation.tsx`)

**Purpose**: source-attribution for AI answers — an inline numbered marker
next to a claim, paired with a footer list of sources. Presentation only, no
citation-matching logic.

**API overview**:

```tsx
interface CitationSource {
  label: string;   // e.g. "Estado de cuenta — agosto 2026"
  url?: string;     // renders as plain text when absent
}

<CitationRef index={1} />                              {/* inline "[1]" marker, purely visual */}
<CitationList sources={[{ label, url }, ...]} />        {/* footer <ol>, pass as ChatMessage's footer */}
```

`CitationList` returns `null` for an empty `sources` array. Numbering is the
caller's responsibility — `CitationRef`'s `index` and `CitationList`'s array
order must be kept in sync manually; neither component cross-references the
other at runtime.

**Common mistakes**:

- Expecting `CitationRef`/`CitationList` to auto-number or auto-match claims
  to sources — there is no matching logic; the caller decides which claim
  gets which `index`.
- Forgetting `CitationList` is meant to go in `ChatMessage`'s `footer` slot
  (alongside or instead of `<AIOutputLabel>`/`<AIFeedback>`), not as a
  standalone block outside the message bubble.
