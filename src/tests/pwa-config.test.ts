import { describe, expect, it } from 'vitest';
// Import the raw source of astro.config.mjs so we can assert on the text without
// actually executing the Astro/Vite module graph (which would require a full build
// environment). This is the same pattern used by other config-assertion tests in
// this project.
import config from '../../astro.config.mjs?raw';

describe('astro.config.mjs PWA setup', () => {
  it('imports @vite-pwa/astro', () => {
    expect(config).toMatch(/from\s+['"]@vite-pwa\/astro['"]/);
  });

  it('registers AstroPWA in integrations[]', () => {
    expect(config).toMatch(/AstroPWA\s*\(/);
  });

  it("uses 'autoUpdate' registerType", () => {
    expect(config).toMatch(/registerType:\s*['"]autoUpdate['"]/);
  });

  it('declares a manifest with required fields', () => {
    expect(config).toMatch(/short_name/);
    expect(config).toMatch(/theme_color/);
    expect(config).toMatch(/start_url/);
  });

  it('caches the GitHub API with StaleWhileRevalidate', () => {
    // The urlPattern regex in astro.config.mjs reads `/^https:\/\/api\.github\.com\/.*$/`.
    // When Vite imports the file with ?raw, the backslashes are kept verbatim, so
    // the dot in "github.com" appears as "github\.com" in the string —
    // asserting on "github-api" (the cacheName) sidesteps the escaping issue
    // while still proving the GitHub API cache rule is present.
    expect(config).toContain('github-api');
    expect(config).toMatch(/StaleWhileRevalidate/);
  });
});
