import { describe, expect, it } from 'vitest';
import source from './ThemeToggle.astro?raw';

describe('ThemeToggle.astro', () => {
  it('declares the toggle button with correct id', () => {
    expect(source).toMatch(/id=["']theme-toggle["']/);
  });

  it('sets initial aria-pressed and aria-label', () => {
    expect(source).toMatch(/aria-pressed/);
    expect(source).toMatch(/aria-label=["']Toggle dark mode["']/);
  });

  it('persists user choice to localStorage', () => {
    expect(source).toMatch(/localStorage\.setItem\(['"]theme['"]/);
  });

  it('toggles the dark class on documentElement', () => {
    expect(source).toMatch(/document\.documentElement\.classList\.toggle\(['"]dark['"]\)/);
  });
});
