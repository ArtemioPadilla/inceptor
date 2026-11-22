import { describe, expect, it } from 'vitest';
import source from './ThemeToggle.astro?raw';

describe('ThemeToggle.astro', () => {
  it('declares the toggle button with correct id', () => {
    expect(source).toMatch(/id=["']theme-toggle["']/);
  });

  // WAI-ARIA APG toggle-button pattern: the accessible name stays constant and
  // aria-pressed carries the state. Changing the name as well ("Switch to light
  // theme") makes screen readers announce "Switch to light theme, pressed",
  // which contradicts itself. https://www.w3.org/WAI/ARIA/apg/patterns/button/
  it('uses a constant accessible name with aria-pressed for state', () => {
    expect(source).toMatch(/aria-pressed/);
    expect(source).toMatch(/aria-label=\{label\}/);
    expect(source).not.toMatch(/setAttribute\(\s*['"]aria-label['"]/);
  });

  it('localizes the name (en default, es supported)', () => {
    expect(source).toMatch(/en:\s*['"]Dark theme['"]/);
    expect(source).toMatch(/es:\s*['"]Tema oscuro['"]/);
    expect(source).toMatch(/lang\s*=\s*['"]en['"]/);
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
