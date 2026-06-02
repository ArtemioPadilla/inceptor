import { describe, expect, it } from 'vitest';
import source from './IssuesList.tsx?raw';

describe('IssuesList', () => {
  it('default exports a React component', () => {
    expect(source).toMatch(/export default function IssuesList/);
  });

  it('wraps inner component in QueryProvider with isolated idbKey', () => {
    expect(source).toMatch(/QueryProvider/);
    expect(source).toMatch(/idbKey=["']tanstack-query-cache-issues["']/);
  });

  it('uses useQuery with meta.persist = true', () => {
    expect(source).toMatch(/useQuery</);
    expect(source).toMatch(/meta:\s*\{\s*persist:\s*true\s*\}/);
  });

  it('renders loading, error, and empty states', () => {
    expect(source).toMatch(/IssuesSkeleton/);
    expect(source).toMatch(/IssuesError/);
    expect(source).toMatch(/IssuesEmpty/);
  });

  it('filters out PRs (issues API includes them)', () => {
    expect(source).toMatch(/pull_request/);
  });

  it('reads issues for this repo via the api helper (backend proxy or GitHub)', () => {
    // The concrete URL now lives in src/lib/api.ts (githubIssuesUrl), which
    // routes through the backend proxy when PUBLIC_API_BASE is set and falls
    // back to api.github.com otherwise. See src/lib/api.test.ts for the URL.
    expect(source).toMatch(/githubIssuesUrl/);
    expect(source).toMatch(/from ['"]@\/lib\/api['"]/);
    expect(source).toMatch(/ArtemioPadilla\/inceptor/);
  });

  it('does not import from framer-motion', () => {
    expect(source).not.toMatch(/from ['"]framer-motion['"]/);
  });

  it('does not import from @radix-ui', () => {
    expect(source).not.toMatch(/from ['"]@radix-ui/);
  });

  it('exposes a Retry action via useQueryClient', () => {
    expect(source).toMatch(/useQueryClient/);
    expect(source).toMatch(/Retry/);
  });
});
