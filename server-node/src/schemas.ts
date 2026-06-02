/**
 * Re-export the *frontend's* Zod schemas so the backend validates requests
 * against the exact same contracts the forms validate against — no drift
 * between client and server (ADR 0006). The path crosses out of server-node/
 * into the repo's shared `src/schemas/`.
 */
export {
  ContactSchema,
  type ContactValues,
  NewsletterSchema,
  type NewsletterValues,
  FeedbackSchema,
  type FeedbackValues,
} from '../../src/schemas/index';
