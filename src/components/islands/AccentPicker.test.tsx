import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import AccentPicker from './AccentPicker';
import { defineTheme } from '@/lib/define-theme';

/** #340: a live accent picker that repaints a scope with define-theme.ts. */
describe('AccentPicker', () => {
  let scope: HTMLDivElement;
  beforeEach(() => {
    scope = document.createElement('div');
    scope.setAttribute('data-accent-scope', '');
    document.body.append(scope);
  });
  afterEach(() => scope.remove());

  it('paints the scope with the palette define-theme derives from the picked colour', () => {
    render(<AccentPicker />);
    fireEvent.change(screen.getByLabelText(/accent colour/i), { target: { value: '#d6006f' } });
    const theme = defineTheme('#d6006f');
    expect(scope.style.getPropertyValue('--primary')).toBe(
      `light-dark(${theme.light.primary}, ${theme.dark.primary})`,
    );
    expect(scope.style.getPropertyValue('--highlight')).toBe(
      `light-dark(${theme.light.highlight}, ${theme.dark.highlight})`,
    );
    expect(scope.style.getPropertyValue('--brand-3-foreground')).toBe(
      `light-dark(${theme.light.brand3Foreground}, ${theme.dark.brand3Foreground})`,
    );
  });

  it('presets are buttons that say their colour, and pressing one applies it', () => {
    render(<AccentPicker />);
    const rosa = screen.getByRole('button', { name: /rosa/i });
    fireEvent.click(rosa);
    expect(scope.style.getPropertyValue('--primary')).toContain('oklch(');
    expect(rosa).toHaveAttribute('aria-pressed', 'true');
  });

  it('reset removes every override, back to the template palette', () => {
    render(<AccentPicker />);
    fireEvent.click(screen.getByRole('button', { name: /rosa/i }));
    fireEvent.click(screen.getByRole('button', { name: /reset/i }));
    expect(scope.getAttribute('style') ?? '').toBe('');
  });

  it('says what it does not do', () => {
    render(<AccentPicker />);
    expect(screen.getByText(/only the hue/i)).toBeInTheDocument();
  });
});
