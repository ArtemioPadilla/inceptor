// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TagInput } from './tag-input';

describe('TagInput (behavior)', () => {
  it('renders existing tags', () => {
    render(<TagInput value={['alpha', 'beta']} onValueChange={() => {}} />);
    expect(screen.getByText('alpha')).toBeInTheDocument();
    expect(screen.getByText('beta')).toBeInTheDocument();
  });

  it('adds a tag on Enter (onValueChange with the new array)', () => {
    const onValueChange = vi.fn();
    render(<TagInput value={['alpha']} onValueChange={onValueChange} />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'beta' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenCalledWith(['alpha', 'beta']);
  });

  it('does not add a blank tag on Enter', () => {
    const onValueChange = vi.fn();
    render(<TagInput value={[]} onValueChange={onValueChange} />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('removes the last tag on Backspace when the draft is empty', () => {
    const onValueChange = vi.fn();
    render(<TagInput value={['alpha', 'beta']} onValueChange={onValueChange} />);
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Backspace' });
    expect(onValueChange).toHaveBeenCalledWith(['alpha']);
  });
});
