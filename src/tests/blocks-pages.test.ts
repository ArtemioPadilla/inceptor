import { describe, expect, it } from 'vitest';

describe('blocks/index.astro', () => {
  it('links to all three block pages', async () => {
    const source = await import('../pages/blocks/index.astro?raw').then((m) => m.default);
    expect(source).toMatch(/\/blocks\/login/);
    expect(source).toMatch(/\/blocks\/settings/);
    expect(source).toMatch(/\/blocks\/app-layout/);
  });
});

describe('blocks/login.astro', () => {
  it('uses BaseLayout, mounts LoginForm, and uses BlockPreviewToggle', async () => {
    const source = await import('../pages/blocks/login.astro?raw').then((m) => m.default);
    expect(source).toMatch(/BaseLayout/);
    expect(source).toMatch(/LoginForm/);
    expect(source).toMatch(/client:visible/);
    expect(source).toMatch(/BlockPreviewToggle/);
  });
});

describe('blocks/settings.astro', () => {
  it('uses BaseLayout, mounts SettingsDemo, and uses BlockPreviewToggle', async () => {
    const source = await import('../pages/blocks/settings.astro?raw').then((m) => m.default);
    expect(source).toMatch(/BaseLayout/);
    expect(source).toMatch(/SettingsDemo/);
    expect(source).toMatch(/client:visible/);
    expect(source).toMatch(/BlockPreviewToggle/);
  });
});

describe('blocks/app-layout.astro', () => {
  it('uses BaseLayout, mounts both sidebar variant previews, and uses BlockPreviewToggle twice', async () => {
    const source = await import('../pages/blocks/app-layout.astro?raw').then((m) => m.default);
    expect(source).toMatch(/BaseLayout/);
    expect(source).toMatch(/BlockAppLayoutIconCollapse/);
    expect(source).toMatch(/BlockAppLayoutDual/);
    expect(source.match(/<BlockPreviewToggle/g)?.length).toBe(2);
  });
});
