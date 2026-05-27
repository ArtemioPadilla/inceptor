import { describe, expect, it } from 'vitest';

// ThemeToggle.astro renders an inline <script> that depends on DOM globals.
// We don't fully render it; we just verify the file exists and the script
// contains the expected behaviour hooks via source inspection.
import fs from 'node:fs';
import path from 'node:path';

describe('ThemeToggle.astro', () => {
  const source = fs.readFileSync(
    path.resolve(__dirname, 'ThemeToggle.astro'),
    'utf8',
  );

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
