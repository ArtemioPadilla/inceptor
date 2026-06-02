import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { NewsletterSchema, type NewsletterValues } from '@/schemas/contact';
import { formEndpoint } from '@/lib/api';
import ErrorBoundary from './ErrorBoundary';

type Status = 'idle' | 'submitting' | 'success' | 'error';

/**
 * Newsletter signup skeleton. POSTs to `PUBLIC_NEWSLETTER_ENDPOINT` — works
 * with Buttondown's embedded form API, ConvertKit's `/forms/<id>/subscribe`,
 * or any compatible endpoint that accepts JSON `{ email }`.
 *
 * Without an endpoint configured, the form runs in "demo" mode: validates
 * client-side and prints to console. No external requests made.
 */
export default function NewsletterForm() {
  return (
    <ErrorBoundary name="NewsletterForm">
      <NewsletterFormInner />
    </ErrorBoundary>
  );
}

function NewsletterFormInner() {
  const [status, setStatus] = useState<Status>('idle');
  const form = useForm<NewsletterValues>({
    resolver: zodResolver(NewsletterSchema),
    defaultValues: { email: '', website: '' },
  });

  const endpoint = formEndpoint(
    import.meta.env.PUBLIC_NEWSLETTER_ENDPOINT as string | undefined,
    '/api/newsletter',
  );

  async function onSubmit(values: NewsletterValues) {
    if (!endpoint) {
      setStatus('success');
      console.log('[NewsletterForm] PUBLIC_NEWSLETTER_ENDPOINT unset; demo submission:', values);
      return;
    }
    setStatus('submitting');
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: values.email }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setStatus('success');
      form.reset();
    } catch {
      setStatus('error');
    }
  }

  if (status === 'success') {
    return (
      <p className="text-sm text-emerald-400">
        Subscribed — check your inbox for a confirmation email.
      </p>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-2 sm:flex-row sm:items-start">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormControl>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  aria-label="Email"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* Honeypot */}
        <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
          <label>
            Leave empty
            <input type="text" tabIndex={-1} autoComplete="off" {...form.register('website')} />
          </label>
        </div>
        <Button type="submit" disabled={status === 'submitting'}>
          {status === 'submitting' ? 'Subscribing…' : 'Subscribe'}
        </Button>
      </form>
    </Form>
  );
}
