import { describe, expect, it } from 'vitest';
import source from '../pages/login.astro?raw';

describe('login.astro', () => {
  it('uses BaseLayout', () => {
    expect(source).toMatch(/from\s+['"]\.\.\/layouts\/BaseLayout\.astro['"]/);
  });

  it('imports and mounts LoginForm with client:visible', () => {
    expect(source).toMatch(/LoginForm/);
    expect(source).toMatch(/client:visible/);
  });

  it('is centered (branded auth-page layout)', () => {
    expect(source).toMatch(/items-center/);
    expect(source).toMatch(/justify-center/);
  });
});
