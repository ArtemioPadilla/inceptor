/**
 * In-process smoke test — connects a real MCP Client to the real McpServer
 * over the SDK's InMemoryTransport pair (no subprocess, no stdio pipes).
 * Confirms the two tools are advertised correctly and that list_components /
 * get_component return the shapes an agent client would rely on.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { createServer } from '../src/server';

function textOf(result: { content: Array<{ type: string; text?: string }> }): string {
  const block = result.content.find((c) => c.type === 'text');
  if (!block?.text) throw new Error('expected a text content block');
  return block.text;
}

describe('inceptor-mcp-server', () => {
  const server = createServer();
  const client = new Client({ name: 'test-client', version: '0.0.1' });

  beforeAll(async () => {
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    await server.connect(serverTransport);
    await client.connect(clientTransport);
  });

  afterAll(async () => {
    await client.close();
    await server.close();
  });

  it('advertises exactly list_components and get_component', async () => {
    const { tools } = await client.listTools();
    const names = tools.map((t) => t.name).sort();
    expect(names).toEqual(['get_component', 'list_components']);
  });

  it('list_components returns every registry item with the expected shape', async () => {
    const result = await client.callTool({ name: 'list_components', arguments: {} });
    expect(result.isError).toBeFalsy();

    const payload = JSON.parse(textOf(result as any)) as {
      count: number;
      items: Array<{ name: string; title: string; description: string; type: string; category: string | null }>;
    };

    expect(payload.count).toBeGreaterThan(0);
    expect(payload.items.length).toBe(payload.count);
    for (const item of payload.items) {
      expect(typeof item.name).toBe('string');
      expect(typeof item.title).toBe('string');
      expect(typeof item.description).toBe('string');
      expect(typeof item.type).toBe('string');
    }
    // At least one item resolved a real gallery category via the read-only cross-reference.
    expect(payload.items.some((i) => typeof i.category === 'string')).toBe(true);
  });

  it('list_components filters by category', async () => {
    const all = JSON.parse(textOf((await client.callTool({ name: 'list_components', arguments: {} })) as any));
    const someCategory = all.items.find((i: { category: string | null }) => i.category)?.category as string;

    const filtered = JSON.parse(
      textOf((await client.callTool({ name: 'list_components', arguments: { category: someCategory } })) as any),
    );

    expect(filtered.count).toBeGreaterThan(0);
    expect(filtered.items.every((i: { category: string }) => i.category === someCategory)).toBe(true);
  });

  it('get_component returns full detail including file contents', async () => {
    const listResult = await client.callTool({ name: 'list_components', arguments: {} });
    const { items } = JSON.parse(textOf(listResult as any));
    const target = items[0].name as string;

    const result = await client.callTool({ name: 'get_component', arguments: { name: target } });
    expect(result.isError).toBeFalsy();

    const detail = JSON.parse(textOf(result as any));
    expect(detail.name).toBe(target);
    expect(Array.isArray(detail.files)).toBe(true);
    expect(detail.files.length).toBeGreaterThan(0);
    for (const file of detail.files) {
      expect(typeof file.path).toBe('string');
      expect(typeof file.content).toBe('string');
      expect(file.content.length).toBeGreaterThan(0);
    }
  });

  it('get_component reports an error result for an unknown name', async () => {
    const result = await client.callTool({ name: 'get_component', arguments: { name: 'does-not-exist' } });
    expect(result.isError).toBe(true);
    expect(textOf(result as any)).toMatch(/No registry item named/);
  });
});
