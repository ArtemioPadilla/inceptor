// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ColorPicker } from './color-picker';

// ColorPicker's hex text field lives inside a Popover — open it first via
// the swatch trigger, same as a real user would.
async function openPicker(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: /#/i }));
  return screen.getByLabelText('Hex');
}

describe('ColorPicker (behavior)', () => {
  it('commits a valid typed hex value and calls onValueChange with it', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<ColorPicker defaultValue="#000000" onValueChange={onValueChange} />);

    const hexField = await openPicker(user);
    await user.clear(hexField);
    await user.type(hexField, '#10b981');
    await user.tab(); // blur to commit

    expect(onValueChange).toHaveBeenCalledWith('#10b981');
  });

  it('reverts an invalid typed hex value on blur without propagating it via onValueChange', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<ColorPicker defaultValue="#10b981" onValueChange={onValueChange} />);

    const hexField = await openPicker(user);
    await user.clear(hexField);
    await user.type(hexField, 'not-a-color');
    await user.tab(); // blur — should revert instead of committing garbage

    expect(onValueChange).not.toHaveBeenCalledWith('not-a-color');
    expect(hexField).toHaveValue('#10b981');
  });
});
