import { describe, expect, it } from 'vitest';
import source from '../pages/demos/data/large.astro?raw';

describe('data/large.astro', () => {
  it('uses BaseLayout', () => {
    expect(source).toMatch(/from\s+['"]\.\.\/\.\.\/\.\.\/layouts\/BaseLayout\.astro['"]/);
  });
  it('imports and mounts LargeTable client:visible', () => {
    expect(source).toMatch(/LargeTable/);
    expect(source).toMatch(/client:visible/);
  });
});
