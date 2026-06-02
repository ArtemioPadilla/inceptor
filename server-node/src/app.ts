import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { swaggerUI } from '@hono/swagger-ui';
import { config } from './config';
import { GitHubError } from './lib/github';
import { health } from './routes/health';
import { forms } from './routes/forms';
import { github } from './routes/github';
import { feedback } from './routes/feedback';
import { openApiDoc } from './openapi';

export function createApp(): Hono {
  const app = new Hono();

  app.use('*', cors({ origin: config.corsOrigin }));

  const api = new Hono();
  api.route('/', health);
  api.route('/', forms);
  api.route('/', github);
  api.route('/', feedback);
  api.get('/openapi.json', (c) => c.json(openApiDoc()));
  api.get('/docs', swaggerUI({ url: '/api/openapi.json' }));

  app.route('/api', api);
  app.get('/', (c) => c.redirect('/api/docs'));

  // Central error handler — maps GitHubError's status through, defaults to 500.
  app.onError((err, c) => {
    if (err instanceof GitHubError) {
      return c.json({ error: 'github_error', message: err.message }, err.status as never);
    }
    console.error('[server-node] unhandled error:', err);
    return c.json({ error: 'internal_error', message: err.message }, 500);
  });

  return app;
}
