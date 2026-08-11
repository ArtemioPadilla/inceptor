# inceptor-mcp-server

An [MCP](https://modelcontextprotocol.io) server that exposes Inceptor's
component [`registry.json`](../registry.json) to any MCP-aware coding agent
(Claude Code, Claude Desktop, Cursor, etc.) — Epic 26 of `ROADMAP.md`.

This is a **first version**, not a full-featured server: two tools, no
resources, no prompts, no auth. It reads the repo-root `registry.json` and
the real component source files off disk; it does not talk to the network.

## Relationship to `server-node/` / `server-flask/`

Those two directories are the **request-serving backend archetypes** from
Epic 19 / [ADR 0006](../docs/decisions/0006-self-hosted-backend-archetypes.md)
— they implement `/api/*` for a *deployed* Inceptor site (contact forms,
GitHub proxy, feedback). `mcp-server/` is a **dev-tool**: it runs locally,
next to your editor/agent, and helps an LLM understand *this repository's own
component library*. It is a sibling directory, not a third backend archetype,
and it is intentionally excluded from the root `npm run check` pipeline (see
"Testing" below for its own, separate check command).

## Tools

### `list_components`

Lists every item in `registry.json`, optionally filtered by gallery category
(`primitives`, `forms`, `advanced`, `navmenu`, `compound`, `overlays`,
`disclosure`, `feedback`, `data`, `charts`, `motion`, `pwa`, `extras`,
`gen-ai`, `inceptor` — see `src/content/gallery.ts`'s `categoryOrder`).

```json
{ "category": "compound" }
```

Returns `{ count, items: [{ name, title, description, type, category, fileCount }] }`.

### `get_component`

Returns one registry item's full detail — `dependencies`,
`registryDependencies`, `cssVars`, and every referenced file's **real
content** read off disk (not a summary).

```json
{ "name": "dialog" }
```

Returns the registry item plus `files: [{ path, type, content }]`.

## Running it

```bash
cd mcp-server
npm install
npm run dev      # tsx watch src/index.ts — restarts on save
# or
npm start        # tsx src/index.ts — single run
```

The server communicates over **stdio** (the transport MCP clients expect for
a locally-run server) — it prints a one-line "listening on stdio" notice to
**stderr** on startup (stdout is reserved for JSON-RPC protocol traffic; never
`console.log` from `src/index.ts` or `src/server.ts`).

It reads `../registry.json` at request time (not bundled), so if you change
`src/content/gallery.ts` remember to run `npm run gen:registry` from the repo
root first — otherwise the server will serve a stale registry.

## Connecting an MCP client

### Claude Code

Add to your MCP config (project-level `.mcp.json` or via `claude mcp add`):

```json
{
  "mcpServers": {
    "inceptor-registry": {
      "command": "npx",
      "args": ["tsx", "src/index.ts"],
      "cwd": "/absolute/path/to/inceptor/mcp-server"
    }
  }
}
```

Or via the CLI:

```bash
claude mcp add inceptor-registry -- npx tsx /absolute/path/to/inceptor/mcp-server/src/index.ts
```

### Claude Desktop / other MCP clients

Same shape, in `claude_desktop_config.json`'s `mcpServers` block (or the
equivalent config file for your client) — `command: "npx"`,
`args: ["tsx", "src/index.ts"]`, `cwd` pointed at this directory.

## Testing

This package has its **own** test/check commands — they are intentionally
**not** wired into the root `npm run check`:

```bash
cd mcp-server
npm run test         # vitest — in-process client/server smoke test
npm run type-check   # tsc --noEmit
```

`test/server.test.ts` connects a real `@modelcontextprotocol/sdk` `Client` to
a real `McpServer` over the SDK's `InMemoryTransport` pair (no subprocess) and
asserts:

- both tools are advertised (`list_components`, `get_component`)
- `list_components` returns every registry item with the expected shape, and
  a resolved `category` for at least one item (the read-only gallery.ts
  cross-reference)
- `category` filtering actually filters
- `get_component` returns real, non-empty file contents for every referenced
  file
- `get_component` returns an `isError` result (not a thrown exception) for an
  unknown component name

This has also been manually verified end-to-end over the **real stdio
transport** (spawning `npx tsx src/index.ts` as a subprocess via
`StdioClientTransport`, exactly as a real MCP client would) — both tools
responded correctly with live registry data.

## Known limitations (first version)

- No resources or prompts — tools only.
- No pagination — `list_components` returns the full list (item count grows
  as the gallery does; check `registry.json`'s `items.length` for the
  current figure rather than trusting a number here, which will drift)
  in one response. Fine at this scale; would need `registry.json`'s
  `pagination` field wired through if the registry grows much larger.
- No file-content size guard on `get_component` — a very large component file
  would be returned in full. Not a concern at current component sizes.
- Reads `registry.json` and `gallery.ts` fresh on first call per process
  (cached in-memory afterward) — restart the server after regenerating the
  registry.
