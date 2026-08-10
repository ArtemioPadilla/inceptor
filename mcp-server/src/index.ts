#!/usr/bin/env node
/**
 * stdio entrypoint — the transport Claude Code / most MCP clients expect
 * for a locally-run server (see README.md for the client config snippet).
 */

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createServer } from './server';

const server = createServer();
const transport = new StdioServerTransport();

await server.connect(transport);

// StdioServerTransport writes to stdout for protocol traffic — log to stderr only.
console.error('[inceptor-mcp-server] listening on stdio');
