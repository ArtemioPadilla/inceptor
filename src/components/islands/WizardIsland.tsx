/**
 * WizardIsland — reusable multi-step wizard blueprint.
 *
 * Features:
 *   - Typed step contract: { id, title, description?, validate? }
 *   - Previous / Next / Submit controls with disabled / loading states
 *   - Optional step-level error summaries
 *   - Progress indicator and completion affordances
 *   - Linear and conditional step support (steps can be skipped)
 *   - Integrates with react-hook-form + zod for per-step validation
 *   - Keyboard accessibility: focus management between steps
 *   - Single-island composition for shared wizard state
 *
 * No @radix-ui, no framer-motion, no context API for cross-island state.
 *
 * Usage:
 *   <WizardIsland client:load
 *     steps={[
 *       { id: 'account', title: 'Account', validate: async () => trigger(['email']) },
 *       { id: 'plan', title: 'Plan' },
 *       { id: 'confirm', title: 'Confirm' },
 *     ]}
 *     onSubmit={async (stepData) => { ... }}
 *   >
 *     {(stepId) => <StepContent id={stepId} />}
 *   </WizardIsland>
 */

import * as React from 'react';
import { cn } from '@/lib/utils';
import ErrorBoundary from './ErrorBoundary';

// ── Types ─────────────────────────────────────────────────────────────────────

/** Typed step contract — every step in the wizard must conform to this. */
export interface WizardStep {
  /** Unique identifier for the step. Used as the key and for conditional skipping. */
  id: string;
  /** Displayed step title in the progress indicator and heading. */
  title: string;
  /** Optional subtitle shown below the title within the step. */
  description?: string;
  /**
   * Optional async validation gate. Return true to allow advancing; return
   * false (or a string error message) to block the transition and show an error.
   * Synchronous returns are also accepted.
   */
  validate?: () => boolean | string | Promise<boolean | string>;
  /**
   * When provided, this step is only shown if the predicate returns true.
   * Evaluated at navigation time against the current wizard data bag.
   */
  condition?: (data: Record<string, unknown>) => boolean;
}

export interface WizardIslandProps {
  /** Ordered list of steps. */
  steps: WizardStep[];
  /**
   * Render prop receiving the current step id and a setStepData callback.
   * Return the step's form/content.
   * Must be a function — not JSX — because it needs to re-evaluate on step change.
   *
   * @param stepId - The id of the currently active step.
   * @param setStepData - Merge data into the wizard data bag for the given step.
   */
  children: (stepId: string, setStepData: (stepId: string, data: Record<string, unknown>) => void) => React.ReactNode;
  /** Called with the accumulated data bag when Submit is clicked on the final step. */
  onSubmit?: (data: Record<string, unknown>) => Promise<void> | void;
  /** Called when the user exits/cancels the wizard. */
  onCancel?: () => void;
  /** Labels override (for i18n). */
  labels?: {
    back?: string;
    next?: string;
    submit?: string;
    cancel?: string;
    step?: string;
    of?: string;
    complete?: string;
  };
}

// ── Progress indicator ────────────────────────────────────────────────────────

