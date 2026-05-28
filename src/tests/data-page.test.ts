import { describe, expect, it } from 'vitest';
import source from '../pages/demos/data.astro?raw';

describe('data.astro', () => {
  it('uses BaseLayout', () => {
    expect(source).toMatch(/from\s+['"]\.\.\/\.\.\/layouts\/BaseLayout\.astro['"]/);
  });

  it('imports and renders IssuesList', () => {
    expect(source).toMatch(/IssuesList/);
    expect(source).toMatch(/client:visible/);
  });

  it('does not use client:load (reserved for critical islands only)', () => {
    expect(source).not.toMatch(/client:load/);
  });
});
