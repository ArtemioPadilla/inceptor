import { Hono } from 'hono';
import { config } from '../config';

export const health = new Hono();

// Liveness probe — used by docker-compose healthcheck and uptime monitors.
health.get('/health', (c) =>
  c.json({
    status: 'ok',
    service: config.service,
    repo: config.repoSlug,
    githubAuth: config.githubToken ? 'token' : 'anonymous',
  }),
);