function ProgressBar({
  total,
  current,
  steps,
}: {
  total: number;
  current: number;
  steps: WizardStep[];
}) {
  return (
    <nav aria-label="Wizard progress" className="mb-6">
      {/* Visual step list */}
      <ol className="flex items-center gap-0">
        {steps.map((step, index) => {
          const isDone = index < current;
          const isActive = index === current;
          return (
            <li
              key={step.id}
              className="flex items-center"
              aria-current={isActive ? 'step' : undefined}
            >
              {/* Step circle */}
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'flex size-7 items-center justify-center rounded-full text-xs font-semibold transition-colors',
                    isDone &&
                      'bg-primary text-primary-foreground',
                    isActive &&
                      'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2 ring-offset-background',
                    !isDone && !isActive &&
                      'bg-muted text-muted-foreground',
                  )}
                  aria-hidden="true"
                >
                  {isDone ? '✓' : index + 1}
                </div>
                <span
                  className={cn(
                    'mt-1 hidden text-xs sm:block max-w-[80px] text-center leading-tight',
                    isActive ? 'font-medium text-foreground' : 'text-muted-foreground',
                  )}
                >
                  {step.title}
                </span>
              </div>

              {/* Connector line (not after last) */}
              {index < total - 1 && (
                <div
                  aria-hidden="true"
                  className={cn(
                    'mx-1 h-0.5 flex-1 min-w-[24px] transition-colors',
                    index < current ? 'bg-primary' : 'bg-border',
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

// ── Completion screen ─────────────────────────────────────────────────────────

function CompletionScreen({ label }: { label: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center justify-center py-16 gap-4 text-center"
    >
      <div
        className="flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground text-3xl"
        aria-hidden="true"
      >
        ✓
      </div>
      <p className="text-lg font-semibold">{label}</p>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function WizardIsland(props: WizardIslandProps) {
  return (
    <ErrorBoundary name="WizardIsland">
      <WizardInner {...props} />
    </ErrorBoundary>
  );
}

function WizardInner({
  steps,
  children,
  onSubmit,
  onCancel,
  labels = {},
}: WizardIslandProps) {
  const {
    back = 'Back',
    next = 'Next',
    submit = 'Submit',
    cancel = 'Cancel',
    step: stepLabel = 'Step',
    of = 'of',
    complete: completeLabel = 'All done!',
  } = labels;

  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [stepError, setStepError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isComplete, setIsComplete] = React.useState(false);
  /** Accumulated data bag; each step can merge data into it via setStepData. */
  const [wizardData, setWizardData] = React.useState<Record<string, unknown>>({});

  /** Stable callback so steps can write their data into the bag. */
  const setStepData = React.useCallback((stepId: string, data: Record<string, unknown>) => {
    setWizardData((prev) => ({ ...prev, [stepId]: data }));
  }, []);

  // Compute visible steps (filtered by condition)
  const visibleSteps = steps.filter(
    (s) => !s.condition || s.condition(wizardData),
  );
  const totalVisible = visibleSteps.length;
  const currentStep = visibleSteps[currentIndex];

  const isFirst = currentIndex === 0;
  const isLast = currentIndex === totalVisible - 1;

  // handleNext and handleBack must be declared before the keyboard useEffect.
  const handleNext = React.useCallback(async () => {
    setStepError(null);
    // Run optional per-step validation gate
    if (currentStep?.validate) {
      const result = await currentStep.validate();
      if (result === false) {
        setStepError('Please complete this step before continuing.');
        return;
      }
      if (typeof result === 'string') {
        setStepError(result);
        return;
      }
    }

    if (isLast) {
      // Final step → submit
      setIsSubmitting(true);
      try {
        await onSubmit?.(wizardData);
        setIsComplete(true);
      } catch (err) {
        setStepError(err instanceof Error ? err.message : 'Submission failed. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      setCurrentIndex((i) => i + 1);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, isLast, currentStep]);

  const handleBack = React.useCallback(() => {
    setStepError(null);
    setCurrentIndex((i) => Math.max(0, i - 1));
  }, []);

  // Focus management: move focus to the step heading on step change.
  const headingRef = React.useRef<HTMLHeadingElement>(null);

  React.useEffect(() => {
    if (headingRef.current) {
      headingRef.current.focus();
    }
  }, [currentIndex]);

  // Keyboard: Ctrl/Meta+Enter submits / advances (convenience shortcut).
  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        void handleNext();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleNext]);

  // Conditional returns come AFTER all hooks (Rules of Hooks).
  if (!currentStep) return null;
  if (isComplete) return <CompletionScreen label={completeLabel} />;

  return (
    <div className="flex flex-col gap-6" data-testid="wizard-shell">
      {/* Progress */}
      <ProgressBar total={totalVisible} current={currentIndex} steps={visibleSteps} />

      {/* Step content area */}
      <div className="rounded-lg border border-border bg-card p-6">
        {/* Step heading */}
        <div className="mb-4">
          <p className="text-xs text-muted-foreground mb-1">
            {stepLabel} {currentIndex + 1} {of} {totalVisible}
          </p>
          <h2
            ref={headingRef}
            tabIndex={-1}
            className="text-xl font-semibold focus-visible:outline-none"
          >
            {currentStep.title}
          </h2>
          {currentStep.description && (
            <p className="mt-1 text-sm text-muted-foreground">{currentStep.description}</p>
          )}
        </div>

        {/* Step-level error summary */}
        {stepError && (
          <div
            role="alert"
            aria-live="polite"
            className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            {stepError}
          </div>
        )}

        {/* Step content via render prop */}
        <div>{children(currentStep.id, setStepData)}</div>
      </div>

      {/* Navigation controls */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className={cn(
                'rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground',
                'hover:text-foreground hover:bg-accent',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                'disabled:opacity-50 disabled:cursor-not-allowed',
              )}
            >
              {cancel}
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleBack}
            disabled={isFirst || isSubmitting}
            className={cn(
              'rounded-md border border-border px-4 py-1.5 text-sm font-medium',
              'hover:bg-accent hover:text-accent-foreground',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              'disabled:opacity-50 disabled:cursor-not-allowed',
            )}
          >
            {back}
          </button>

          <button
            type="button"
            onClick={() => void handleNext()}
            disabled={isSubmitting}
            className={cn(
              'rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground',
              'hover:bg-primary/90',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'flex items-center gap-2',
            )}
          >
            {isSubmitting ? (
              <>
                <span
                  className="size-3.5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent"
                  aria-hidden="true"
                />
                Processing…
              </>
            ) : isLast ? (
              submit
            ) : (
              next
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
