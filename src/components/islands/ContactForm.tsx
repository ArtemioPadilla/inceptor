import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ContactSchema, type ContactValues } from '@/schemas/contact';
import { flags } from '@/lib/flags';
import { formEndpoint } from '@/lib/api';
import ErrorBoundary from './ErrorBoundary';

type Status = 'idle' | 'submitting' | 'success' | 'error';

/**
 * Contact form skeleton. POSTs to the endpoint named by
 * `PUBLIC_CONTACT_ENDPOINT` (default: Web3Forms / Formspree compatible).
 * No backend required — pick a free static-friendly handler at deploy time.
 */
export default function ContactForm() {
  return (
    <ErrorBoundary name="ContactForm">
      <ContactFormInner />
    </ErrorBoundary>
  );
}

function ContactFormInner() {
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const form = useForm<ContactValues>({
    resolver: zodResolver(ContactSchema),
    defaultValues: { name: '', email: '', message: '', website: '' },
  });

  const endpoint = formEndpoint(
    import.meta.env.PUBLIC_CONTACT_ENDPOINT as string | undefined,
    '/api/contact',
  );

  async function onSubmit(values: ContactValues) {
    setErrorMsg(null);
    if (!endpoint) {
      setStatus('success');
      console.log('[ContactForm] PUBLIC_CONTACT_ENDPOINT unset; demo submission:', values);
      return;
    }
    setStatus('submitting');
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      setStatus('success');
      form.reset();
    } catch (err) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Submission failed.');
    }
  }

  if (status === 'success') {
    return (
      <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm text-emerald-300">
        Thanks — your message is on its way. I'll get back to you soon.
        {!endpoint && flags.channel !== 'production' && (
          <p className="mt-2 text-xs text-emerald-200/70">
            (Demo mode: set <code className="font-mono">PUBLIC_CONTACT_ENDPOINT</code> to wire a real handler.)
          </p>
        )}
      </div>
    );
  }

  return (
    <Form {...form}>
      {/* `relative` is required so the absolute-positioned honeypot stays
          within this stacking context and never causes horizontal scroll. */}
      <form onSubmit={form.handleSubmit(onSubmit)} className="relative space-y-4 max-w-md">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Ada Lovelace" autoComplete="name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="you@example.com" autoComplete="email" {...field} />
              </FormControl>
              <FormDescription>I'll only use this to reply.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Message</FormLabel>
              <FormControl>
                <textarea
                  rows={5}
                  placeholder="What's on your mind?"
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Honeypot — visually hidden but still accessible to bots */}
        <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
          <label>
            Leave this field empty
            <input type="text" tabIndex={-1} autoComplete="off" {...form.register('website')} />
          </label>
        </div>

        {status === 'error' && errorMsg && (
          <p className="text-sm text-destructive">{errorMsg}</p>
        )}

        <Button type="submit" disabled={status === 'submitting'}>
          {status === 'submitting' ? 'Sending…' : 'Send'}
        </Button>
      </form>
    </Form>
  );
}
