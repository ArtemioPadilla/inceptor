import { Hono } from 'hono';
import { listIssues, repoStats } from '../lib/github';

export const github = new Hono();

// Token-backed proxy for the Dashboard / IssuesList islands. Lifts the
// 60 req/h unauthenticated cap and removes the browser-side CORS exposure.
github.get('/issues', async (c) => {
  const stateParam = c.req.query('state') ?? 'open';
  const state = (['open', 'closed', 'all'].includes(stateParam) ? stateParam : 'open') as
    | 'open'
    | 'closed'
    | 'all';
  const perPage = Math.min(Math.max(Number(c.req.query('per_page') ?? 30) || 30, 1), 100);
  return c.json(await listIssues(state, perPage));
});

github.get('/repo-stats', async (c) => c.json(await repoStats()));
