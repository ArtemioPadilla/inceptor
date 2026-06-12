import { describe, expect, it } from 'vitest';
import { LoginSchema } from './login';

describe('LoginSchema (Spec-DD)', () => {
  it('accepts valid email + 8+ char password', () => {
    const result = LoginSchema.safeParse({
      email: 'a@b.com',
      password: '12345678',
    });
    expect(result.success).toBe(true);
  });

  it('rejects malformed email', () => {
    const result = LoginSchema.safeParse({
      email: 'not-an-email',
      password: '12345678',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      // Non-null: safeParse failure on a 2-field schema always produces at least 1 issue.
      const issue = result.error.issues[0]!;
      expect(issue.path).toEqual(['email']);
      expect(issue.message).toMatch(/valid email/i);
    }
  });

  it('rejects passwords shorter than 8 characters', () => {
    const result = LoginSchema.safeParse({
      email: 'a@b.com',
      password: '1234567',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      // Non-null: failure always produces at least 1 issue.
      const issue = result.error.issues[0]!;
      expect(issue.path).toEqual(['password']);
      expect(issue.message).toMatch(/8 characters/i);
    }
  });

  it('rejects missing fields', () => {
    const result = LoginSchema.safeParse({});
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path[0]);
      expect(paths).toContain('email');
      expect(paths).toContain('password');
    }
  });

  it('strips unknown fields (z.object default)', () => {
    // Cast through unknown so TypeScript doesn't error on the extra prop —
    // Zod accepts and strips it at parse time, which is exactly what we're testing.
    const input = {
      email: 'a@b.com',
      password: '12345678',
      extraField: 'should be dropped',
    } as unknown as { email: string; password: string };
    const result = LoginSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(Object.keys(result.data)).toEqual(['email', 'password']);
    }
  });
});
