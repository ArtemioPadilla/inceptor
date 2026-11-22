import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['{src,test}/**/*.test.ts'],
    environment: 'node',
    // Hermetic: config.ts reads GITHUB_TOKEN at import time. A token exported
    // in the developer's shell (common with `gh`) made "503s without a server
    // token" hit the real GitHub API instead — and with a valid token it
    // would create a real issue in REPO_SLUG.
    env: { GITHUB_TOKEN: '', REPO_SLUG: 'test-owner/test-repo' },
  },
});
