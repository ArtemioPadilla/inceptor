import { serve } from '@hono/node-server';
import { createApp } from './app';
import { config } from './config';

serve({ fetch: createApp().fetch, port: config.port }, (info) => {
  console.log(`[server-node] listening on http://localhost:${info.port}`);
  console.log(`[server-node] docs at http://localhost:${info.port}/api/docs`);
  console.log(`[server-node] repo=${config.repoSlug} githubAuth=${config.githubToken ? 'token' : 'anonymous'}`);
});
