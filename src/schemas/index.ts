/**
 * `src/schemas/` — the Spec-DD layer.
 *
 * Every cross-boundary type lives here as a Zod schema. Forms, API
 * contracts, persisted state shapes, and worker `postMessage` payloads
 * are all defined as `z.object({ ... })` schemas with TypeScript types
 * derived via `z.infer`. See `docs/PRINCIPLES.md` §3 for the rule.
 *
 * Tests assert behavior *against* schemas (`Schema.safeParse(input).success`);
 * they never replace the schema.
 */

export { LoginSchema, type LoginValues } from './login';
export {
  ContactSchema,
  type ContactValues,
  NewsletterSchema,
  type NewsletterValues,
} from './contact';
export { FeedbackSchema, type FeedbackValues } from './feedback';
