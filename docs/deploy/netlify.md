# Deploying to Netlify

Free tier covers personal sites. The `netlify.toml` below works out of the box.

## netlify.toml

Save this at the repo root if you go with Netlify:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "22"

[[redirects]]
  from = "/dashboard"
  to = "/demos/dashboard"
  status = 301

[[redirects]]
  from = "/data"
  to = "/demos/data"
  status = 301

[[redirects]]
  from = "/data/large"
  to = "/demos/data/large"
  status = 301

[[redirects]]
  from = "/showcase"
  to = "/gallery"
  status = 301
```

Astro 5's own `redirects:` config in `astro.config.mjs` already emits these
redirects as static HTML pages, so the netlify.toml block is belt-and-braces.

## Caveats

- Netlify's free tier includes deploy previews per PR — useful for visual
  regression and ethics-checklist review
- `_headers` file in `public/` lets you add CSP, X-Frame-Options, etc.
- For the contact form (Phase H stretch): Netlify Forms is free up to 100
  submissions/month — change the form action to `/` and add `data-netlify="true"`
