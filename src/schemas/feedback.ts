/**
 * Feedback schema — the contract the FeedbackFAB and the self-hosted backend
 * share. When `PUBLIC_API_BASE` is set, the FAB can POST this to
 * `POST /api/feedback` and the server creates a real GitHub issue with a
 * server-side token (instead of the browser opening a prefilled issue URL).
 *
 * Honeypot `website` MUST be empty — see contact.ts for the rationale.
 */
import { z } from 'zod';

export const FeedbackSchema = z.object({
  title: z.string().trim().min(3, 'Give the issue a short title.').max(120),
  body: z.string().trim().min(10, 'Describe what happened.').max(8000),
  // Optional labels to apply to the created issue (e.g. ["type:bug"]).
  labels: z.array(z.string().min(1).max(50)).max(10).optional(),
  // Honeypot — visually hidden; bots fill it, humans don't.
  website: z.string().max(0, 'Bot detected.'),
});
export type FeedbackValues = z.infer<typeof FeedbackSchema>;
