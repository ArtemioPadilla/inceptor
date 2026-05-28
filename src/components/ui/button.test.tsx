// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './button';

describe('Button (behavior)', () => {
  it('renders the children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  it('fires onClick when activated by mouse', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click me</Button>);
    await user.click(screen.getByRole('button', { name: 'Click me' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('is keyboard activatable (Enter)', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click me</Button>);
    screen.getByRole('button', { name: 'Click me' }).focus();
    await user.keyboard('{Enter}');
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('respects the disabled prop and does not fire onClick', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <Button onClick={onClick} disabled>
        Click me
      </Button>,
    );
    const btn = screen.getByRole('button', { name: 'Click me' });
    expect(btn).toBeDisabled();
    await user.click(btn);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('applies destructive variant classes from cva', () => {
    render(<Button variant="destructive">x</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-destructive');
  });

  it('forwards arbitrary props (data-* etc.) to the underlying button', () => {
    render(
      <Button data-testid="custom" aria-label="Custom">
        x
      </Button>,
    );
    const btn = screen.getByTestId('custom');
    expect(btn).toHaveAttribute('aria-label', 'Custom');
  });
});
