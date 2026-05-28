# Deploying to Cloudflare Pages

Free tier: unlimited static traffic, generous build minutes, custom domain free.
Best fit when you want a CDN-backed static site without a GitHub Pages subpath.

## Connect the repo

1. Sign in at <https://dash.cloudflare.com/?to=/:account/pages>
2. **Create a project** → connect to GitHub → pick this repo
3. Build settings:
   - **Framework preset:** Astro
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Node version:** `22` (set as env var `NODE_VERSION=22`)
4. Optional environment variables (Settings → Environment variables):
   - `PUBLIC_FLAG_BLOG=false` — hide the blog if you don't have content yet
   - `PUBLIC_FLAG_DOCS_SEARCH=true` — enable Pagefind on /docs
   - `ANTHROPIC_API_KEY=…` — only if you also wire the Claude triage workflow

## After first build

- Set a custom domain via the Pages dashboard (free wildcard cert)
- Update `site:` in `astro.config.mjs` to your final URL — the sitemap and OG
  `<meta>` tags use it
- Re-deploy

## Caveats

- Cloudflare Pages does not run `postBuild` outside the build command. Pagefind
  is wired into our `npm run build` script so the search index is part of the
  artifact — no extra config needed.
- For wallet-connect or onion-safe variants (future), Cloudflare's stricter
  CSP can break some external scripts; whitelist them in `_headers` if needed.
