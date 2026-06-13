// @vitest-environment jsdom
import * as React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WizardIsland from '../components/islands/WizardIsland';
import type { WizardStep } from '../components/islands/WizardIsland';

// Helper: render wizard with three default steps
function makeSteps(overrides: Partial<WizardStep>[] = []): WizardStep[] {
  return [
    { id: 'step1', title: 'Step One', ...overrides[0] },
    { id: 'step2', title: 'Step Two', ...overrides[1] },
    { id: 'step3', title: 'Step Three', ...overrides[2] },
  ];
}

function renderWizard(
  steps: WizardStep[],
  {
    onSubmit = vi.fn(),
    onCancel,
    children,
  }: {
    onSubmit?: () => Promise<void> | void;
    onCancel?: () => void;
    children?: (stepId: string) => React.ReactNode;
  } = {},
) {
  const childFn = children ?? ((id: string) => <div data-testid={`step-${id}`}>{id}</div>);
  return render(
    <WizardIsland steps={steps} onSubmit={onSubmit} onCancel={onCancel}>
      {childFn}
    </WizardIsland>,
  );
}

// ── Basic rendering ───────────────────────────────────────────────────────────

describe('WizardIsland — rendering', () => {
  it('renders the first step on mount', () => {
    renderWizard(makeSteps());
    expect(screen.getByTestId('step-step1')).toBeInTheDocument();
    expect(screen.queryByTestId('step-step2')).not.toBeInTheDocument();
  });

  it('renders the step title', () => {
    renderWizard(makeSteps());
    expect(screen.getByRole('heading', { name: 'Step One' })).toBeInTheDocument();
  });

  it('Back button is disabled on the first step', () => {
    renderWizard(makeSteps());
    const back = screen.getByRole('button', { name: /back/i });
    expect(back).toBeDisabled();
  });
});

// ── Step navigation ───────────────────────────────────────────────────────────

describe('WizardIsland — step navigation', () => {
  it('Next button advances to the next step', async () => {
    const user = userEvent.setup();
    renderWizard(makeSteps());

    await user.click(screen.getByRole('button', { name: /next/i }));
    expect(screen.getByTestId('step-step2')).toBeInTheDocument();
    expect(screen.queryByTestId('step-step1')).not.toBeInTheDocument();
  });

  it('Back button goes to the previous step', async () => {
    const user = userEvent.setup();
    renderWizard(makeSteps());

    // Go to step 2
    await user.click(screen.getByRole('button', { name: /next/i }));
    expect(screen.getByTestId('step-step2')).toBeInTheDocument();

    // Go back to step 1
    await user.click(screen.getByRole('button', { name: /back/i }));
    expect(screen.getByTestId('step-step1')).toBeInTheDocument();
  });

  it('Back button is disabled on the first step after going back', async () => {
    const user = userEvent.setup();
    renderWizard(makeSteps());

    await user.click(screen.getByRole('button', { name: /next/i }));
    await user.click(screen.getByRole('button', { name: /back/i }));
    expect(screen.getByRole('button', { name: /back/i })).toBeDisabled();
  });
});

// ── Validation ────────────────────────────────────────────────────────────────

describe('WizardIsland — validation', () => {
  it('blocks advancing when validate() returns false', async () => {
    const user = userEvent.setup();
    const steps = makeSteps([{ validate: () => false }]);
    renderWizard(steps);

    await user.click(screen.getByRole('button', { name: /next/i }));
    // Should still be on step1
    expect(screen.getByTestId('step-step1')).toBeInTheDocument();
    // Error alert should appear
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('shows custom error message when validate() returns a string', async () => {
    const user = userEvent.setup();
    const steps = makeSteps([{ validate: () => 'Custom error message' }]);
    renderWizard(steps);

    await user.click(screen.getByRole('button', { name: /next/i }));
    expect(screen.getByRole('alert')).toHaveTextContent('Custom error message');
  });

  it('allows advancing when validate() returns true', async () => {
    const user = userEvent.setup();
    const steps = makeSteps([{ validate: () => true }]);
    renderWizard(steps);

    await user.click(screen.getByRole('button', { name: /next/i }));
    expect(screen.getByTestId('step-step2')).toBeInTheDocument();
  });

  it('allows advancing when async validate() resolves to true', async () => {
    const user = userEvent.setup();
    const steps = makeSteps([{ validate: async () => true }]);
    renderWizard(steps);

    await user.click(screen.getByRole('button', { name: /next/i }));
    await waitFor(() => {
      expect(screen.getByTestId('step-step2')).toBeInTheDocument();
    });
  });
});

// ── Submit ────────────────────────────────────────────────────────────────────

describe('WizardIsland — onSubmit', () => {
  it('calls onSubmit on the final step', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const steps = makeSteps();
    renderWizard(steps, { onSubmit });

    // Navigate to last step
    await user.click(screen.getByRole('button', { name: /next/i }));
    await user.click(screen.getByRole('button', { name: /next/i }));

    // Should show Submit button now
    const submitBtn = screen.getByRole('button', { name: /submit/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledOnce();
    });
  });

  it('shows completion screen after successful submit', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    // Single-step wizard for simplicity
    const steps = [{ id: 's1', title: 'Only Step' }];
    renderWizard(steps, { onSubmit });

    await user.click(screen.getByRole('button', { name: /submit/i }));
    await waitFor(() => {
      expect(screen.getByText(/all done/i)).toBeInTheDocument();
    });
  });
});

// ── Conditional steps ─────────────────────────────────────────────────────────

describe('WizardIsland — conditional steps', () => {
  it('skips a step with condition={() => false}', async () => {
    const user = userEvent.setup();
    const steps: WizardStep[] = [
      { id: 'first', title: 'First' },
      { id: 'hidden', title: 'Hidden', condition: () => false },
      { id: 'last', title: 'Last' },
    ];
    renderWizard(steps);

    // First step rendered
    expect(screen.getByRole('heading', { name: 'First' })).toBeInTheDocument();

    // Next should skip "hidden" and go directly to "last"
    await user.click(screen.getByRole('button', { name: /next/i }));
    expect(screen.getByRole('heading', { name: 'Last' })).toBeInTheDocument();
  });
});

// ── Keyboard shortcut ─────────────────────────────────────────────────────────

describe('WizardIsland — keyboard shortcut', () => {
  it('Ctrl+Enter advances the wizard', async () => {
    renderWizard(makeSteps());

    // Dispatch Ctrl+Enter
    fireEvent.keyDown(document, { key: 'Enter', ctrlKey: true });

    await waitFor(() => {
      expect(screen.getByTestId('step-step2')).toBeInTheDocument();
    });
  });
});
