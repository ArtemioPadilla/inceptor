// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import * as React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ContactForm from './ContactForm';

describe('ContactForm — validation', () => {
  it('shows a validation message and does not submit when the email is malformed', async () => {
    const user = userEvent.setup();
    render(<ContactForm />);

    await user.type(screen.getByLabelText(/name/i), 'Ada Lovelace');
    await user.type(screen.getByLabelText(/email/i), 'not-an-email');
    await user.type(screen.getByLabelText(/message/i), 'This is a long enough message.');
    await user.click(screen.getByRole('button', { name: /send/i }));

    // Without `noValidate`, the browser's native constraint validation for
    // type="email" blocks the submit event before react-hook-form/zod ever
    // run, so this FormMessage never renders — reproducing the bug.
    expect(await screen.findByText(/valid email/i)).toBeInTheDocument();
    expect(screen.queryByText(/message is on its way/i)).not.toBeInTheDocument();
  });
});
