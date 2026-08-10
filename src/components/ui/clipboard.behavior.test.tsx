// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ClipboardButton } from './clipboard';

// NOTE: `userEvent.setup()` installs its own clipboard stub as a side effect,
// so the mock must be (re)applied *after* setup() — stubbing first and
// calling setup() second silently discards the mock.
function setupWithClipboardStub() {
  const user = userEvent.setup();
  const writeText = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText },
    configurable: true,
  });
  return { user, writeText };
}

describe('ClipboardButton (behavior)', () => {
  it('writes the value to the clipboard on click', async () => {
    const { user, writeText } = setupWithClipboardStub();
    render(<ClipboardButton value="secret-api-key" />);
    await user.click(screen.getByRole('button', { name: 'Copy to clipboard' }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith('secret-api-key'));
  });

  it('swaps to the copied state after a successful write, then reverts after resetAfter ms', async () => {
    const { user } = setupWithClipboardStub();
    render(<ClipboardButton value="secret-api-key" resetAfter={30} />);
    await user.click(screen.getByRole('button', { name: 'Copy to clipboard' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Copied' })).toBeInTheDocument());
    await waitFor(() => expect(screen.getByRole('button', { name: 'Copy to clipboard' })).toBeInTheDocument());
  });

  it('calls onCopied with the copied value', async () => {
    const { user } = setupWithClipboardStub();
    const onCopied = vi.fn();
    render(<ClipboardButton value="secret-api-key" onCopied={onCopied} />);
    await user.click(screen.getByRole('button', { name: 'Copy to clipboard' }));
    await waitFor(() => expect(onCopied).toHaveBeenCalledWith('secret-api-key'));
  });
});
