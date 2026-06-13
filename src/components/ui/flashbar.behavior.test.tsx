// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { Flashbar, type FlashItem } from './flashbar';

const items: FlashItem[] = [
  { id: 'a', type: 'success', content: 'Saved' },
  { id: 'b', type: 'error', content: 'Failed', action: { label: 'Retry', onClick: vi.fn() } },
];

describe('Flashbar', () => {
  it('renders nothing when empty', () => {
    const { container } = render(<Flashbar items={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
  it('uses role=alert for warning/error and role=status for info/success', () => {
    render(<Flashbar items={items} />);
    expect(screen.getByText('Failed').closest('[role="alert"]')).toBeInTheDocument();
    expect(screen.getByText('Saved').closest('[role="status"]')).toBeInTheDocument();
  });
  it('dismiss fires onDismiss with the item id', async () => {
    const onDismiss = vi.fn();
    const user = userEvent.setup();
    render(<Flashbar items={items} onDismiss={onDismiss} />);
    await user.click(screen.getAllByLabelText('Dismiss notification')[0]!);
    expect(onDismiss).toHaveBeenCalledWith('a');
  });
  it('renders an inline action and fires it', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(<Flashbar items={[{ id: 'x', type: 'error', content: 'e', action: { label: 'Retry', onClick } }]} />);
    await user.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onClick).toHaveBeenCalled();
  });
  it('hides the dismiss button when dismissible=false', () => {
    render(<Flashbar items={[{ id: 'x', type: 'info', content: 'c', dismissible: false }]} />);
    expect(screen.queryByLabelText('Dismiss notification')).not.toBeInTheDocument();
  });
});
