import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { FeedbackSchema } from '../schemas';
import { onInvalid } from '../lib/validate';
import { createIssue } from '../lib/github';

export const feedback = new Hono();

// Create a real GitHub issue from the FeedbackFAB, server-side, with a token —
// instead of the browser opening a prefilled issue URL. Returns 503 when no
// token is configured (see lib/github.createIssue).
feedback.post('/feedback', zValidator('json', FeedbackSchema, onInvalid), async (c) => {
  const { title, body, labels } = c.req.valid('json');
  const created = await createIssue({ title, body, labels });
  return c.json(created, 201);
});
