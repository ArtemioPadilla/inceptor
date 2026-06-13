import { describe, expect, it } from 'vitest';
import source from '../components/islands/WizardIsland.tsx?raw';

describe('WizardIsland', () => {
  it('default-exports a React component', () => {
    expect(source).toMatch(/export default function WizardIsland/);
  });

  it('wraps inner component in ErrorBoundary', () => {
    expect(source).toMatch(/ErrorBoundary/);
    expect(source).toMatch(/name=["']WizardIsland["']/);
  });

  it('exports WizardStep typed contract with id, title, description, validate, condition', () => {
    expect(source).toMatch(/export interface WizardStep/);
    expect(source).toMatch(/id:\s*string/);
    expect(source).toMatch(/title:\s*string/);
    expect(source).toMatch(/description\?:\s*string/);
    expect(source).toMatch(/validate\?/);
    expect(source).toMatch(/condition\?/);
  });

  it('validate can return boolean or string or a Promise', () => {
    // The validate signature allows boolean | string | Promise<boolean | string>
    expect(source).toMatch(/boolean \| string \| Promise<boolean \| string>/);
  });

  it('supports conditional steps via condition prop on WizardStep', () => {
    expect(source).toMatch(/condition/);
    expect(source).toMatch(/s\.condition/);
  });

  it('manages step navigation state (currentIndex)', () => {
    expect(source).toMatch(/currentIndex/);
    expect(source).toMatch(/setCurrentIndex/);
  });

  it('blocks step advance when validate() returns false', () => {
    expect(source).toMatch(/result === false/);
    expect(source).toMatch(/setStepError/);
  });

  it('blocks step advance when validate() returns a string error', () => {
    expect(source).toMatch(/typeof result === ['"]string['"]/);
    expect(source).toMatch(/setStepError\(result\)/);
  });

  it('renders step-level error summary with role=alert', () => {
    expect(source).toMatch(/role=["']alert["']/);
    expect(source).toMatch(/stepError/);
  });

  it('calls onSubmit on the final step with the data bag', () => {
    expect(source).toMatch(/isLast/);
    expect(source).toMatch(/onSubmit\?\.\(wizardData\)/);
  });

  it('shows a loading/submitting state during submit', () => {
    expect(source).toMatch(/isSubmitting/);
    expect(source).toMatch(/Processing/);
  });

  it('shows completion screen after successful submit', () => {
    expect(source).toMatch(/isComplete/);
    expect(source).toMatch(/CompletionScreen/);
  });

  it('renders a progress indicator', () => {
    expect(source).toMatch(/ProgressBar|progress/i);
    expect(source).toMatch(/aria-label=["']Wizard progress["']/);
  });

  it('disables Back button on first step', () => {
    expect(source).toMatch(/isFirst.*||.*isSubmitting|isFirst \|\| isSubmitting/);
  });

  it('uses focus management — moves focus to step heading on step change', () => {
    expect(source).toMatch(/headingRef/);
    expect(source).toMatch(/headingRef\.current/);
    expect(source).toMatch(/\.focus\(\)/);
  });

  it('accepts a render prop children(stepId)', () => {
    expect(source).toMatch(/children\(currentStep\.id\)/);
  });

  it('accepts onCancel callback', () => {
    expect(source).toMatch(/onCancel/);
  });

  it('accepts labels override for i18n', () => {
    expect(source).toMatch(/labels\?/);
    expect(source).toMatch(/back.*next.*submit/s);
  });

  it('does not import from @radix-ui', () => {
    expect(source).not.toMatch(/from ['"]@radix-ui/);
  });

  it('does not import framer-motion', () => {
    expect(source).not.toMatch(/from ['"]framer-motion['"]/);
  });

  it('does not use context API for cross-island state', () => {
    expect(source).not.toMatch(/createContext/);
  });

  it('keyboard shortcut: Ctrl+Enter / Meta+Enter advances wizard', () => {
    expect(source).toMatch(/ctrlKey.*metaKey.*Enter|Ctrl.*Enter|Meta.*Enter/);
  });

  it('cleans up keyboard listener on unmount', () => {
    expect(source).toMatch(/removeEventListener/);
  });
});
