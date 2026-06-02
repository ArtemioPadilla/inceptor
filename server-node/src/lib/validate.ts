/**
 * Shared zValidator hook — turn Zod failures into a 422 with a stable
 * `{ error, errors: [{ path, message }] }` shape (the default is a 400 with
 * the raw Zod tree). The Flask archetype returns the identical shape.
 *
 * The result is typed structurally (just `{ issues }`) rather than against a
 * concrete `ZodError` class so it stays compatible with zod 4's internal
 * `$ZodError` that @hono/zod-validator actually passes in.
 */
import type { Context } from 'hono';

interface ValidationResult {
  success: boolean;
  error?: { issues: { path: PropertyKey[]; message: string }[] };
}

export function onInvalid(result: ValidationResult, c: Context): Response | undefined {
  if (!result.success && result.error) {
    return c.json(
      {
        error: 'validation_failed',
        errors: result.error.issues.map((i) => ({
          path: i.path.join('.'),
          message: i.message,
        })),
      },
      422,
    );
  }
  return undefined;
}
