// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { ChatMessage, ChatThread, isScrolledNearBottom } from './chat-message';
import { PromptInput } from './prompt-input';
import { StreamingText, ThinkingIndicator } from './streaming-text';
import { AIOutputLabel } from './ai-output-label';
import { AIFeedback } from './ai-feedback';

describe('ChatMessage', () => {
  it('marks role via data-role and renders the footer slot', () => {
    render(
      <ChatMessage from="assistant" footer={<span>label</span>}>
        hi
      </ChatMessage>,
    );
    expect(document.querySelector('[data-role="assistant"]')).toBeInTheDocument();
    expect(screen.getByText('label')).toBeInTheDocument();
  });
  it('ChatThread is an accessible live log', () => {
    render(<ChatThread><div>x</div></ChatThread>);
    const log = screen.getByRole('log');
    expect(log).toHaveAttribute('aria-live', 'polite');
  });
  it('ChatThread auto-scrolls to bottom on mount and whenever its content changes', () => {
    const scrollIntoViewMock = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoViewMock;
    const { rerender } = render(
      <ChatThread>
        <div>first</div>
      </ChatThread>,
    );
    expect(scrollIntoViewMock).toHaveBeenCalledTimes(1);

    // A new turn (or a streamed token appending to the last turn) re-renders
    // ChatThread with different children — it must scroll again, not just once.
    rerender(
      <ChatThread>
        <div>first</div>
        <div>second</div>
      </ChatThread>,
    );
    expect(scrollIntoViewMock).toHaveBeenCalledTimes(2);
  });

  // jsdom has no layout engine — scrollHeight/clientHeight/scrollTop are
  // always 0, so "near bottom" is trivially true for every element and a
  // naive test would pass whether or not the stick-to-bottom logic actually
  // reads those metrics. These tests stub the three metrics as own
  // properties on the log element (shadowing jsdom's read-only getters) to
  // exercise the real branch logic.
  it('does not auto-scroll on new content once the user has scrolled away from the bottom', () => {
    const scrollIntoViewMock = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoViewMock;
    const { rerender } = render(
      <ChatThread>
        <div>first</div>
      </ChatThread>,
    );
    expect(scrollIntoViewMock).toHaveBeenCalledTimes(1); // initial mount still scrolls

    const log = screen.getByRole('log');
    Object.defineProperty(log, 'scrollHeight', { value: 1000, configurable: true });
    Object.defineProperty(log, 'clientHeight', { value: 300, configurable: true });
    Object.defineProperty(log, 'scrollTop', { value: 100, configurable: true }); // distance = 600 → far
    fireEvent.scroll(log);

    scrollIntoViewMock.mockClear();
    rerender(
      <ChatThread>
        <div>first</div>
        <div>second</div>
      </ChatThread>,
    );
    expect(scrollIntoViewMock).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: /nuevos mensajes/i })).toBeInTheDocument();
  });

  it('resumes auto-scroll once the user scrolls back near the bottom', () => {
    const scrollIntoViewMock = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoViewMock;
    const { rerender } = render(
      <ChatThread>
        <div>first</div>
      </ChatThread>,
    );
    const log = screen.getByRole('log');
    Object.defineProperty(log, 'scrollHeight', { value: 1000, configurable: true });
    Object.defineProperty(log, 'clientHeight', { value: 300, configurable: true });
    Object.defineProperty(log, 'scrollTop', { value: 100, configurable: true }); // far from bottom
    fireEvent.scroll(log);
    scrollIntoViewMock.mockClear();
    rerender(
      <ChatThread>
        <div>first</div>
        <div>second</div>
      </ChatThread>,
    );
    expect(scrollIntoViewMock).not.toHaveBeenCalled();

    // User scrolls back down.
    Object.defineProperty(log, 'scrollTop', { value: 650, configurable: true }); // distance = 50 → near
    fireEvent.scroll(log);
    expect(screen.queryByRole('button', { name: /nuevos mensajes/i })).not.toBeInTheDocument();

    scrollIntoViewMock.mockClear();
    rerender(
      <ChatThread>
        <div>first</div>
        <div>second</div>
        <div>third</div>
      </ChatThread>,
    );
    expect(scrollIntoViewMock).toHaveBeenCalledTimes(1);
  });

  it('the "jump to bottom" affordance scrolls down and clears itself', async () => {
    const scrollIntoViewMock = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoViewMock;
    const user = userEvent.setup();
    render(
      <ChatThread>
        <div>first</div>
      </ChatThread>,
    );
    const log = screen.getByRole('log');
    Object.defineProperty(log, 'scrollHeight', { value: 1000, configurable: true });
    Object.defineProperty(log, 'clientHeight', { value: 300, configurable: true });
    Object.defineProperty(log, 'scrollTop', { value: 100, configurable: true });
    fireEvent.scroll(log);

    const jumpButton = screen.getByRole('button', { name: /nuevos mensajes/i });
    scrollIntoViewMock.mockClear();
    await user.click(jumpButton);
    expect(scrollIntoViewMock).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('button', { name: /nuevos mensajes/i })).not.toBeInTheDocument();
  });
});

