import { describe, expect, it } from 'vitest';
import source from '../pages/showcase.astro?raw';

// These tests verify that the /showcase page wiring is correct by inspecting
// the raw source. They guard against accidental removal of island imports or
// hydration directives during refactors — without requiring a browser.

describe('showcase.astro', () => {
  it('imports ShowcaseSimples', () => {
    expect(source).toMatch(/import\s+ShowcaseSimples/);
  });

  it('imports ShowcaseDialog', () => {
    expect(source).toMatch(/import\s+ShowcaseDialog/);
  });

  it('imports ShowcaseDropdown', () => {
    expect(source).toMatch(/import\s+ShowcaseDropdown/);
  });

  it('imports ShowcaseTabs', () => {
    expect(source).toMatch(/import\s+ShowcaseTabs/);
  });

  it('imports ShowcaseToast', () => {
    expect(source).toMatch(/import\s+ShowcaseToast/);
  });

  it('imports ShowcaseForm', () => {
    expect(source).toMatch(/import\s+ShowcaseForm/);
  });

  it('uses client:visible directive (below-the-fold hydration)', () => {
    expect(source).toMatch(/client:visible/);
  });

  it('has at least one dark-classed wrapper (dark column)', () => {
    // The dark column wraps content in a div with class="dark …"
    expect(source).toMatch(/class="dark /);
  });

  it('has at least one default-themed wrapper (light column)', () => {
    // The light column uses bg-background without the dark class
    expect(source).toMatch(/bg-background/);
  });

  it('does not import from framer-motion', () => {
    expect(source).not.toMatch(/from ['"]framer-motion['"]/);
  });

  it('does not use client:load (reserved for critical islands only)', () => {
    expect(source).not.toMatch(/client:load/);
  });
});
