import { describe, it, expect } from 'vitest';
import { ContactSchema, NewsletterSchema } from './contact';

describe('ContactSchema', () => {
  it('accepts a valid submission', () => {
    const result = ContactSchema.safeParse({
      name: 'Ada',
      email: 'ada@example.com',
      message: 'Loved the scaffold. Quick question about the docs route.',
      website: '',
    });
    expect(result.success).toBe(true);
  });

  it('rejects when the honeypot is filled', () => {
    const result = ContactSchema.safeParse({
      name: 'Bot',
      email: 'bot@spam.example',
      message: 'buy my product http://example.com',
      website: 'http://spam.example',
    });
    expect(result.success).toBe(false);
  });

  it('rejects short messages', () => {
    const result = ContactSchema.safeParse({
      name: 'Ada',
      email: 'ada@example.com',
      message: 'hi',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid emails', () => {
    const result = ContactSchema.safeParse({
      name: 'Ada',
      email: 'not-an-email',
      message: 'A perfectly long message about something interesting.',
    });
    expect(result.success).toBe(false);
  });
});

describe('NewsletterSchema', () => {
  it('accepts a valid email', () => {
    expect(
      NewsletterSchema.safeParse({ email: 'ada@example.com', website: '' }).success,
    ).toBe(true);
  });

  it('rejects when honeypot is filled', () => {
    expect(
      NewsletterSchema.safeParse({
        email: 'bot@spam.example',
        website: 'http://spam.example',
      }).success,
    ).toBe(false);
  });
});
