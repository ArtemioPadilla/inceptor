// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import * as React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SettingsDemo from './SettingsDemo';

describe('SettingsDemo — Danger zone (installable settings block, ROADMAP Epic 27)', () => {
  it('the Danger zone tab renders a Delete account trigger that requires confirmation', async () => {
    const user = userEvent.setup();
    render(<SettingsDemo />);

    await user.click(screen.getByRole('tab', { name: /danger zone/i }));
    await user.click(screen.getByRole('button', { name: /delete account/i }));

    // AlertDialog is a confirmation surface — the destructive action must not
    // fire until the user explicitly confirms inside the dialog.
    expect(
      screen.getByRole('alertdialog', { name: /delete account/i }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/scheduled for deletion/i)).not.toBeInTheDocument();
  });

  it('confirming inside the dialog schedules the (demo) deletion and closes it', async () => {
    const user = userEvent.setup();
    render(<SettingsDemo />);

    await user.click(screen.getByRole('tab', { name: /danger zone/i }));
    await user.click(screen.getByRole('button', { name: /delete account/i }));
    await user.click(screen.getByRole('button', { name: /^yes, delete/i }));

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(screen.getByText(/scheduled for deletion/i)).toBeInTheDocument();
  });
});
