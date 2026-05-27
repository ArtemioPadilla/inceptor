import { describe, expect, it, beforeEach } from 'vitest';
import { $theme, toggleTheme } from './theme';

// vitest.config.ts uses environment: 'node', so there is no document global.
// The onMount block in theme.ts is gated behind typeof document !== 'undefined',
// so importing this module in Node works cleanly — only the pure atom logic
// is exercised here.

describe('$theme store', () => {
  beforeEach(() => {
    $theme.set('light');
  });

  it('starts at light by default', () => {
    expect($theme.get()).toBe('light');
  });

  it('toggleTheme flips light → dark', () => {
    toggleTheme();
    expect($theme.get()).toBe('dark');
  });

  it('toggleTheme flips dark → light', () => {
    $theme.set('dark');
    toggleTheme();
    expect($theme.get()).toBe('light');
  });

  it('set() accepts an arbitrary theme value', () => {
    $theme.set('dark');
    expect($theme.get()).toBe('dark');
    $theme.set('light');
    expect($theme.get()).toBe('light');
  });
});
