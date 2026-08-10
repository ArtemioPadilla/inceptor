// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { DownloadTrigger } from './download-trigger';

beforeEach(() => {
  vi.stubGlobal('URL', {
    ...URL,
    createObjectURL: vi.fn(() => 'blob:mock-url'),
    revokeObjectURL: vi.fn(),
  });
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('DownloadTrigger', () => {
  it('renders an accessible "Export" button by default', () => {
    render(<DownloadTrigger onExport={() => Promise.resolve(new Blob(['x']))} />);
    expect(screen.getByRole('button', { name: 'Export' })).toBeInTheDocument();
  });

  it('shows a loading state while onExport is pending, then triggers a download', async () => {
    let resolveExport: (b: Blob) => void = () => {};
    const onExport = vi.fn(
      () => new Promise<Blob>((resolve) => { resolveExport = resolve; }),
    );
    const user = userEvent.setup();
    render(<DownloadTrigger onExport={onExport} filename="report.csv" />);

    const button = screen.getByRole('button', { name: 'Export' });
    await user.click(button);

    expect(onExport).toHaveBeenCalledTimes(1);
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');

    resolveExport(new Blob(['a,b,c']));

    await waitFor(() => expect(button).not.toBeDisabled());
    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
    expect(HTMLAnchorElement.prototype.click).toHaveBeenCalledTimes(1);
  });

  it('calls onError and resets the loading state when onExport rejects', async () => {
    const onError = vi.fn();
    const onExport = vi.fn(() => Promise.reject(new Error('export failed')));
    const user = userEvent.setup();
    render(<DownloadTrigger onExport={onExport} onError={onError} />);

    const button = screen.getByRole('button', { name: 'Export' });
    await user.click(button);

    await waitFor(() => expect(onError).toHaveBeenCalledWith(expect.any(Error)));
    expect(button).not.toBeDisabled();
    expect(button).not.toHaveAttribute('aria-busy', 'true');
  });
});
