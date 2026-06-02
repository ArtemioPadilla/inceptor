/**
 * OpenAPI 3.1 document generated from the shared Zod schemas via zod 4's
 * native `z.toJSONSchema()` — the request bodies are the *same* contracts the
 * frontend forms validate against. The Flask archetype emits the same document
 * shape; `server-node/test/contract.test.ts` (and the Python equivalent) keep
 * them aligned.
 */
import { z } from 'zod';
import { ContactSchema, NewsletterSchema, FeedbackSchema } from './schemas';

type Json = Record<string, unknown>;

function jsonSchema(schema: z.ZodType): Json {
  const out = z.toJSONSchema(schema) as Json;
  delete out.$schema;
  return out;
}

const jsonBody = (schema: z.ZodType) => ({
  required: true,
  content: { 'application/json': { schema: jsonSchema(schema) } },
});

const ok = (description: string, example?: Json) => ({
  description,
  content: { 'application/json': { schema: { type: 'object' }, ...(example ? { example } : {}) } },
});

export function openApiDoc(): Json {
  return {
    openapi: '3.1.0',
    info: {
      title: 'Inceptor backend API',
      version: '0.1.0',
      description:
        'Self-hosted backend for Inceptor. Request bodies are the shared Zod ' +
        'schemas from src/schemas/. See ADR 0006.',
    },
    servers: [{ url: '/' }],
    paths: {
      '/api/health': {
        get: { summary: 'Liveness probe', responses: { 200: ok('Service is up') } },
      },
      '/api/contact': {
        post: {
          summary: 'Submit the contact form',
          requestBody: jsonBody(ContactSchema),
          responses: { 200: ok('Accepted'), 422: ok('Validation failed') },
        },
      },
      '/api/newsletter': {
        post: {
          summary: 'Subscribe to the newsletter',
          requestBody: jsonBody(NewsletterSchema),
          responses: { 200: ok('Accepted'), 422: ok('Validation failed') },
        },
      },
      '/api/issues': {
        get: {
          summary: 'List repo issues (token proxy, PRs filtered out)',
          parameters: [
            {
              name: 'state',
              in: 'query',
              schema: { type: 'string', enum: ['open', 'closed', 'all'], default: 'open' },
            },
            {
              name: 'per_page',
              in: 'query',
              schema: { type: 'integer', minimum: 1, maximum: 100, default: 30 },
            },
          ],
          responses: { 200: ok('Array of issues') },
        },
      },
      '/api/repo-stats': {
        get: { summary: 'Repo stars / forks / open issues', responses: { 200: ok('Stats') } },
      },
      '/api/feedback': {
        post: {
          summary: 'Create a GitHub issue from in-app feedback',
          requestBody: jsonBody(FeedbackSchema),
          responses: {
            201: ok('Issue created'),
            422: ok('Validation failed'),
            503: ok('Server has no GITHUB_TOKEN'),
          },
        },
      },
    },
  };
}
