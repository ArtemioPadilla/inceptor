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

  // Since #19 (Nano Stores migration), localStorage and classList side-effects
  // live in src/stores/theme.ts, not here. These two tests verify the new
  // architecture: the toggle delegates to the store rather than manipulating
  // the DOM directly.

  it('delegates toggle action to the Nano Store (toggleTheme import)', () => {
    expect(source).toMatch(/toggleTheme/);
    expect(source).toMatch(/from ['"]@\/stores\/theme['"]/);
  });

  it('subscribes to $theme for aria-pressed sync', () => {
    expect(source).toMatch(/\$theme\.subscribe/);
  });
});
