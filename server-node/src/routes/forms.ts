import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { ContactSchema, NewsletterSchema } from '../schemas';
import { onInvalid } from '../lib/validate';
import { config } from '../config';

export const forms = new Hono();

/** Forward to a downstream handler if one is configured, else just log. */
async function deliver(forwardUrl: string, kind: string, payload: unknown): Promise<void> {
  if (!forwardUrl) {
    console.log(`[forms] ${kind} received (no forward URL set):`, payload);
    return;
  }
  const res = await fetch(forwardUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Forward to ${kind} handler failed: ${res.status}`);
}

forms.post('/contact', zValidator('json', ContactSchema, onInvalid), async (c) => {
  const data = c.req.valid('json');
  // Honeypot already enforced by the schema (website must be empty).
  const { website: _hp, ...clean } = data;
  await deliver(config.contactForwardUrl, 'contact', clean);
  return c.json({ ok: true, received: 'contact' });
});

forms.post('/newsletter', zValidator('json', NewsletterSchema, onInvalid), async (c) => {
  const data = c.req.valid('json');
  const { website: _hp, ...clean } = data;
  await deliver(config.newsletterForwardUrl, 'newsletter', clean);
  return c.json({ ok: true, received: 'newsletter' });
});
