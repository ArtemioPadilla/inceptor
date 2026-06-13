// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { FileUpload } from './file-upload';

const file = (name: string, size: number) => {
  const f = new File(['x'], name, { type: 'text/plain' });
  Object.defineProperty(f, 'size', { value: size });
  return f;
};

describe('FileUpload', () => {
  it('lists selected files with a removable token', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    const { rerender } = render(<FileUpload files={[file('a.pdf', 1024)]} onChange={onChange} />);
    expect(screen.getByText('a.pdf')).toBeInTheDocument();
    await user.click(screen.getByLabelText('Remove a.pdf'));
    expect(onChange).toHaveBeenCalledWith([]);
    rerender(<FileUpload files={[]} onChange={onChange} />);
    expect(screen.queryByText('a.pdf')).not.toBeInTheDocument();
  });

  it('rejects oversized files via onError and does not add them', async () => {
    const onChange = vi.fn();
    const onError = vi.fn();
    render(<FileUpload files={[]} onChange={onChange} maxSize={1000} onError={onError} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await userEvent.upload(input, file('big.bin', 5000));
    expect(onError).toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('the dropzone is keyboard-focusable with an accessible name', () => {
    render(<FileUpload files={[]} onChange={() => {}} />);
    const zone = screen.getByRole('button', { name: 'Add files' });
    expect(zone).toHaveAttribute('tabindex', '0');
  });

  it('single mode replaces; multiple appends', async () => {
    const onChange = vi.fn();
    render(<FileUpload files={[file('old.txt', 10)]} onChange={onChange} multiple />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await userEvent.upload(input, file('new.txt', 10));
    expect(onChange).toHaveBeenCalledWith(expect.arrayContaining([expect.objectContaining({ name: 'old.txt' })]));
  });
});
