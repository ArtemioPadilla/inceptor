import { describe, expect, it } from 'vitest';
import source from '../pages/demos/dashboard.astro?raw';

describe('dashboard.astro', () => {
  it('uses BaseLayout', () => {
    expect(source).toMatch(/from\s+['"]\.\.\/\.\.\/layouts\/BaseLayout\.astro['"]/);
  });

  it('imports and mounts DashboardIsland with client:visible', () => {
    expect(source).toMatch(/DashboardIsland/);
    expect(source).toMatch(/client:visible/);
  });
});
