---
title: Spec-DD with Zod
description: Cross-boundary types live as Zod schemas, never as TypeScript interfaces.
---

Every cross-boundary type is a Zod schema. Types are derived (`z.infer<typeof X>`),
never authored alongside the schema.

## The rule

A "cross-boundary" type is anything that crosses:
- A network boundary (API request/response)
- A storage boundary (localStorage, IndexedDB, cookies)
- A worker boundary (postMessage payloads)
- A form boundary (user input fields)

For these, `interface Foo { … }` is **forbidden**. Use Zod and derive:

```ts
// src/schemas/feedback.ts
import { z } from 'zod';

export const FeedbackSchema = z.object({
  title: z.string().min(1),
  body: z.string().optional(),
  labels: z.array(z.string()).default([]),
});

// Derived type — no separate interface
export type Feedback = z.infer<typeof FeedbackSchema>;
```

## Where schemas live

- `src/schemas/` — one file per domain object
- Forms: already Zod-backed via `react-hook-form` + `@hookform/resolvers/zod`
- Tests assert *against* schemas:
  `expect(FeedbackSchema.safeParse(input).success).toBe(true)`
- The backend archetype (`server-node/`) uses `@hono/zod-openapi` to produce
  OpenAPI specs from the same schemas → typed client + runtime validation share
  one source

## Why not just TypeScript interfaces?

TypeScript interfaces evaporate at runtime. Zod schemas are runtime validators —
invalid data from the network is caught *before* it reaches application code, not
after a cryptic `undefined is not a function` crash.

Full rationale → [`docs/PRINCIPLES.md §3`](https://github.com/ArtemioPadilla/inceptor/blob/main/docs/PRINCIPLES.md#3-spec-dd--zod-as-the-source-of-truth)
