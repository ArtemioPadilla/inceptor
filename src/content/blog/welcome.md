---
title: Welcome to your blog
description: A starter post — replace with something real, or delete the blog if you don't need one.
pubDate: 2026-05-28
tags:
  - meta
  - getting-started
---

This is a placeholder post for the blog scaffold that ships with
inceptor.

If you want a blog, edit this post and add more files under
`src/content/blog/`. They're automatically picked up by the content
collection defined in `src/content.config.ts`.

If you don't want a blog, set the `PUBLIC_FLAG_BLOG=false` env var to
hide the `/blog` route, or delete:

- `src/pages/blog/`
- `src/content/blog/`
- the `blog` collection in `src/content.config.ts`

## Why a content collection?

Content collections give you:

- **Type safety** — the frontmatter schema is enforced at build time
- **Automatic routing** — every `.md`/`.mdx` becomes a route
- **MDX support** — embed React components in posts when you want them

## Frontmatter schema

```yaml
title: string             # required
description: string       # required
pubDate: date             # required (ISO format)
updatedDate?: date
tags?: string[]
draft?: boolean           # default false; drafts hidden from /blog index
author?: string           # default 'artemiopadilla'
```

Draft posts (`draft: true`) are hidden from the `/blog` index but still
build at their slug — useful for sharing preview URLs.
