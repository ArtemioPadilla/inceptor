import { describe, expect, it } from 'vitest';
import { cn } from './utils';

describe('cn', () => {
  it('joins truthy class names', () => {
    expect(cn('a', 'b')).toBe('a b');
  });

  it('drops falsy values', () => {
    // eslint-disable-next-line no-constant-binary-expression -- intentional: testing that cn() drops falsy values
    expect(cn('a', false && 'b', null, undefined, '')).toBe('a');
  });

  it('merges conflicting Tailwind utilities (tailwind-merge)', () => {
    // tailwind-merge keeps the last conflicting class
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4');
  });

  it('flattens arrays', () => {
    expect(cn(['a', 'b'], ['c'])).toBe('a b c');
  });

  it('handles object form', () => {
    expect(cn({ a: true, b: false, c: true })).toBe('a c');
  });
});
