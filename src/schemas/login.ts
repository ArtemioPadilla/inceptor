/**
 * Login schema — first inhabitant of `src/schemas/`, the Spec-DD layer
 * (see `docs/PRINCIPLES.md` §3 — "Zod as the source of truth").
 *
 * Every cross-boundary type starts as a Zod schema, not a TypeScript
 * interface. TypeScript types are derived via `z.infer`. When the backend
 * archetype lands, `@hono/zod-openapi` will use this same schema to
 * generate the OpenAPI spec + the runtime handler validator.
 */
import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
});

/** Derived type. Never authored alongside the schema. */
export type LoginValues = z.infer<typeof LoginSchema>;
