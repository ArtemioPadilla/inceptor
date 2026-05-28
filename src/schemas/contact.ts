/**
 * Contact + newsletter schemas — Spec-DD contracts for the public forms.
 *
 * Honeypot field `website` MUST be empty (bots love filling honeypots). Real
 * submissions get a rejection with no human-visible message about the field.
 */
import { z } from 'zod';

export const ContactSchema = z.object({
  name: z.string().trim().min(1, 'Tell me what to call you.').max(80),
  email: z.string().trim().email('Please enter a valid email address.'),
  message: z
    .string()
    .trim()
    .min(10, 'Add a few more details so I can respond usefully.')
    .max(2000, 'Keep it under 2000 characters.'),
  // Honeypot — visually hidden in the form; bots fill it, humans don't.
  // No .default() so input/output types stay aligned (react-hook-form needs that).
  website: z.string().max(0, 'Bot detected.'),
});
export type ContactValues = z.infer<typeof ContactSchema>;

export const NewsletterSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address.'),
  website: z.string().max(0, 'Bot detected.'),
});
export type NewsletterValues = z.infer<typeof NewsletterSchema>;
