# Deploying to Vercel

Hobby tier: free for non-commercial use. Generous static traffic.

## One-click

1. Sign in at <https://vercel.com/new>
2. Import the GitHub repo
3. Framework preset → **Astro** (auto-detected)
4. Root directory: `.`
5. Build command: `npm run build`
6. Output directory: `dist`
7. Install command: `npm ci`

## vercel.json

Optional; only needed for custom redirects beyond what Astro's `redirects:`
config emits as static HTML:

```json
{
  "cleanUrls": true,
  "trailingSlash": false,
  "headers": [
    {
      "source": "/_pagefind/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=3600, immutable" }
      ]
    }
  ]
}
```

## Caveats

- Vercel Hobby is **non-commercial only** — if this scaffold ships a paid
  product, you need a Pro plan or move to Cloudflare Pages
- Free tier has a 100 GB/month bandwidth cap; for a public template that
  should be fine
- Edge functions / middleware aren't needed for the static build — they'd
  matter only if you add the backend archetype later