describe('isScrolledNearBottom — pure predicate, exercised without jsdom layout', () => {
  it('is true when the scroll offset is within the threshold of the bottom', () => {
    expect(isScrolledNearBottom({ scrollHeight: 1000, scrollTop: 900, clientHeight: 100 })).toBe(true); // 0px away
    expect(
      isScrolledNearBottom({ scrollHeight: 1000, scrollTop: 800, clientHeight: 100 }, 120),
    ).toBe(true); // 100px away, threshold 120
  });
  it('is false once the user has scrolled well away from the bottom', () => {
    expect(isScrolledNearBottom({ scrollHeight: 1000, scrollTop: 400, clientHeight: 100 })).toBe(false); // 500px away
  });
  it('respects a custom threshold', () => {
    expect(
      isScrolledNearBottom({ scrollHeight: 1000, scrollTop: 850, clientHeight: 100 }, 25),
    ).toBe(false); // 50px away, threshold 25
  });
});

describe('PromptInput', () => {
  it('Enter submits, Shift+Enter does not', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<PromptInput value="hello" onValueChange={() => {}} onSubmit={onSubmit} />);
    const ta = screen.getByLabelText('Prompt');
    ta.focus();
    await user.keyboard('{Enter}');
    expect(onSubmit).toHaveBeenCalledTimes(1);
    await user.keyboard('{Shift>}{Enter}{/Shift}');
    expect(onSubmit).toHaveBeenCalledTimes(1); // unchanged
  });
  it('shows Stop (not Send) while streaming and blocks Enter submit', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<PromptInput value="x" onValueChange={() => {}} onSubmit={onSubmit} streaming onStop={() => {}} />);
    expect(screen.getByLabelText('Stop generating')).toBeInTheDocument();
    expect(screen.queryByLabelText('Send')).not.toBeInTheDocument();
    screen.getByLabelText('Prompt').focus();
    await user.keyboard('{Enter}');
    expect(onSubmit).not.toHaveBeenCalled();
  });
  it('Send is disabled for empty input', () => {
    render(<PromptInput value="   " onValueChange={() => {}} onSubmit={() => {}} />);
    expect(screen.getByLabelText('Send')).toBeDisabled();
  });
});

describe('StreamingText + ThinkingIndicator', () => {
  it('renders the thinking indicator when streaming with no text yet', () => {
    render(<StreamingText text="" streaming />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
  it('renders text once it arrives', () => {
    render(<StreamingText text="partial answer" streaming />);
    expect(screen.getByText(/partial answer/)).toBeInTheDocument();
  });
  it('ThinkingIndicator exposes an accessible label', () => {
    render(<ThinkingIndicator label="Working" />);
    expect(screen.getByRole('status', { name: 'Working' })).toBeInTheDocument();
  });
});

describe('AIOutputLabel — disclosure is mandatory', () => {
  it('always discloses AI origin + a verify nudge', () => {
    render(<AIOutputLabel />);
    expect(screen.getByText(/Generado por IA/)).toBeInTheDocument();
    expect(screen.getByText(/verifica antes de actuar/)).toBeInTheDocument();
  });
  it('escalates copy on low confidence', () => {
    render(<AIOutputLabel confidence="low" />);
    expect(screen.getByText(/Confianza baja/)).toBeInTheDocument();
  });
});

describe('AIFeedback', () => {
  it('up-vote submits immediately', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<AIFeedback onSubmit={onSubmit} />);
    await user.click(screen.getByLabelText('Respuesta útil'));
    expect(onSubmit).toHaveBeenCalledWith('up');
    expect(screen.getByText(/Gracias/)).toBeInTheDocument();
  });
  it('down-vote reveals a reason box and submits the reason', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<AIFeedback onSubmit={onSubmit} />);
    await user.click(screen.getByLabelText('Respuesta no útil'));
    const box = screen.getByLabelText('Qué salió mal');
    await user.type(box, 'wrong category');
    await user.click(screen.getByRole('button', { name: 'Enviar' }));
    expect(onSubmit).toHaveBeenCalledWith('down', 'wrong category');
  });
});
