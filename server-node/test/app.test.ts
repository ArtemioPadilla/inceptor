import { afterEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/app';

const app = createApp();

function postJson(path: string, body: unknown) {
  return app.request(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

afterEach(() => vi.restoreAllMocks());

describe('health', () => {
  it('reports the node service', async () => {
    const res = await app.request('/api/health');
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toMatchObject({ status: 'ok', service: 'node' });
  });
});

describe('contact', () => {
  const valid = { name: 'Ada', email: 'ada@example.com', message: 'Hello there, friend.', website: '' };

  it('accepts a valid submission', async () => {
    const res = await postJson('/api/contact', valid);
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ok: true, received: 'contact' });
  });

  it('rejects a bad email with 422 + structured errors', async () => {
    const res = await postJson('/api/contact', { ...valid, email: 'nope' });
    expect(res.status).toBe(422);
    const json = await res.json();
    expect(json.error).toBe('validation_failed');
    expect(json.errors.some((e: { path: string }) => e.path === 'email')).toBe(true);
  });

  it('rejects a filled honeypot', async () => {
    const res = await postJson('/api/contact', { ...valid, website: 'http://spam' });
    expect(res.status).toBe(422);
  });
});

describe('newsletter', () => {
  it('accepts a valid email', async () => {
    const res = await postJson('/api/newsletter', { email: 'a@b.com', website: '' });
    expect(res.status).toBe(200);
  });
  it('422s an invalid email', async () => {
    const res = await postJson('/api/newsletter', { email: 'x', website: '' });
    expect(res.status).toBe(422);
  });
});

describe('github proxy', () => {
  it('lists issues and filters out PRs', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify([
          { id: 1, number: 1, title: 'a real issue', html_url: 'u', state: 'open', user: { login: 'x', avatar_url: '' }, labels: [], created_at: '' },
          { id: 2, number: 2, title: 'a PR', html_url: 'u', state: 'open', user: { login: 'x', avatar_url: '' }, labels: [], created_at: '', pull_request: { url: 'p' } },
        ]),
        { status: 200 },
      ),
    );
    const res = await app.request('/api/issues?state=open&per_page=30');
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toHaveLength(1);
    expect(json[0].title).toBe('a real issue');
  });

  it('maps a GitHub failure status through', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('nope', { status: 403 }));
    const res = await app.request('/api/issues');
    expect(res.status).toBe(403);
  });
});

describe('feedback', () => {
  it('503s without a server token', async () => {
    const res = await postJson('/api/feedback', {
      title: 'Bug report',
      body: 'Something broke on the page.',
      website: '',
    });
    expect(res.status).toBe(503);
  });
});

describe('openapi', () => {
  it('serves a 3.1 doc with the request paths', async () => {
    const res = await app.request('/api/openapi.json');
    expect(res.status).toBe(200);
    const doc = await res.json();
    expect(doc.openapi).toBe('3.1.0');
    expect(Object.keys(doc.paths)).toEqual(
      expect.arrayContaining(['/api/contact', '/api/newsletter', '/api/issues', '/api/feedback']),
    );
    // The contact body is generated from the shared Zod schema.
    const body = doc.paths['/api/contact'].post.requestBody.content['application/json'].schema;
    expect(body.properties).toHaveProperty('email');
    expect(body.properties).toHaveProperty('message');
  });
});

describe('root', () => {
  it('redirects to the docs', async () => {
    const res = await app.request('/');
    expect(res.status).toBe(302);
    expect(res.headers.get('location')).toBe('/api/docs');
  });
});
