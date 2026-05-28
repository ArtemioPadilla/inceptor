import { describe, expect, it } from 'vitest';
import { flags } from './flags';

describe('feature flags', () => {
  it('declares a channel marker', () => {
    expect(['production', 'preview', 'development']).toContain(flags.channel);
  });

  it('defaults feedbackFab to true', () => {
    // No PUBLIC_FLAG_FEEDBACK_FAB env var set in the test runner → default
    expect(flags.feedbackFab).toBe(true);
  });

  it('defaults experimentalGallery to false', () => {
    expect(flags.experimentalGallery).toBe(false);
  });

  it('exposes a stable shape (snapshot of keys)', () => {
    // Guards against accidental removal of a flag the consumer relies on.
    const keys = Object.keys(flags).sort();
    expect(keys).toEqual(
      [
        'blog',
        'channel',
        'docsSearch',
        'experimentalGallery',
        'feedbackFab',
        'pwaPrompts',
      ].sort(),
    );
  });
});
