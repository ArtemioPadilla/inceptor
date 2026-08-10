// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import * as React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginForm from './LoginForm';

describe('LoginForm — validation', () => {
  it('shows a validation message and does not sign in when the email is malformed', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText(/email/i), 'not-an-email');
    await user.type(screen.getByLabelText(/^password$/i), 'longenoughpw');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText(/valid email/i)).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});

describe('LoginForm — happy path', () => {
  it('submits valid credentials and shows a success state', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText(/email/i), 'ada@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'longenoughpw');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent(/signed in/i);
    });
  });
});

describe('LoginForm — links', () => {
  it('renders a "Forgot password?" link', () => {
    render(<LoginForm />);
    expect(screen.getByRole('link', { name: /forgot password/i })).toBeInTheDocument();
  });

  it('renders a "Sign up" link only when signUpHref is provided', () => {
    const { rerender } = render(<LoginForm />);
    expect(screen.queryByRole('link', { name: /sign up/i })).not.toBeInTheDocument();

    rerender(<LoginForm signUpHref="/signup" />);
    expect(screen.getByRole('link', { name: /sign up/i })).toHaveAttribute('href', '/signup');
  });
});
