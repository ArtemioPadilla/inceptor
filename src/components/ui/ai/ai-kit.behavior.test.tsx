// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { ChatMessage, ChatThread } from './chat-message';
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
