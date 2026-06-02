/**
 * Thin GitHub REST client. Lives server-side so the token never reaches the
 * browser and the 60 req/h unauthenticated cap is lifted when a token is set.
 */
import { config } from '../config';

const GH = 'https://api.github.com';

/** Carries an HTTP status so the central error handler can map it through. */
export class GitHubError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'GitHubError';
  }
}

function headers(extra: Record<string, string> = {}): Record<string, string> {
  const h: Record<string, string> = {
    accept: 'application/vnd.github+json',
    'user-agent': 'inceptor-server-node',
    'x-github-api-version': '2022-11-28',
    ...extra,
  };
  if (config.githubToken) h.authorization = `Bearer ${config.githubToken}`;
  return h;
}

export interface IssueSummary {
  id: number;
  number: number;
  title: string;
  html_url: string;
  state: string;
  user: { login: string; avatar_url: string };
  labels: { id: number; name: string; color: string }[];
  created_at: string;
}

/** List issues (PRs filtered out), mirroring what the islands expect. */
export async function listIssues(
  state: 'open' | 'closed' | 'all',
  perPage: number,
): Promise<IssueSummary[]> {
  const url = `${GH}/repos/${config.repoSlug}/issues?state=${state}&per_page=${perPage}`;
  const res = await fetch(url, { headers: headers() });
  if (!res.ok) throw new GitHubError(res.status, `GitHub issues: ${res.status}`);
  const raw = (await res.json()) as (IssueSummary & { pull_request?: unknown })[];
  return raw
    .filter((i) => !i.pull_request)
    .map((i) => ({
      id: i.id,
      number: i.number,
      title: i.title,
      html_url: i.html_url,
      state: i.state,
      user: { login: i.user?.login ?? '', avatar_url: i.user?.avatar_url ?? '' },
      labels: (i.labels ?? []).map((l) => ({ id: l.id, name: l.name, color: l.color })),
      created_at: i.created_at,
    }));
}

export interface RepoStats {
  full_name: string;
  description: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  html_url: string;
}

export async function repoStats(): Promise<RepoStats> {
  const res = await fetch(`${GH}/repos/${config.repoSlug}`, { headers: headers() });
  if (!res.ok) throw new GitHubError(res.status, `GitHub repo: ${res.status}`);
  const r = (await res.json()) as RepoStats;
  return {
    full_name: r.full_name,
    description: r.description,
    stargazers_count: r.stargazers_count,
    forks_count: r.forks_count,
    open_issues_count: r.open_issues_count,
    html_url: r.html_url,
  };
}

export interface CreatedIssue {
  url: string;
  number: number;
}

/** Create an issue. Requires a token; without one, callers get a clean 503. */
export async function createIssue(input: {
  title: string;
  body: string;
  labels?: string[];
}): Promise<CreatedIssue> {
  if (!config.githubToken) {
    throw new GitHubError(503, 'Feedback requires GITHUB_TOKEN on the server.');
  }
  const res = await fetch(`${GH}/repos/${config.repoSlug}/issues`, {
    method: 'POST',
    headers: headers({ 'content-type': 'application/json' }),
    body: JSON.stringify({ title: input.title, body: input.body, labels: input.labels }),
  });
  if (!res.ok) throw new GitHubError(res.status, `GitHub create issue: ${res.status}`);
  const r = (await res.json()) as { html_url: string; number: number };
  return { url: r.html_url, number: r.number };
}
