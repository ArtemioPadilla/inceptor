import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { openApiDoc } from '../src/openapi';

// The committed golden (openapi.golden.json) is the cross-archetype contract:
// server-flask's pytest compares against it too. If you change the API surface,
// run `npm run gen:openapi` to refresh it.
const golden = JSON.parse(
  readFileSync(fileURLToPath(new URL('../openapi.golden.json', import.meta.url)), 'utf8'),
);

function surface(spec: { paths: Record<string, Record<string, unknown>> }) {
  return Object.fromEntries(
    Object.entries(spec.paths).map(([p, methods]) => [p, Object.keys(methods).sort()]),
  );
}

describe('openapi contract', () => {
  it("the live doc's surface matches the committed golden", () => {
    expect(surface(openApiDoc())).toEqual(surface(golden));
  });
});
