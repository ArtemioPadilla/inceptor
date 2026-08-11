// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import * as React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NewsletterForm from './NewsletterForm';

describe('NewsletterForm — validation', () => {
  it('shows a validation message and does not subscribe when the email is malformed', async () => {
    const user = userEvent.setup();
    render(<NewsletterForm />);

    await user.type(screen.getByLabelText(/email/i), 'not-an-email');
    await user.click(screen.getByRole('button', { name: /subscribe/i }));

    // Without `noValidate`, the browser's native constraint validation for
    // type="email" blocks the submit event before react-hook-form/zod ever
    // run, so this FormMessage never renders — reproducing the bug.
    expect(await screen.findByText(/valid email/i)).toBeInTheDocument();
    expect(screen.queryByText(/subscribed/i)).not.toBeInTheDocument();
  });
});
