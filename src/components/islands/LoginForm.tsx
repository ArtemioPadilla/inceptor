/**
 * LoginForm — installable login/auth page block (ROADMAP Epic 27).
 *
 * A branded, centered login form: email + password (PasswordInput, Epic 21),
 * a submit button, a "forgot password" link, and an optional "sign up" link.
 * Built on Form + react-hook-form + zod, following the same shape as
 * ContactForm/NewsletterForm.
 *
 * No real auth backend is wired — this is a UI block. `onSubmit` resolves
 * with a demo stub (matching how the other demo forms in this repo work);
 * swap `handleLogin` for a real POST/provider SDK call at integration time.
 */
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { LoginSchema, type LoginValues } from '@/schemas/login';
import ErrorBoundary from './ErrorBoundary';

type Status = 'idle' | 'submitting' | 'success' | 'error';

export interface LoginFormProps {
  /** Heading rendered above the fields. */
  heading?: string;
  /** href for "Forgot password?". Defaults to '#'. */
  forgotPasswordHref?: string;
  /** When provided, renders a "Sign up" link pointing at this href. */
  signUpHref?: string;
}

export default function LoginForm(props: LoginFormProps) {
  return (
    <ErrorBoundary name="LoginForm">
      <LoginFormInner {...props} />
    </ErrorBoundary>
  );
}

function LoginFormInner({
  heading = 'Welcome back',
  forgotPasswordHref = '#',
  signUpHref,
}: LoginFormProps) {
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const form = useForm<LoginValues>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { email: '', password: '' },
  });

  // Demo-mode stub — no auth backend to POST to. A real integration replaces
  // this with a fetch to /api/auth/login or a provider SDK call, then routes
  // on success instead of flipping local `status`.
  async function handleLogin(values: LoginValues) {
    setErrorMsg(null);
    setStatus('submitting');
    await new Promise((resolve) => setTimeout(resolve, 300));
    console.log('[LoginForm] demo submission:', values);
    setStatus('success');
  }

  if (status === 'success') {
    return (
      <div
        role="status"
        className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm text-emerald-300"
      >
        Signed in — redirecting…
      </div>
    );
  }

  return (
    <Form {...form}>
      {/* noValidate: cede all validation to zod/react-hook-form. Without it,
          the browser's (and jsdom's) native constraint validation for
          type="email" silently blocks the submit event before React ever
          sees it, so our own FormMessage never renders. */}
      <form onSubmit={form.handleSubmit(handleLogin)} noValidate className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">{heading}</h2>

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="login-email">Email</FormLabel>
              <FormControl>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between">
                <FormLabel htmlFor="login-password">Password</FormLabel>
                <a
                  href={forgotPasswordHref}
                  className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
                >
                  Forgot password?
                </a>
              </div>
              <FormControl>
                <PasswordInput id="login-password" autoComplete="current-password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {status === 'error' && errorMsg && (
          <p className="text-sm text-destructive">{errorMsg}</p>
        )}

        <Button type="submit" className="w-full" disabled={status === 'submitting'}>
          {status === 'submitting' ? 'Signing in…' : 'Sign in'}
        </Button>

        {signUpHref && (
          <p className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <a
              href={signUpHref}
              className="font-medium text-foreground underline underline-offset-4 hover:text-primary"
            >
              Sign up
            </a>
          </p>
        )}
      </form>
    </Form>
  );
}
