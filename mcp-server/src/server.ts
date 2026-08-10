/**
 * Server factory — separate from src/index.ts so tests can connect an
 * in-memory transport pair to a freshly created McpServer without spawning a
 * child process. First-version scope (Epic 26): two tools only.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { loadCategoryMap, loadRegistry, readComponentFile } from './registry';

export function createServer(): McpServer {
  const server = new McpServer({
    name: 'inceptor-registry',
    version: '0.1.0',
  });

  server.registerTool(
    'list_components',
    {
      title: 'List components',
      description:
        'List every component in the Inceptor registry, optionally filtered by gallery category ' +
        '(e.g. "forms", "overlays", "data", "gen-ai"). Returns name, title, description, type, and category ' +
        'for each item — call get_component with an item\'s `name` for full detail including file contents.',
      inputSchema: {
        category: z
          .string()
          .optional()
          .describe('Filter to a single gallery category. Omit to list every component.'),
      },
    },
    async ({ category }) => {
      const registry = loadRegistry();
      const categoryMap = await loadCategoryMap();

      const items = registry.items
        .map((item) => ({
          name: item.name,
          title: item.title,
          description: item.description,
          type: item.type,
          category: categoryMap.get(item.name) ?? null,
          fileCount: item.files.length,
        }))
        .filter((item) => !category || item.category === category);

      return {
        content: [{ type: 'text', text: JSON.stringify({ count: items.length, items }, null, 2) }],
      };
    },
  );

  server.registerTool(
    'get_component',
    {
      title: 'Get component',
      description:
        'Return one registry item\'s full detail — title, description, dependencies, registryDependencies, ' +
        'cssVars, and the real contents of every file it references. Use the `name` returned by list_components.',
      inputSchema: {
        name: z.string().describe('The registry item name, e.g. "dialog" or "data-table".'),
      },
    },
    async ({ name }) => {
      const registry = loadRegistry();
      const item = registry.items.find((i) => i.name === name);

      if (!item) {
        const known = registry.items.map((i) => i.name).join(', ');
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: `No registry item named "${name}". Known items: ${known}`,
            },
          ],
        };
      }

      const categoryMap = await loadCategoryMap();
      const filesWithContent = item.files.map((f) => {
        try {
          return { ...f, content: readComponentFile(f.path) };
        } catch (err) {
          return { ...f, content: null, error: err instanceof Error ? err.message : String(err) };
        }
      });

      const detail = {
        ...item,
        category: categoryMap.get(item.name) ?? null,
        files: filesWithContent,
      };

      return {
        content: [{ type: 'text', text: JSON.stringify(detail, null, 2) }],
      };
    },
  );

  return server;
}
